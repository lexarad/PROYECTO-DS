import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { prisma } from '@/lib/prisma'
import { sendConfirmacionPago, sendFacturaEmail, sendConfirmacionReembolso, sendCreditoReferido } from '@/lib/email'
import { notificarNuevaTramitacion } from '@/lib/tramitacion'
import { procesarCreditoReferido } from '@/lib/referidos'
import { Resend } from 'resend'

let resendInstance: Resend | null = null

function getResend() {
  if (!resendInstance) {
    resendInstance = new Resend(process.env.RESEND_API_KEY || 're_placeholder_for_build')
  }
  return resendInstance
}

const FROM = process.env.EMAIL_FROM ?? 'CertiDocs <noreply@certidocs.es>'
import { crearFactura } from '@/lib/factura'
import { crearNotificacion } from '@/lib/notificaciones'
import { crearJob } from '@/lib/automatizacion/runner'
import Stripe from 'stripe'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  const body = await req.text()
  const sig = req.headers.get('stripe-signature')

  if (!sig) return NextResponse.json({ error: 'Sin firma' }, { status: 400 })
  if (!process.env.STRIPE_WEBHOOK_SECRET) return NextResponse.json({ error: 'Configuración incompleta' }, { status: 500 })

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET)
  } catch {
    return NextResponse.json({ error: 'Firma inválida' }, { status: 400 })
  }

  // Log every event for auditing
  const logEntry = await (prisma as any).webhookEvent.upsert({
    where: { stripeId: event.id },
    update: {},
    create: {
      stripeId: event.id,
      tipo: event.type,
      payload: event as object,
      procesado: false,
    },
  }).catch(() => null)

  try {
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session
      const solicitudId = session.metadata?.solicitudId

      if (solicitudId) {
        const existing = await prisma.solicitud.findUnique({
          where: { id: solicitudId },
          select: { pagado: true, codigoPromo: true },
        })

        if (!existing?.pagado) {
          const solicitud = await prisma.solicitud.update({
            where: { id: solicitudId },
            data: {
              pagado: true,
              estado: 'EN_PROCESO',
              historial: { create: { estado: 'EN_PROCESO', nota: 'Pago confirmado por Stripe' } },
            },
            include: { user: { select: { email: true, name: true, plan: true } } },
          })

          const emailTo = solicitud.user?.email ?? solicitud.emailInvitado
          const nombreTo = solicitud.user?.name ?? solicitud.emailInvitado ?? 'Cliente'
          const factura = await crearFactura(solicitud.id).catch(console.error)

          if (emailTo) {
            const datosEntrega = solicitud.datos as Record<string, string> | null
            const entregaInfo = datosEntrega?.metodo_entrega === 'postal' ? {
              metodo: 'postal' as const,
              nombre: datosEntrega.postal_nombre,
              direccion: datosEntrega.postal_direccion,
              cp: datosEntrega.postal_cp,
              ciudad: datosEntrega.postal_ciudad,
              pais: datosEntrega.postal_pais,
            } : { metodo: 'email' as const }

            sendConfirmacionPago({
              to: emailTo,
              nombre: nombreTo,
              tipoCertificado: solicitud.tipo,
              referencia: solicitud.referencia!,
              precio: solicitud.precio,
              esInvitado: !solicitud.userId,
              facturaId: factura?.id,
              entrega: entregaInfo,
            }).catch(console.error)

            if (factura) {
              sendFacturaEmail({
                to: emailTo,
                nombre: nombreTo,
                facturaId: factura.id,
                numero: factura.numero,
              }).catch(console.error)
            }
          }

          // Notificación in-app al cliente
          if (solicitud.userId) {
            crearNotificacion(
              solicitud.userId,
              'PAGO',
              'Pago confirmado',
              `Tu solicitud ${solicitud.referencia ?? ''} está en proceso de tramitación.`,
              `/dashboard/solicitudes/${solicitud.id}`,
            ).catch(console.error)
          }

          // Crear job de automatización si el tipo es automatizable
          crearJob(solicitud.id, solicitud.tipo).catch(console.error)

          // Incrementar usos del código promo si se aplicó uno
          if (solicitud.codigoPromo) {
            ;(prisma as any).codigoPromo.update({
              where: { codigo: solicitud.codigoPromo },
              data: { usos: { increment: 1 } },
            }).catch(console.error)
          }

          // Crédito de referido: primer pago de un usuario que llegó por referral
          if (solicitud.userId) {
            procesarCreditoReferido(solicitud.userId).then(async (credito) => {
              if (!credito) return
              const referidor = await prisma.user.findUnique({
                where: { id: credito.userId },
                select: { email: true },
              })
              if (referidor?.email) {
                sendCreditoReferido({
                  to: referidor.email,
                  codigoPromo: credito.codigoPromo,
                  descuento: 15,
                  diasValidez: 90,
                }).catch(console.error)
              }
            }).catch(console.error)
          }

          notificarNuevaTramitacion({
            solicitudId: solicitud.id,
            referencia: solicitud.referencia!,
            tipo: solicitud.tipo,
            datos: solicitud.datos as Record<string, unknown>,
            precio: solicitud.precio,
            emailCliente: emailTo ?? null,
            nombreCliente: nombreTo,
            facturaNumero: factura?.numero,
            planCliente: solicitud.user?.plan,
          }).catch(console.error)

          // Marcar webhook como procesado
          await prisma.webhookEvent.update({
            where: { stripeId: event.id },
            data: { procesado: true }
          }).catch(console.error)
        }
      }
    }

    // Subscription lifecycle events
    if (event.type === 'customer.subscription.updated' || event.type === 'customer.subscription.deleted') {
      const sub = event.data.object as Stripe.Subscription
      const customerId = sub.customer as string

      const user = await prisma.user.findFirst({ where: { stripeCustomerId: customerId } })
      if (user) {
        if (event.type === 'customer.subscription.deleted' || sub.status === 'canceled') {
          await prisma.user.update({
            where: { id: user.id },
            data: { plan: 'FREE', stripeSubscriptionId: null },
          })
        } else if (sub.status === 'active') {
          // Determine plan from price ID
          const priceId = sub.items.data[0]?.price.id
          const isPro = priceId === process.env.STRIPE_PRICE_PRO
          const isEnterprise = priceId === process.env.STRIPE_PRICE_ENTERPRISE
          const newPlan = isEnterprise ? 'ENTERPRISE' : isPro ? 'PRO' : 'FREE'
          await prisma.user.update({
            where: { id: user.id },
            data: { plan: newPlan as any, stripeSubscriptionId: sub.id },
          })
        }
      }
    }

    if (event.type === 'checkout.session.completed') {
      const checkoutSession = event.data.object as Stripe.Checkout.Session
      // Handle subscription checkout (mode=subscription)
      if (checkoutSession.mode === 'subscription' && checkoutSession.subscription) {
        const customerId = checkoutSession.customer as string
        const sub = await stripe.subscriptions.retrieve(checkoutSession.subscription as string)
        const priceId = sub.items.data[0]?.price.id
        const isPro = priceId === process.env.STRIPE_PRICE_PRO
        const isEnterprise = priceId === process.env.STRIPE_PRICE_ENTERPRISE
        const newPlan = isEnterprise ? 'ENTERPRISE' : isPro ? 'PRO' : 'FREE'

        await prisma.user.update({
          where: { stripeCustomerId: customerId },
          data: { plan: newPlan as any, stripeSubscriptionId: sub.id },
        }).catch(console.error)
      }
    }

    // Reembolso iniciado desde Stripe dashboard (o desde nuestra API)
    if (event.type === 'charge.refunded') {
      const charge = event.data.object as Stripe.Charge
      const paymentIntentId = charge.payment_intent as string | null
      if (paymentIntentId) {
        const solicitud = await prisma.solicitud.findFirst({
          where: { stripeSessionId: { not: null } },
          // No podemos buscar directamente por payment_intent; buscamos via sessions
          // Stripe no lo indexa por payment_intent en la solicitud — buscamos por stripeSessionId
          // Este handler es el fallback para reembolsos desde el dashboard de Stripe
          include: { user: { select: { email: true, name: true } } },
        }).catch(() => null)

        // Buscar la solicitud cuyo checkout session tiene este payment_intent
        const sessions = await stripe.checkout.sessions.list({
          payment_intent: paymentIntentId,
          limit: 1,
        }).catch(() => null)

        const sessionId = sessions?.data[0]?.id
        if (sessionId) {
          const sol = await prisma.solicitud.findUnique({
            where: { stripeSessionId: sessionId },
            include: { user: { select: { email: true, name: true } } },
          })
          if (sol && sol.estado !== 'RECHAZADA') {
            await prisma.solicitud.update({
              where: { id: sol.id },
              data: {
                estado: 'RECHAZADA',
                historial: {
                  create: {
                    estado: 'RECHAZADA',
                    nota: `Reembolso recibido desde Stripe. Cargo: ${charge.id}. Importe: ${(charge.amount_refunded / 100).toFixed(2)} €`,
                  },
                },
              },
            })
            const emailTo = sol.user?.email ?? sol.emailInvitado
            if (emailTo) {
              sendConfirmacionReembolso({
                to: emailTo,
                nombre: sol.user?.name ?? emailTo.split('@')[0],
                tipoCertificado: sol.tipo,
                referencia: sol.referencia ?? sol.id,
                importe: charge.amount_refunded / 100,
              }).catch(console.error)
            }
          }
        }
        // Suppress unused variable warning
        void solicitud
      }
    }

    // Disputa / chargeback — hay 7 días para responder o se pierde automáticamente
    if (event.type === 'charge.dispute.created') {
      const dispute = event.data.object as Stripe.Dispute
      const charge = dispute.charge as string

      // Buscar la solicitud asociada
      const sessions = await stripe.checkout.sessions.list({ limit: 5 }).catch(() => null)
      // Buscar por charge directamente en nuestros datos
      const adminEmail = process.env.ADMIN_EMAIL ?? 'info@certidocs.es'

      await getResend().emails.send({
        from: FROM,
        to: adminEmail,
        subject: `🚨 DISPUTA Stripe — acción requerida en 7 días (${dispute.id})`,
        html: `
          <div style="font-family:sans-serif;max-width:580px;margin:0 auto">
            <div style="background:#7c3aed;padding:20px 24px;border-radius:8px 8px 0 0">
              <h2 style="color:#fff;margin:0">🚨 Disputa / Chargeback recibido</h2>
              <p style="color:#ddd6fe;margin:4px 0 0;font-size:13px">Tienes 7 días para responder o perderás el importe</p>
            </div>
            <div style="padding:20px 24px;border:1px solid #e5e7eb;border-top:none;background:#faf5ff;border-radius:0 0 8px 8px">
              <table style="width:100%;border-collapse:collapse;margin-bottom:16px">
                <tr><td style="padding:4px 0;color:#6b7280;font-size:13px;width:130px">ID Disputa</td><td style="font-family:monospace;font-size:13px">${dispute.id}</td></tr>
                <tr><td style="padding:4px 0;color:#6b7280;font-size:13px">Cargo</td><td style="font-family:monospace;font-size:13px">${charge}</td></tr>
                <tr><td style="padding:4px 0;color:#6b7280;font-size:13px">Importe</td><td style="font-size:13px;font-weight:600">${(dispute.amount / 100).toFixed(2)} ${dispute.currency.toUpperCase()}</td></tr>
                <tr><td style="padding:4px 0;color:#6b7280;font-size:13px">Motivo</td><td style="font-size:13px;font-weight:600;color:#7c3aed">${dispute.reason}</td></tr>
              </table>
              <a href="https://dashboard.stripe.com/disputes/${dispute.id}"
                 style="display:inline-block;background:#7c3aed;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none;font-size:13px;font-weight:600">
                Responder disputa en Stripe →
              </a>
              <p style="font-size:12px;color:#7c3aed;margin:12px 0 0;font-weight:600">
                ⚠️ Sin respuesta en 7 días el banco falla automáticamente a favor del cliente.
              </p>
            </div>
          </div>
        `,
      }).catch(console.error)

      // Registrar también en los logs del webhook
      void sessions
    }

    // Mark as processed
    if (logEntry) {
      await (prisma as any).webhookEvent.update({
        where: { id: logEntry.id },
        data: { procesado: true },
      }).catch(() => null)
    }
  } catch (err) {
    // Log the error but return 200 to avoid Stripe retrying indefinitely
    if (logEntry) {
      await (prisma as any).webhookEvent.update({
        where: { id: logEntry.id },
        data: { error: String(err) },
      }).catch(() => null)
    }
    console.error('Webhook error:', err)
  }

  return NextResponse.json({ ok: true })
}
