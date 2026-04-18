import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { crearJob, esAutomatizable } from '@/lib/automatizacion/runner'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (session?.user?.role !== 'ADMIN') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  const { solicitudId } = await req.json()
  if (!solicitudId) return NextResponse.json({ error: 'solicitudId requerido' }, { status: 400 })

  const solicitud = await prisma.solicitud.findUnique({
    where: { id: solicitudId },
    include: { automatizacion: true },
  })

  if (!solicitud) return NextResponse.json({ error: 'Solicitud no encontrada' }, { status: 404 })
  if (!solicitud.pagado) return NextResponse.json({ error: 'La solicitud no está pagada' }, { status: 400 })
  if (!esAutomatizable(solicitud.tipo)) {
    return NextResponse.json({ error: `Tipo ${solicitud.tipo} no automatizable` }, { status: 400 })
  }
  if (solicitud.automatizacion) {
    return NextResponse.json({ error: 'Ya existe un job para esta solicitud', jobId: solicitud.automatizacion.id }, { status: 409 })
  }

  const job = await crearJob(solicitudId, solicitud.tipo)
  if (!job) return NextResponse.json({ error: 'No se pudo crear el job' }, { status: 500 })

  return NextResponse.json({ ok: true, jobId: job.id })
}
