import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  // Verify endpoint belongs to user
  const endpoint = await (prisma as any).webhookEndpoint.findFirst({
    where: { id: params.id, userId: session.user.id },
    select: { id: true },
  })
  if (!endpoint) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })

  const deliveries = await (prisma as any).webhookDelivery.findMany({
    where: { endpointId: params.id },
    orderBy: { createdAt: 'desc' },
    take: 50,
    select: {
      id: true, evento: true, status: true, ok: true,
      intentos: true, error: true, createdAt: true,
    },
  })

  return NextResponse.json({ deliveries })
}
