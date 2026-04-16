import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  const { nombre, url, tipo } = await req.json()

  if (!nombre || !url) {
    return NextResponse.json({ error: 'Nombre y URL son obligatorios' }, { status: 400 })
  }

  // Verificar que la solicitud existe
  const solicitud = await prisma.solicitud.findUnique({ where: { id: params.id } })
  if (!solicitud) return NextResponse.json({ error: 'Solicitud no encontrada' }, { status: 404 })

  const documento = await prisma.documento.create({
    data: { solicitudId: params.id, nombre, url, tipo: tipo ?? 'PDF' },
  })

  return NextResponse.json(documento, { status: 201 })
}
