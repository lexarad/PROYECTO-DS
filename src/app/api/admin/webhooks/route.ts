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
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1'))
  const soloErrores = searchParams.get('errores') === '1'
  const limit = 50
  const skip = (page - 1) * limit

  const where = soloErrores ? { error: { not: null } } : {}

  const [eventos, total] = await Promise.all([
    (prisma as any).webhookEvent.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip,
    }),
    (prisma as any).webhookEvent.count({ where }),
  ])

  return NextResponse.json({ eventos, total, pages: Math.ceil(total / limit) })
}
