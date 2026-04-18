import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (session?.user?.role !== 'ADMIN') return NextResponse.json({ error: 'No autorizado' }, { status: 403 })

  const q = new URL(req.url).searchParams.get('q')?.trim()
  if (!q || q.length < 2) return NextResponse.json({ solicitudes: [], usuarios: [], facturas: [] })

  const [solicitudes, usuarios, facturas] = await Promise.all([
    prisma.solicitud.findMany({
      where: {
        OR: [
          { referencia: { contains: q, mode: 'insensitive' } },
          { emailInvitado: { contains: q, mode: 'insensitive' } },
          { user: { email: { contains: q, mode: 'insensitive' } } },
          { user: { name: { contains: q, mode: 'insensitive' } } },
        ],
      },
      take: 5,
      select: {
        id: true, referencia: true, tipo: true, estado: true,
        user: { select: { email: true, name: true } },
        emailInvitado: true,
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.user.findMany({
      where: {
        OR: [
          { email: { contains: q, mode: 'insensitive' } },
          { name: { contains: q, mode: 'insensitive' } },
        ],
      },
      take: 5,
      select: { id: true, name: true, email: true, plan: true, role: true },
    }),
    prisma.factura.findMany({
      where: { numero: { contains: q, mode: 'insensitive' } },
      take: 5,
      select: { id: true, numero: true, total: true, clienteEmail: true, fechaEmision: true },
    }),
  ])

  return NextResponse.json({ solicitudes, usuarios, facturas })
}
