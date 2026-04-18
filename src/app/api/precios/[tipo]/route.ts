import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getPrecioBase } from '@/lib/precios'
import { aplicarDescuento } from '@/lib/planes'
import type { TipoCertificado } from '@prisma/client'

export const revalidate = 0

export async function GET(
  _req: NextRequest,
  { params }: { params: { tipo: string } }
) {
  const tipo = params.tipo.toUpperCase() as TipoCertificado
  const precioBase = await getPrecioBase(tipo)

  const session = await getServerSession(authOptions)
  const plan = (session?.user as any)?.plan ?? 'FREE'
  const precio = aplicarDescuento(precioBase, plan)
  const descuento = Math.round((1 - precio / precioBase) * 100)

  return NextResponse.json({
    tipo,
    precioBase,
    precio,
    descuento: descuento > 0 ? descuento : 0,
    plan,
  })
}
