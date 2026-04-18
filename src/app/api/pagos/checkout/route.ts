import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { stripe } from '@/lib/stripe'
import { getCertificado } from '@/lib/certificados'
import { rateLimit } from '@/lib/ratelimit'
import { sendPedidoRecibido } from '@/lib/email'

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const rl = rateLimit(`checkout:${session.user.id}`, { limit: 10, windowSec: 60 })
  if (!rl.allowed) {
    return NextResponse.json({ error: 'Demasiadas solicitudes. Espera un momento.' }, { status: 429 })
  }

  const { solicitudId, codigoPromo: codigoPromoInput } = await req.json()

  const solicitud = await prisma.solicitud.findUnique({
    where: { id: solicitudId, userId: session.user.id },
  })

  if (!solicitud) return NextResponse.json({ error: 'Solicitud no encontrada' }, { status: 404 })
  if (solicitud.pagado) return NextResponse.json({ error: 'Esta solicitud ya está pagada' }, { status: 400 })

  // Validate and apply promo code if provided
  let precioFinal = solicitud.precio
  let promoAplicada: { codigo: string; descuento: number } | null = null

  if (codigoPromoInput && typeof codigoPromoInput === 'string') {
    const codigo = codigoPromoInput.toUpperCase().trim()
    const promo = await (prisma as any).codigoPromo.findUnique({ where: { codigo } })

    if (promo && promo.activo && !(promo.expira && new Date(promo.expira) < new Date()) && !(promo.maxUsos !== null && promo.usos >= promo.maxUsos) && !solicitud.codigoPromo) {
      precioFinal = +(solicitud.precio * (1 - promo.descuento / 100)).toFixed(2)
      promoAplicada = { codigo, descuento: promo.descuento }
    }
  }

  const config = getCertificado(solicitud.tipo)
  const baseUrl = process.env.NEXTAUTH_URL ?? 'http://localhost:3000'

  const checkout = await stripe.checkout.sessions.create({
    mode: 'payment',
    payment_method_types: ['card'],
    customer_email: session.user.email,
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: 'eur',
          unit_amount: Math.round(precioFinal * 100),
          product_data: {
            name: config?.label ?? solicitud.tipo,
            description: `Referencia: ${solicitud.referencia}${promoAplicada ? ` · Promo: ${promoAplicada.codigo}` : ''}`,
          },
        },
      },
    ],
    metadata: {
      solicitudId: solicitud.id,
      userId: session.user.id,
      ...(promoAplicada ? { codigoPromo: promoAplicada.codigo } : {}),
    },
    success_url: `${baseUrl}/pago/exito?ref=${solicitud.referencia}`,
    cancel_url: `${baseUrl}/dashboard/solicitudes/${solicitud.id}?cancelado=1`,
  })

  // Guardar stripeSessionId y descuento aplicado
  await prisma.solicitud.update({
    where: { id: solicitud.id },
    data: {
      stripeSessionId: checkout.id,
      ...(promoAplicada ? {
        codigoPromo: promoAplicada.codigo,
        descuentoAplicado: promoAplicada.descuento,
      } : {}),
    },
  })

  sendPedidoRecibido({
    to: session.user.email!,
    tipoCertificado: solicitud.tipo,
    referencia: solicitud.referencia ?? '',
    precio: solicitud.precio,
    checkoutUrl: checkout.url ?? undefined,
  }).catch(console.error)

  return NextResponse.json({ url: checkout.url })
}
