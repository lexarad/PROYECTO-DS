import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { stripe } from '@/lib/stripe'

export async function DELETE(_req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { stripeSubscriptionId: true, stripeCustomerId: true, role: true },
  })
  if (!user) return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })
  if (user.role === 'ADMIN') {
    return NextResponse.json({ error: 'Las cuentas de administrador no pueden eliminarse desde aquí' }, { status: 403 })
  }

  // Cancelar suscripción activa en Stripe
  if (user.stripeSubscriptionId) {
    await stripe.subscriptions.cancel(user.stripeSubscriptionId).catch(console.error)
  }

  // Anonimizar: borrar datos personales pero conservar solicitudes pagadas para facturación
  await prisma.$transaction([
    // Borrar sessions, accounts, API keys, notificaciones, mensajes del usuario
    prisma.session.deleteMany({ where: { userId: session.user.id } }),
    prisma.account.deleteMany({ where: { userId: session.user.id } }),
    prisma.apiKey.deleteMany({ where: { userId: session.user.id } }),
    prisma.notificacion.deleteMany({ where: { userId: session.user.id } }),
    prisma.mensaje.deleteMany({ where: { userId: session.user.id } }),
    prisma.webhookEndpoint.deleteMany({ where: { userId: session.user.id } }),
    // Anonimizar el usuario (email único + datos personales eliminados)
    prisma.user.update({
      where: { id: session.user.id },
      data: {
        name: 'Cuenta eliminada',
        email: `deleted-${session.user.id}@certidocs.invalid`,
        password: null,
        image: null,
        stripeCustomerId: null,
        stripeSubscriptionId: null,
      },
    }),
  ])

  return NextResponse.json({ ok: true })
}
