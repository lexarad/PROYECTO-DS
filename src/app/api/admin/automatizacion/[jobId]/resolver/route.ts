import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { registrarAudit } from '@/lib/audit'

interface Props { params: { jobId: string } }

export async function PATCH(req: NextRequest, { params }: Props) {
  const session = await getServerSession(authOptions)
  if (session?.user?.role !== 'ADMIN') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  const body = await req.json()
  const { refOrganismo, nota, actualizarSolicitud } = body as {
    refOrganismo?: string
    nota: string
    actualizarSolicitud?: 'TRAMITADO' | 'COMPLETADA' | null
  }

  if (!nota?.trim()) {
    return NextResponse.json({ error: 'La nota es obligatoria' }, { status: 400 })
  }

  const job = await (prisma as any).automatizacionJob.findUnique({
    where: { id: params.jobId },
    select: { id: true, estado: true, solicitudId: true, tipo: true },
  })

  if (!job) return NextResponse.json({ error: 'Job no encontrado' }, { status: 404 })

  if (job.estado === 'COMPLETADO') {
    return NextResponse.json({ error: 'El job ya está completado' }, { status: 400 })
  }

  // Mark job as manually resolved
  await (prisma as any).automatizacionJob.update({
    where: { id: params.jobId },
    data: {
      estado: 'COMPLETADO',
      completadoAt: new Date(),
      ...(refOrganismo?.trim() ? { refOrganismo: refOrganismo.trim() } : {}),
    },
  })

  // Optionally update solicitud state + add historial entry
  if (actualizarSolicitud && job.solicitudId) {
    await prisma.solicitud.update({
      where: { id: job.solicitudId },
      data: { estado: actualizarSolicitud },
    })

    await (prisma as any).historialEstado.create({
      data: {
        solicitudId: job.solicitudId,
        estado: actualizarSolicitud,
        nota: `[Resolución manual] ${nota.trim()}${refOrganismo?.trim() ? ` — Ref. MJ: ${refOrganismo.trim()}` : ''}`,
      },
    })
  }

  registrarAudit(
    session.user.id,
    session.user.email!,
    'JOB_RESOLUCION_MANUAL',
    'AutomatizacionJob',
    params.jobId,
    `Resolución manual job ${params.jobId} (${job.tipo})${refOrganismo ? ` · Ref: ${refOrganismo}` : ''}`,
    req,
  ).catch(console.error)

  return NextResponse.json({ ok: true })
}
