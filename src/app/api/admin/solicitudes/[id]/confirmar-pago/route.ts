import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { sendConfirmacionPago } from '@/lib/email'
import { notificarNuevaTramitacion } from '@/lib/tramitacion'

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  // Check already paid (idempotency)
  const existing = await prisma.solicitud.findUnique({
    where: { id: params.id },
    select: { pagado: true },
  })
  if (existing?.pagado) {
    return NextResponse.json({ error: 'Esta solicitud ya está marcada como pagada' }, { status: 409 })
  }

  const solicitud = await prisma.solicitud.update({
    where: { id: params.id },
    data: {
      pagado: true,
      estado: 'EN_PROCESO',
      historial: {
        create: { estado: 'EN_PROCESO', nota: 'Pago confirmado manualmente por el administrador' },
      },
    },
    include: { user: true },
  })

  const emailTo = solicitud.user?.email ?? solicitud.emailInvitado
  const nombreTo = solicitud.user?.name ?? solicitud.emailInvitado ?? 'Cliente'

  if (emailTo) {
    sendConfirmacionPago({
      to: emailTo,
      nombre: nombreTo,
      tipoCertificado: solicitud.tipo,
      referencia: solicitud.referencia!,
      precio: solicitud.precio,
      esInvitado: !solicitud.userId,
    }).catch(console.error)
  }

  notificarNuevaTramitacion({
    solicitudId: solicitud.id,
    referencia: solicitud.referencia!,
    tipo: solicitud.tipo,
    datos: solicitud.datos as Record<string, unknown>,
    precio: solicitud.precio,
    emailCliente: emailTo ?? null,
    nombreCliente: nombreTo,
  }).catch(console.error)

  return NextResponse.json({ ok: true })
}
