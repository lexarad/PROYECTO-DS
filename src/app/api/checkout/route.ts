import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { stripe } from '@/lib/stripe'
import { getCertificado } from '@/lib/certificados'
import { aplicarDescuento } from '@/lib/planes'
import { getPrecioBase } from '@/lib/precios'
import { sendPedidoRecibido } from '@/lib/email'
import { logger } from '@/lib/logger'
import { TipoCertificado } from '@prisma/client'

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

    const { tipo, datos, codigoPromo } = await req.json()

    const config = getCertificado(tipo)
    if (!config) return NextResponse.json({ error: 'Tipo de certificado inválido.' }, { status: 400 })

    const user = await prisma.user.findUnique({ where: { id: session.user.id } })
    const precioBase = await getPrecioBase(tipo as TipoCertificado)
    let precio = aplicarDescuento(precioBase, user!.plan)
    const tasaImporte = config.requiresTasa ? (config.tasaImporte ?? 0) : 0
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

    const solicitud = await prisma.solicitud.create({
      data: {
        userId: session.user.id,
        tipo: tipo as TipoCertificado,
        datos,
        precio,
        referencia,
        ...(tasaImporte > 0 ? { tasaImporte } : {}),
        ...(codigoPromoValidado ? { codigoPromo: codigoPromoValidado, descuentoAplicado } : {}),
      },
    })

    const baseUrl = (process.env.NEXTAUTH_URL ?? 'http://localhost:3000').replace(/\/$/, '')

    const checkout = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      customer_email: session.user.email ?? undefined,
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
        invitado: 'false',
      },
      success_url: `${baseUrl}/pago/exito?ref=${referencia}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/solicitar/${tipo}?cancelado=1`,
    })

    await prisma.solicitud.update({
      where: { id: solicitud.id },
      data: { stripeSessionId: checkout.id },
    })

    sendPedidoRecibido({
      to: session.user.email!,
      tipoCertificado: tipo,
      referencia,
      precio: solicitud.precio,
      checkoutUrl: checkout.url ?? undefined,
    }).catch(console.error)

    return NextResponse.json({ url: checkout.url })
  } catch (err) {
    logger.error('[checkout]', err)
    return NextResponse.json({ error: 'Error al procesar el pago. Inténtalo de nuevo.' }, { status: 500 })
  }
}
