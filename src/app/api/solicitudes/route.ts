import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getCertificado } from '@/lib/certificados'
import { aplicarDescuento } from '@/lib/planes'
import { getPrecioBase } from '@/lib/precios'
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

  const { tipo, datos, codigoPromo } = await req.json()

  const config = getCertificado(tipo)
  if (!config) return NextResponse.json({ error: 'Tipo de certificado inválido.' }, { status: 400 })

  const user = await prisma.user.findUnique({ where: { id: session.user.id } })
  const precioBase = await getPrecioBase(tipo as TipoCertificado)
  let precio = aplicarDescuento(precioBase, user!.plan)
  let descuentoAplicado: number | null = null
  let codigoPromoValidado: string | null = null

  if (codigoPromo) {
    const promo = await (prisma as any).codigoPromo.findUnique({
      where: { codigo: codigoPromo.toUpperCase() },
    })
    if (promo && promo.activo && !(promo.expira && new Date(promo.expira) < new Date()) &&
        !(promo.maxUsos !== null && promo.usos >= promo.maxUsos)) {
      descuentoAplicado = promo.descuento
      codigoPromoValidado = promo.codigo
      precio = parseFloat((precio * (1 - promo.descuento / 100)).toFixed(2))
      await (prisma as any).codigoPromo.update({
        where: { codigo: promo.codigo },
        data: { usos: { increment: 1 } },
      })
    }
  }

  const referencia = `CD-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`

  const solicitud = await prisma.solicitud.create({
    data: {
      userId: session.user.id,
      tipo: tipo as TipoCertificado,
      datos,
      precio,
      referencia,
      ...(codigoPromoValidado ? { codigoPromo: codigoPromoValidado, descuentoAplicado } : {}),
    },
  })

  return NextResponse.json(solicitud, { status: 201 })
}
