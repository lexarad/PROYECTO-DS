import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { EstadoSolicitud } from '@prisma/client'
import { sendCambioEstado } from '@/lib/email'
import { registrarAudit } from '@/lib/audit'

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (session?.user?.role !== 'ADMIN') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  const { ids, estado, nota }: { ids: string[]; estado: EstadoSolicitud; nota?: string } = await req.json()

  if (!ids?.length || !estado) {
    return NextResponse.json({ error: 'ids y estado son obligatorios' }, { status: 400 })
  }

  const ESTADOS_VALIDOS: EstadoSolicitud[] = ['EN_PROCESO', 'TRAMITADO', 'COMPLETADA', 'RECHAZADA']
  if (!ESTADOS_VALIDOS.includes(estado)) {
    return NextResponse.json({ error: 'Estado inválido' }, { status: 400 })
  }

  const solicitudes = await prisma.solicitud.findMany({
    where: { id: { in: ids } },
    include: { user: { select: { email: true, name: true } } },
  })

  // Update all
  await prisma.$transaction([
    prisma.solicitud.updateMany({
      where: { id: { in: ids } },
      data: { estado },
    }),
    ...ids.map((id) =>
      prisma.historialEstado.create({
        data: { solicitudId: id, estado, nota: nota ?? `Cambio masivo a ${estado}` },
      })
    ),
  ])

  // Notify clients async
  for (const s of solicitudes) {
    const emailTo = s.user?.email ?? s.emailInvitado
    if (!emailTo) continue
    sendCambioEstado({
      to: emailTo,
      nombre: s.user?.name ?? emailTo,
      tipoCertificado: s.tipo,
      referencia: s.referencia!,
      estado,
      nota,
    }).catch(console.error)
  }

  registrarAudit(
    session.user.id, session.user.email!,
    'BULK_ESTADO', 'solicitud', ids[0],
    `Bulk: ${ids.length} solicitudes → ${estado}`,
    req,
  ).catch(console.error)

  return NextResponse.json({ ok: true, actualizadas: ids.length })
}
