import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { prisma } from '@/lib/prisma'
import { crearFactura } from '@/lib/factura'
import { crearJob } from '@/lib/automatizacion/runner'
import { sendConfirmacionPago } from '@/lib/email'
import { crearNotificacion } from '@/lib/notificaciones'

export async function GET(req: NextRequest) {
  const sessionId = req.nextUrl.searchParams.get('session_id')
  if (!sessionId) return NextResponse.json({ error: 'Sin session_id' }, { status: 400 })

  try {
    const checkoutSession = await stripe.checkout.sessions.retrieve(sessionId)

    if (checkoutSession.payment_status !== 'paid') {
      return NextResponse.json({ pagado: false })
    }

    const solicitudId = checkoutSession.metadata?.solicitudId
    if (!solicitudId) return NextResponse.json({ pagado: true, updated: false })

    const existing = await prisma.solicitud.findUnique({
      where: { id: solicitudId },
      select: { pagado: true },
    })

    if (existing?.pagado) return NextResponse.json({ pagado: true, updated: false })

    const solicitud = await prisma.solicitud.update({
      where: { id: solicitudId },
      data: {
        pagado: true,
        estado: 'EN_PROCESO',
        historial: { create: { estado: 'EN_PROCESO', nota: 'Pago confirmado vía página de éxito' } },
      },
      include: { user: { select: { email: true, name: true } } },
    })

    const emailTo = solicitud.user?.email ?? solicitud.emailInvitado
    const nombreTo = solicitud.user?.name ?? emailTo ?? 'Cliente'

    const factura = await crearFactura(solicitud.id).catch(console.error)

    if (emailTo) {
      sendConfirmacionPago({
        to: emailTo,
        nombre: nombreTo,
        tipoCertificado: solicitud.tipo,
        referencia: solicitud.referencia!,
        precio: solicitud.precio,
        esInvitado: !solicitud.userId,
        facturaId: factura?.id,
        entrega: { metodo: 'email' },
      }).catch(console.error)
    }

    if (solicitud.userId) {
      crearNotificacion(
        solicitud.userId,
        'PAGO',
        'Pago confirmado',
        `Tu solicitud ${solicitud.referencia ?? ''} está en proceso de tramitación.`,
        `/dashboard/solicitudes/${solicitud.id}`,
      ).catch(console.error)
    }

    crearJob(solicitud.id, solicitud.tipo).catch(console.error)

    return NextResponse.json({ pagado: true, updated: true })
  } catch (err) {
    console.error('[pagos/verificar]', err)
    return NextResponse.json({ error: 'Error al verificar' }, { status: 500 })
  }
}
