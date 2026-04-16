import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { prisma } from '@/lib/prisma'
import { sendConfirmacionPago } from '@/lib/email'
import Stripe from 'stripe'

// Next.js necesita el body raw para verificar la firma de Stripe
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

    const solicitud = await prisma.solicitud.update({
      where: { id: solicitudId },
      data: { pagado: true, estado: 'EN_PROCESO' },
      include: { user: true },
    })

    // Email de confirmación (best-effort, no bloquea respuesta)
    sendConfirmacionPago({
      to: solicitud.user.email,
      nombre: solicitud.user.name ?? solicitud.user.email,
      tipoCertificado: solicitud.tipo,
      referencia: solicitud.referencia!,
      precio: solicitud.precio,
    }).catch(console.error)
  }

  return NextResponse.json({ ok: true })
}
