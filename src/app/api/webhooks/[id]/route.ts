import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

async function getEndpoint(id: string, userId: string) {
  return (prisma as any).webhookEndpoint.findFirst({
    where: { id, userId },
  })
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const endpoint = await getEndpoint(params.id, session.user.id)
  if (!endpoint) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })

  const { activo } = await req.json()
  const updated = await (prisma as any).webhookEndpoint.update({
    where: { id: params.id },
    data: { activo: Boolean(activo) },
    select: { id: true, url: true, activo: true, eventos: true },
  })

  return NextResponse.json(updated)
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const endpoint = await getEndpoint(params.id, session.user.id)
  if (!endpoint) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })

  await (prisma as any).webhookEndpoint.delete({ where: { id: params.id } })
  return NextResponse.json({ ok: true })
}
