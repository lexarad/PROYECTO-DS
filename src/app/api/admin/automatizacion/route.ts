import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (session?.user?.role !== 'ADMIN') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  const { searchParams } = new URL(req.url)
  const estado = searchParams.get('estado')
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1'))
  const PAGE_SIZE = 20

  const where = estado ? { estado } : {}

  const [jobs, total] = await Promise.all([
    (prisma as any).automatizacionJob.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: {
        solicitud: {
          select: { referencia: true, tipo: true, emailInvitado: true, user: { select: { email: true } } },
        },
      },
    }),
    (prisma as any).automatizacionJob.count({ where }),
  ])

  return NextResponse.json({ jobs, total, page, pages: Math.ceil(total / PAGE_SIZE) })
}
