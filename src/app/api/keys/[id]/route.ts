import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const key = await prisma.apiKey.findUnique({ where: { id: params.id } })
  if (!key || key.userId !== session.user.id) {
    return NextResponse.json({ error: 'No encontrada' }, { status: 404 })
  }

  await prisma.apiKey.delete({ where: { id: params.id } })
  return NextResponse.json({ ok: true })
}

export async function PATCH(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const key = await prisma.apiKey.findUnique({ where: { id: params.id } })
  if (!key || key.userId !== session.user.id) {
    return NextResponse.json({ error: 'No encontrada' }, { status: 404 })
  }

  const updated = await prisma.apiKey.update({
    where: { id: params.id },
    data: { activa: !key.activa },
  })

  return NextResponse.json(updated)
}
