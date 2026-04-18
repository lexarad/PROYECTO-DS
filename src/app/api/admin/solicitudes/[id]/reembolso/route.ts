import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { stripe } from '@/lib/stripe'
import { sendConfirmacionReembolso } from '@/lib/email'
import { registrarAudit } from '@/lib/audit'

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  if (session?.user?.role !== 'ADMIN') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  const solicitud = await prisma.solicitud.findUnique({
    where: { id: params.id },
    include: { user: { select: { email: true, name: true } } },
  })

  if (!solicitud) return NextResponse.json({ error: 'No encontrada' }, { status: 404 })
  if (!solicitud.pagado) return NextResponse.json({ error: 'La solicitud no está pagada' }, { status: 400 })
  if (solicitud.estado === 'RECHAZADA') return NextResponse.json({ error: 'Ya está cancelada' }, { status: 400 })
  if (!solicitud.stripeSessionId) return NextResponse.json({ error: 'Sin sesión de Stripe' }, { status: 400 })

  // Obtener el PaymentIntent de la sesión de Checkout
  const checkoutSession = await stripe.checkout.sessions.retrieve(solicitud.stripeSessionId)
  if (!checkoutSession.payment_intent) {
    return NextResponse.json({ error: 'No se encontró el pago en Stripe' }, { status: 400 })
  }

  // Crear el reembolso en Stripe
  const refund = await stripe.refunds.create({
    payment_intent: checkoutSession.payment_intent as string,
    reason: 'requested_by_customer',
  })

  if (refund.status === 'failed') {
    return NextResponse.json({ error: 'Stripe rechazó el reembolso: ' + refund.failure_reason }, { status: 502 })
  }

  // Actualizar solicitud en DB
  await prisma.solicitud.update({
    where: { id: solicitud.id },
    data: {
      estado: 'RECHAZADA',
      historial: {
        create: {
          estado: 'RECHAZADA',
          nota: `Reembolso procesado. ID Stripe: ${refund.id}. Importe: ${solicitud.precio.toFixed(2)} €`,
        },
      },
    },
  })

  // Email de confirmación al cliente
  const emailTo = solicitud.user?.email ?? solicitud.emailInvitado
  if (emailTo) {
    sendConfirmacionReembolso({
      to: emailTo,
      nombre: solicitud.user?.name ?? emailTo.split('@')[0],
      tipoCertificado: solicitud.tipo,
      referencia: solicitud.referencia ?? solicitud.id,
      importe: solicitud.precio,
    }).catch(console.error)
  }

  registrarAudit(
    session.user.id, session.user.email!,
    'REEMBOLSO', 'solicitud', params.id,
    `Reembolso ${solicitud.precio.toFixed(2)}€ — ${solicitud.referencia ?? params.id} (${refund.id})`,
    req,
  ).catch(console.error)

  return NextResponse.json({ ok: true, refundId: refund.id, status: refund.status })
}
