import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { EstadoSolicitud } from '@prisma/client'

const ESTADOS_VALIDOS: EstadoSolicitud[] = ['PENDIENTE', 'EN_PROCESO', 'COMPLETADA', 'RECHAZADA']

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  const { estado } = await req.json()

  if (!ESTADOS_VALIDOS.includes(estado)) {
    return NextResponse.json({ error: 'Estado inválido' }, { status: 400 })
  }

  const solicitud = await prisma.solicitud.update({
    where: { id: params.id },
    data: { estado },
  })

  return NextResponse.json(solicitud)
}
