import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { stripe } from '@/lib/stripe'
import { getCertificado } from '@/lib/certificados'

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { solicitudId } = await req.json()

  const solicitud = await prisma.solicitud.findUnique({
    where: { id: solicitudId, userId: session.user.id },
  })

  if (!solicitud) return NextResponse.json({ error: 'Solicitud no encontrada' }, { status: 404 })
  if (solicitud.pagado) return NextResponse.json({ error: 'Esta solicitud ya está pagada' }, { status: 400 })

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
          unit_amount: Math.round(solicitud.precio * 100), // céntimos
          product_data: {
            name: config?.label ?? solicitud.tipo,
            description: `Referencia: ${solicitud.referencia}`,
          },
        },
      },
    ],
    metadata: {
      solicitudId: solicitud.id,
      userId: session.user.id,
    },
    success_url: `${baseUrl}/pago/exito?ref=${solicitud.referencia}`,
    cancel_url: `${baseUrl}/dashboard/solicitudes/${solicitud.id}?cancelado=1`,
  })

  // Guardar stripeSessionId para poder verificar en webhook
  await prisma.solicitud.update({
    where: { id: solicitud.id },
    data: { stripeSessionId: checkout.id },
  })

  return NextResponse.json({ url: checkout.url })
}
