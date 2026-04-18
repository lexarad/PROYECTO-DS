import { NextRequest, NextResponse } from 'next/server'
import { validateApiKey } from '@/lib/validateApiKey'
import { prisma } from '@/lib/prisma'

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const userId = await validateApiKey(req.headers.get('authorization'))
  if (!userId) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const endpoint = await (prisma as any).webhookEndpoint.findFirst({
    where: { id: params.id, userId },
  })

  if (!endpoint) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })

  await (prisma as any).webhookEndpoint.delete({ where: { id: params.id } })

  return NextResponse.json({ ok: true })
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const userId = await validateApiKey(req.headers.get('authorization'))
  if (!userId) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const endpoint = await (prisma as any).webhookEndpoint.findFirst({
    where: { id: params.id, userId },
  })

  if (!endpoint) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })

  const { activo, eventos } = await req.json()
  const data: Record<string, unknown> = {}
  if (typeof activo === 'boolean') data.activo = activo
  if (Array.isArray(eventos)) data.eventos = eventos

  const updated = await (prisma as any).webhookEndpoint.update({
    where: { id: params.id },
    data,
    select: { id: true, url: true, activo: true, eventos: true, updatedAt: true },
  })

  return NextResponse.json(updated)
}
