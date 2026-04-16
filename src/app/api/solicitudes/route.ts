import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getCertificado } from '@/lib/certificados'
import { TipoCertificado } from '@prisma/client'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const solicitudes = await prisma.solicitud.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json(solicitudes)
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { tipo, datos } = await req.json()

  const config = getCertificado(tipo)
  if (!config) return NextResponse.json({ error: 'Tipo de certificado inválido.' }, { status: 400 })

  const referencia = `CD-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`

  const solicitud = await prisma.solicitud.create({
    data: {
      userId: session.user.id,
      tipo: tipo as TipoCertificado,
      datos,
      precio: config.precio,
      referencia,
    },
  })

  return NextResponse.json(solicitud, { status: 201 })
}
