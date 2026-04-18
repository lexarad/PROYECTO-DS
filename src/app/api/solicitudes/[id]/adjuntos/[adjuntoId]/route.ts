import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { del } from '@vercel/blob'

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string; adjuntoId: string } },
) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const adjunto = await prisma.adjunto.findUnique({
    where: { id: params.adjuntoId },
    include: { solicitud: { select: { userId: true, estado: true } } },
  })

  if (!adjunto) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })

  const esOwner = adjunto.solicitud.userId === session.user.id
  const esAdmin = session.user.role === 'ADMIN'
  if (!esOwner && !esAdmin) return NextResponse.json({ error: 'Sin permiso' }, { status: 403 })

  if (!esAdmin && ['COMPLETADA', 'RECHAZADA'].includes(adjunto.solicitud.estado)) {
    return NextResponse.json({ error: 'No se pueden eliminar adjuntos de solicitudes cerradas' }, { status: 403 })
  }

  await del(adjunto.url)
  await prisma.adjunto.delete({ where: { id: params.adjuntoId } })

  return new NextResponse(null, { status: 204 })
}
