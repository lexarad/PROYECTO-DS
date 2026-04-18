import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

const PAGE_SIZE = 20

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { searchParams } = new URL(req.url)
  const estado = searchParams.get('estado') ?? undefined
  const tipo   = searchParams.get('tipo')   ?? undefined
  const page   = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10))

  const where: Record<string, unknown> = {}
  if (estado) where.estado = estado
  if (tipo)   where.tipo   = tipo

  const [jobs, total] = await Promise.all([
    (prisma as any).automatizacionJob.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      select: {
        id: true,
        solicitudId: true,
        tipo: true,
        estado: true,
        intentos: true,
        maxIntentos: true,
        refOrganismo: true,
        error: true,
        logs: true,
        screenshotUrls: true,
        createdAt: true,
        iniciadoAt: true,
        completadoAt: true,
        nextRetryAt: true,
        solicitud: {
          select: { referencia: true },
        },
      },
    }),
    (prisma as any).automatizacionJob.count({ where }),
  ])

  return NextResponse.json({ jobs, total, page, pages: Math.ceil(total / PAGE_SIZE) })
}
