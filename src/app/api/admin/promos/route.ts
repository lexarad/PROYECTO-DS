import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (session?.user?.role !== 'ADMIN') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  const promos = await (prisma as any).codigoPromo.findMany({
    orderBy: { createdAt: 'desc' },
  })
  return NextResponse.json(promos)
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (session?.user?.role !== 'ADMIN') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  const { codigo, descuento, maxUsos, expira } = await req.json()

  if (!codigo || !descuento || descuento <= 0 || descuento > 100) {
    return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 })
  }

  const existing = await (prisma as any).codigoPromo.findUnique({ where: { codigo } })
  if (existing) {
    return NextResponse.json({ error: 'Ya existe un código con ese nombre' }, { status: 409 })
  }

  const promo = await (prisma as any).codigoPromo.create({
    data: {
      codigo,
      descuento,
      maxUsos: maxUsos ?? null,
      expira: expira ? new Date(expira) : null,
    },
  })

  return NextResponse.json({ ok: true, codigo: promo.codigo })
}
