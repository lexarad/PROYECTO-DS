import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { validateApiKey } from '@/lib/validateApiKey'
import { rateLimit, getClientIp } from '@/lib/ratelimit'

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const rl = rateLimit(`v1:${getClientIp(req)}`, { limit: 60, windowSec: 60 })
  if (!rl.allowed) {
    return NextResponse.json({ error: 'Rate limit excedido. Máximo 60 req/min.' }, { status: 429 })
  }

  const userId = await validateApiKey(req.headers.get('authorization'))
  if (!userId) return NextResponse.json({ error: 'API key inválida o inactiva' }, { status: 401 })

  const { id } = params
  const solicitud = await prisma.solicitud.findFirst({
    where: {
      userId,
      OR: [{ id }, { referencia: id }],
    },
    select: {
      id: true,
      referencia: true,
      tipo: true,
      estado: true,
      precio: true,
      pagado: true,
      clienteNombre: true,
      createdAt: true,
      updatedAt: true,
      historial: {
        orderBy: { createdAt: 'desc' },
        select: { estado: true, nota: true, createdAt: true },
      },
      documentos: {
        select: { nombre: true, url: true, tipo: true, createdAt: true },
      },
    },
  })

  if (!solicitud) return NextResponse.json({ error: 'No encontrada' }, { status: 404 })

  return NextResponse.json(solicitud)
}
