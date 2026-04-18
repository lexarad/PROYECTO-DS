import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'
import { registrarAudit } from '@/lib/audit'

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const job = await (prisma as any).automatizacionJob.findUnique({
    where: { id: params.id },
    select: { id: true, estado: true, solicitudId: true, tipo: true },
  })
  if (!job) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // Allow retry for any non-completed state
  if (job.estado === 'COMPLETADO') {
    return NextResponse.json({ error: 'Job ya completado' }, { status: 400 })
  }

  await (prisma as any).automatizacionJob.update({
    where: { id: params.id },
    data: {
      estado: 'PENDIENTE',
      intentos: 0,
      error: null,
      nextRetryAt: null,
    },
  })

  registrarAudit(
    session.user.id,
    session.user.email!,
    'JOB_RETRY',
    'AutomatizacionJob',
    params.id,
    `Reintento manual del job ${params.id} (${job.tipo})`,
    req,
  ).catch(console.error)

  return NextResponse.json({ ok: true })
}
