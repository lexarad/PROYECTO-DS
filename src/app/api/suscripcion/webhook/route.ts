import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { prisma } from '@/lib/prisma'
import Stripe from 'stripe'
import { Plan } from '@prisma/client'
import { sendPagoFallido } from '@/lib/email'
import { crearNotificacion } from '@/lib/notificaciones'

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

  // Log event
  await (prisma as any).webhookEvent.upsert({
    where: { stripeId: event.id },
    update: {},
    create: { stripeId: event.id, tipo: event.type, payload: event as object, procesado: false },
  }).catch(() => null)

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

  if (event.type === 'customer.subscription.updated') {
    const sub = event.data.object as Stripe.Subscription
    const planMeta = (sub.metadata?.plan ?? '') as Plan | ''
    if (planMeta && ['FREE', 'PRO', 'ENTERPRISE'].includes(planMeta)) {
      await prisma.user.updateMany({
        where: { stripeSubscriptionId: sub.id },
        data: { plan: planMeta as Plan },
      })
    }
  }

  if (event.type === 'invoice.payment_failed') {
    const invoice = event.data.object as Stripe.Invoice
    const customerId = invoice.customer as string
    const proximoIntento = invoice.next_payment_attempt
      ? new Date(invoice.next_payment_attempt * 1000)
      : null

    const user = await prisma.user.findFirst({
      where: { stripeCustomerId: customerId },
      select: { id: true, email: true, name: true, plan: true },
    })

    if (user) {
      sendPagoFallido({
        to: user.email,
        nombre: user.name ?? user.email.split('@')[0],
        plan: user.plan,
        proximoIntento,
      }).catch(console.error)

      crearNotificacion(
        user.id,
        'PAGO',
        'Problema con el pago',
        `No hemos podido cobrar tu suscripción ${user.plan}. Actualiza tu método de pago.`,
        '/dashboard/plan',
      ).catch(console.error)
    }
  }

  return NextResponse.json({ ok: true })
}
