import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { procesarJob } from '@/lib/automatizacion/runner'
import { prisma } from '@/lib/prisma'

export const maxDuration = 300

interface Props { params: { jobId: string } }

// GET — detalle de un job
export async function GET(_req: NextRequest, { params }: Props) {
  const session = await getServerSession(authOptions)
  if (session?.user?.role !== 'ADMIN') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  const job = await (prisma as any).automatizacionJob.findUnique({
    where: { id: params.jobId },
    include: { solicitud: { select: { referencia: true, tipo: true, datos: true } } },
  })

  if (!job) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })
  return NextResponse.json(job)
}

// POST — relanzar / reintentar un job
export async function POST(_req: NextRequest, { params }: Props) {
  const session = await getServerSession(authOptions)
  if (session?.user?.role !== 'ADMIN') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  const job = await (prisma as any).automatizacionJob.findUnique({ where: { id: params.jobId } })
  if (!job) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })

  // Resetear para reintento manual
  await (prisma as any).automatizacionJob.update({
    where: { id: params.jobId },
    data: { estado: 'PENDIENTE', error: null, intentos: 0 },
  })

  // Lanzar en background (no bloqueamos la respuesta)
  procesarJob(params.jobId).catch(console.error)

  return NextResponse.json({ ok: true, mensaje: 'Job relanzado' })
}
