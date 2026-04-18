import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { stripe } from '@/lib/stripe'
import { getCertificado } from '@/lib/certificados'
import { sendPedidoRecibido } from '@/lib/email'
import { TipoCertificado } from '@prisma/client'

export async function POST(req: NextRequest) {
  try {
    const { tipo, datos, email, codigoPromo } = await req.json()

    // Validar email
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'Email inválido.' }, { status: 400 })
    }

    const config = getCertificado(tipo)
    if (!config) {
      return NextResponse.json({ error: 'Tipo de certificado inválido.' }, { status: 400 })
    }

    const tasaImporte = config.requiresTasa ? (config.tasaImporte ?? 0) : 0
    let precio = config.precio
    let descuentoAplicado: number | null = null
    let codigoPromoValidado: string | null = null

    if (codigoPromo) {
      const promo = await (prisma as any).codigoPromo.findUnique({
        where: { codigo: codigoPromo.toUpperCase() },
      })
      if (promo && promo.activo && !(promo.expira && new Date(promo.expira) < new Date()) &&
          !(promo.maxUsos !== null && promo.usos >= promo.maxUsos)) {
        descuentoAplicado = promo.descuento
        codigoPromoValidado = promo.codigo
        precio = parseFloat((precio * (1 - promo.descuento / 100)).toFixed(2))
        await (prisma as any).codigoPromo.update({
          where: { codigo: promo.codigo },
          data: { usos: { increment: 1 } },
        })
      }
    }

    const referencia = `CD-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`

    // Crear solicitud sin userId (invitado)
    const solicitud = await prisma.solicitud.create({
      data: {
        userId: null,
        emailInvitado: email.toLowerCase().trim(),
        tipo: tipo as TipoCertificado,
        datos,
        precio,
        referencia,
        ...(tasaImporte > 0 ? { tasaImporte } : {}),
        ...(codigoPromoValidado ? { codigoPromo: codigoPromoValidado, descuentoAplicado } : {}),
      },
    })

    const baseUrl = (process.env.NEXTAUTH_URL ?? 'http://localhost:3000').replace(/\/$/, '')

    // Crear Stripe checkout directamente
    const checkout = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      customer_email: email,
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: 'eur',
            unit_amount: Math.round(solicitud.precio * 100),
            product_data: {
              name: config.label,
              description: `Referencia: ${referencia}`,
            },
          },
        },
        ...(tasaImporte > 0 ? [{
          quantity: 1,
          price_data: {
            currency: 'eur',
            unit_amount: Math.round(tasaImporte * 100),
            product_data: {
              name: 'Tasa Ministerio de Justicia',
              description: config.tasaDescripcion ?? 'Modelo 790 Código 006',
            },
          },
        }] : []),
      ],
      metadata: {
        solicitudId: solicitud.id,
        invitado: 'true',
      },
      success_url: `${baseUrl}/pago/exito?ref=${referencia}&invitado=1`,
      cancel_url: `${baseUrl}/solicitar/${tipo}?cancelado=1`,
    })

    // Guardar stripeSessionId
    await prisma.solicitud.update({
      where: { id: solicitud.id },
      data: { stripeSessionId: checkout.id },
    })

    // Email de pedido recibido con link de pago
    sendPedidoRecibido({
      to: email,
      tipoCertificado: tipo,
      referencia,
      precio: solicitud.precio,
      checkoutUrl: checkout.url ?? undefined,
    }).catch(console.error)

    return NextResponse.json({ url: checkout.url })
  } catch (err) {
    console.error('[invitado/checkout]', err)
    return NextResponse.json(
      { error: 'Error al procesar el pago. Inténtalo de nuevo.' },
      { status: 500 }
    )
  }
}
