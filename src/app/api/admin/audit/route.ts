import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

const PAGE_SIZE = 50

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (session?.user?.role !== 'ADMIN') return NextResponse.json({ error: 'No autorizado' }, { status: 403 })

  const { searchParams } = new URL(req.url)
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1'))
  const accion = searchParams.get('accion') ?? undefined
  const entidad = searchParams.get('entidad') ?? undefined
  const q = searchParams.get('q')?.trim() ?? undefined

  const where: any = {}
  if (accion) where.accion = accion
  if (entidad) where.entidad = entidad
  if (q) {
    where.OR = [
      { resumen: { contains: q, mode: 'insensitive' } },
      { adminEmail: { contains: q, mode: 'insensitive' } },
      { entidadId: { contains: q, mode: 'insensitive' } },
    ]
  }

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: PAGE_SIZE,
      skip: (page - 1) * PAGE_SIZE,
    }),
    prisma.auditLog.count({ where }),
  ])

  return NextResponse.json({ logs, total, pages: Math.ceil(total / PAGE_SIZE) })
}
