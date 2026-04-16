import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { stripe } from '@/lib/stripe'
import { getPlan } from '@/lib/planes'
import { Plan } from '@prisma/client'

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { plan } = await req.json()
  const planCfg = getPlan(plan as Plan)

  if (!planCfg.stripePriceId) {
    return NextResponse.json({ error: 'Plan no disponible para suscripción' }, { status: 400 })
  }

  const user = await prisma.user.findUnique({ where: { id: session.user.id } })
  const baseUrl = process.env.NEXTAUTH_URL ?? 'http://localhost:3000'

  // Crear o reutilizar Stripe Customer
  let customerId = user?.stripeCustomerId
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: session.user.email,
      name: session.user.name ?? undefined,
      metadata: { userId: session.user.id },
    })
    customerId = customer.id
    await prisma.user.update({ where: { id: session.user.id }, data: { stripeCustomerId: customerId } })
  }

  const checkout = await stripe.checkout.sessions.create({
    mode: 'subscription',
    customer: customerId,
    line_items: [{ price: planCfg.stripePriceId, quantity: 1 }],
    metadata: { userId: session.user.id, plan },
    success_url: `${baseUrl}/dashboard/plan?activado=1`,
    cancel_url: `${baseUrl}/dashboard/plan`,
  })

  return NextResponse.json({ url: checkout.url })
}
