import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { validateApiKey } from '@/lib/validateApiKey'
import { rateLimit, getClientIp } from '@/lib/ratelimit'

export async function GET(req: NextRequest) {
  const rl = rateLimit(`v1:${getClientIp(req)}`, { limit: 60, windowSec: 60 })
  if (!rl.allowed) {
    return NextResponse.json({ error: 'Rate limit excedido' }, { status: 429 })
  }

  const userId = await validateApiKey(req.headers.get('authorization'))
  if (!userId) return NextResponse.json({ error: 'API key inválida o inactiva' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const limit = Math.min(parseInt(searchParams.get('limit') ?? '20'), 100)
  const offset = parseInt(searchParams.get('offset') ?? '0')

  const facturas = await prisma.factura.findMany({
    where: { userId },
    select: {
      id: true,
      numero: true,
      baseImponible: true,
      cuotaIVA: true,
      total: true,
      concepto: true,
      fechaEmision: true,
      solicitud: { select: { referencia: true, tipo: true, estado: true } },
    },
    orderBy: { fechaEmision: 'desc' },
    take: limit,
    skip: offset,
  })

  return NextResponse.json({ data: facturas, limit, offset })
}
