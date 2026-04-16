import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { prisma } from '@/lib/prisma'
import Stripe from 'stripe'
import { Plan } from '@prisma/client'

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
    if (session.mode !== 'subscription') return NextResponse.json({ ok: true })

    const { userId, plan } = session.metadata ?? {}
    if (!userId || !plan) return NextResponse.json({ ok: true })

    await prisma.user.update({
      where: { id: userId },
      data: { plan: plan as Plan, stripeSubscriptionId: session.subscription as string },
    })
  }

  if (event.type === 'customer.subscription.deleted') {
    const sub = event.data.object as Stripe.Subscription
    await prisma.user.updateMany({
      where: { stripeSubscriptionId: sub.id },
      data: { plan: 'FREE', stripeSubscriptionId: null },
    })
  }

  return NextResponse.json({ ok: true })
}
