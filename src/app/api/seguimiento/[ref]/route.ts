import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

interface Props { params: { ref: string } }

export async function GET(_req: NextRequest, { params }: Props) {
  const solicitud = await prisma.solicitud.findUnique({
    where: { referencia: params.ref },
    select: {
      estado: true,
      pagado: true,
      historial: { orderBy: { createdAt: 'asc' }, select: { estado: true, nota: true, createdAt: true } },
      documentos: { orderBy: { createdAt: 'desc' }, select: { id: true, nombre: true, url: true } },
    },
  })

  if (!solicitud) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })

  return NextResponse.json(solicitud)
}
