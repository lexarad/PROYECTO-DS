import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (session?.user?.role !== 'ADMIN') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  const { searchParams } = new URL(req.url)
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10))
  const PAGE_SIZE = 25

  const [creditos, totalCreditos, totalReferidores, totalReferidos] = await Promise.all([
    (prisma as any).creditoReferido.findMany({
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: {
        user: { select: { id: true, name: true, email: true, referralCode: true } },
      },
    }),
    (prisma as any).creditoReferido.count(),
    prisma.user.count({ where: { referidos: { some: {} } } as any }),
    prisma.user.count({ where: { referidoPorId: { not: null } } as any }),
  ])

  return NextResponse.json({
    creditos,
    totalCreditos,
    totalReferidores,
    totalReferidos,
    page,
    pages: Math.ceil(totalCreditos / PAGE_SIZE),
  })
}
