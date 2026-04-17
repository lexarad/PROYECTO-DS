import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { prisma } from '@/lib/prisma'
import { sendConfirmacionPago } from '@/lib/email'
import { notificarNuevaTramitacion } from '@/lib/tramitacion'
import Stripe from 'stripe'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  const body = await req.text()
  const sig = req.headers.get('stripe-signature')

  if (!sig) return NextResponse.json({ error: 'Sin firma' }, { status: 400 })

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch {
    return NextResponse.json({ error: 'Firma inválida' }, { status: 400 })
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session
    const solicitudId = session.metadata?.solicitudId

    if (!solicitudId) return NextResponse.json({ ok: true })

    // Check if already processed (idempotency)
    const existing = await prisma.solicitud.findUnique({
      where: { id: solicitudId },
      select: { pagado: true },
    })
    if (existing?.pagado) return NextResponse.json({ ok: true })

    const solicitud = await prisma.solicitud.update({
      where: { id: solicitudId },
      data: {
        pagado: true,
        estado: 'EN_PROCESO',
        historial: { create: { estado: 'EN_PROCESO', nota: 'Pago confirmado por Stripe' } },
      },
      include: { user: true },
    })

    const emailTo = solicitud.user?.email ?? solicitud.emailInvitado
    const nombreTo = solicitud.user?.name ?? solicitud.emailInvitado ?? 'Cliente'

    // Email confirmación al cliente
    if (emailTo) {
      sendConfirmacionPago({
        to: emailTo,
        nombre: nombreTo,
        tipoCertificado: solicitud.tipo,
        referencia: solicitud.referencia!,
        precio: solicitud.precio,
        esInvitado: !solicitud.userId,
      }).catch(console.error)
    }

    // Notificación al admin para tramitar
    notificarNuevaTramitacion({
      solicitudId: solicitud.id,
      referencia: solicitud.referencia!,
      tipo: solicitud.tipo,
      datos: solicitud.datos as Record<string, unknown>,
      precio: solicitud.precio,
      emailCliente: emailTo ?? null,
      nombreCliente: nombreTo,
    }).catch(console.error)
  }

  return NextResponse.json({ ok: true })
}
