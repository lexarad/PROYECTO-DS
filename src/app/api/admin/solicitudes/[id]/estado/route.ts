import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { EstadoSolicitud } from '@prisma/client'
import { sendCambioEstado } from '@/lib/email'
import { dispararEvento } from '@/lib/webhooks-salientes'
import type { EventoWebhook } from '@/lib/webhooks-salientes'
import { crearNotificacion } from '@/lib/notificaciones'
import { registrarAudit } from '@/lib/audit'

const ESTADOS_VALIDOS: EstadoSolicitud[] = ['PENDIENTE', 'EN_PROCESO', 'TRAMITADO', 'COMPLETADA', 'RECHAZADA']

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  const { estado, nota } = await req.json()

  if (!ESTADOS_VALIDOS.includes(estado)) {
    return NextResponse.json({ error: 'Estado inválido' }, { status: 400 })
  }

  const solicitud = await prisma.solicitud.update({
    where: { id: params.id },
    data: {
      estado,
      historial: {
        create: { estado, nota: nota ?? null },
      },
    },
    include: { user: true, documentos: true },
  })

  // Notificación por email (best-effort)
  const emailTo = solicitud.user?.email ?? solicitud.emailInvitado
  if (emailTo) {
    sendCambioEstado({
      to: emailTo,
      nombre: solicitud.user?.name ?? emailTo,
      tipoCertificado: solicitud.tipo,
      referencia: solicitud.referencia!,
      estado,
      nota,
      documentos: estado === 'COMPLETADA' ? solicitud.documentos : [],
    }).catch(console.error)
  }

  // Webhook saliente para clientes PRO/ENTERPRISE
  if (solicitud.userId) {
    const eventoMap: Partial<Record<string, EventoWebhook>> = {
      TRAMITADO:  'solicitud.tramitada',
      COMPLETADA: 'solicitud.completada',
      RECHAZADA:  'solicitud.rechazada',
    }
    const evento = eventoMap[estado] ?? 'solicitud.estado_cambiado'
    dispararEvento(solicitud.userId, evento, {
      solicitudId: solicitud.id,
      referencia: solicitud.referencia,
      tipo: solicitud.tipo,
      estado,
      nota: nota ?? null,
      updatedAt: solicitud.updatedAt.toISOString(),
    }).catch(console.error)
  }

  registrarAudit(
    session.user.id, session.user.email!,
    'ESTADO_CAMBIADO', 'solicitud', params.id,
    `${solicitud.referencia} → ${estado}${nota ? ` (${nota})` : ''}`,
    req,
  ).catch(console.error)

  // Notificación in-app al cliente
  if (solicitud.userId) {
    const ESTADO_LABEL: Record<string, string> = {
      EN_PROCESO: 'En proceso', TRAMITADO: 'Tramitado',
      COMPLETADA: 'Completada', RECHAZADA: 'Rechazada', PENDIENTE: 'Pendiente',
    }
    crearNotificacion(
      solicitud.userId,
      'ESTADO_CAMBIADO',
      `Tu solicitud ha cambiado de estado`,
      `${solicitud.referencia} → ${ESTADO_LABEL[estado] ?? estado}${nota ? `: ${nota}` : ''}`,
      `/dashboard/solicitudes/${solicitud.id}`,
    ).catch(console.error)
  }

  return NextResponse.json(solicitud)
}
