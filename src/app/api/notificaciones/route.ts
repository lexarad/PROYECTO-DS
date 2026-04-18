import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(_req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const notificaciones = await prisma.notificacion.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: 'desc' },
    take: 50,
    select: { id: true, tipo: true, titulo: true, cuerpo: true, enlace: true, leida: true, createdAt: true },
  })

  const noLeidas = await prisma.notificacion.count({
    where: { userId: session.user.id, leida: false },
  })

  return NextResponse.json({ notificaciones, noLeidas })
}

export async function PATCH(_req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  await prisma.notificacion.updateMany({
    where: { userId: session.user.id, leida: false },
    data: { leida: true },
  })

  return NextResponse.json({ ok: true })
}

export async function DELETE(_req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  await prisma.notificacion.deleteMany({ where: { userId: session.user.id } })

  return NextResponse.json({ ok: true })
}
