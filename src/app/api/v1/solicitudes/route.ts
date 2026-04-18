import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { validateApiKey } from '@/lib/validateApiKey'
import { getCertificado } from '@/lib/certificados'
import { aplicarDescuento } from '@/lib/planes'
import { TipoCertificado } from '@prisma/client'
import { rateLimit, getClientIp } from '@/lib/ratelimit'

export async function GET(req: NextRequest) {
  const rl = rateLimit(`v1:${getClientIp(req)}`, { limit: 60, windowSec: 60 })
  if (!rl.allowed) {
    return NextResponse.json({ error: 'Rate limit excedido. Máximo 60 req/min.' }, { status: 429 })
  }

  const userId = await validateApiKey(req.headers.get('authorization'))
  if (!userId) return NextResponse.json({ error: 'API key inválida o inactiva' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const estado = searchParams.get('estado') ?? undefined
  const limit = Math.min(parseInt(searchParams.get('limit') ?? '20'), 100)
  const offset = parseInt(searchParams.get('offset') ?? '0')

  const solicitudes = await prisma.solicitud.findMany({
    where: { userId, ...(estado ? { estado: estado as any } : {}) },
    orderBy: { createdAt: 'desc' },
    take: limit,
    skip: offset,
    select: {
      id: true, referencia: true, tipo: true, estado: true,
      precio: true, pagado: true, clienteNombre: true, createdAt: true,
    },
  })

  return NextResponse.json({ data: solicitudes, limit, offset })
}

export async function POST(req: NextRequest) {
  const rl = rateLimit(`v1:${getClientIp(req)}`, { limit: 60, windowSec: 60 })
  if (!rl.allowed) {
    return NextResponse.json({ error: 'Rate limit excedido. Máximo 60 req/min.' }, { status: 429 })
  }

  const userId = await validateApiKey(req.headers.get('authorization'))
  if (!userId) return NextResponse.json({ error: 'API key inválida o inactiva' }, { status: 401 })

  const { tipo, datos, clienteNombre } = await req.json()

  const config = getCertificado(tipo)
  if (!config) return NextResponse.json({ error: 'Tipo de certificado inválido' }, { status: 400 })

  const user = await prisma.user.findUnique({ where: { id: userId } })
  const precio = aplicarDescuento(config.precio, user!.plan)
  const referencia = `CD-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`

  const solicitud = await prisma.solicitud.create({
    data: { userId, tipo: tipo as TipoCertificado, datos, precio, referencia, clienteNombre },
  })

  return NextResponse.json(solicitud, { status: 201 })
}
