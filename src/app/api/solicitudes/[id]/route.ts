import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const solicitud = await prisma.solicitud.findUnique({
    where: { id: params.id, userId: session.user.id },
    include: { documentos: true },
  })

  if (!solicitud) return NextResponse.json({ error: 'No encontrada' }, { status: 404 })
  return NextResponse.json(solicitud)
}
