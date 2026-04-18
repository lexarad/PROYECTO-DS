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
  const q = searchParams.get('q') ?? ''
  const page = parseInt(searchParams.get('page') ?? '1')
  const limit = 20
  const skip = (page - 1) * limit

  const where = q
    ? {
        OR: [
          { numero: { contains: q, mode: 'insensitive' as const } },
          { clienteEmail: { contains: q, mode: 'insensitive' as const } },
          { clienteNombre: { contains: q, mode: 'insensitive' as const } },
        ],
      }
    : {}

  const [facturas, total] = await Promise.all([
    prisma.factura.findMany({
      where,
      include: {
        solicitud: { select: { referencia: true, tipo: true } },
        user: { select: { email: true, name: true } },
      },
      orderBy: { fechaEmision: 'desc' },
      take: limit,
      skip,
    }),
    prisma.factura.count({ where }),
  ])

  return NextResponse.json({ facturas, total, pages: Math.ceil(total / limit) })
}
