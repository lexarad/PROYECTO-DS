import { NextRequest, NextResponse } from 'next/server'
import { validateApiKey } from '@/lib/validateApiKey'
import { generarSecretWebhook } from '@/lib/webhooks-salientes'
import { prisma } from '@/lib/prisma'

const EVENTOS_VALIDOS = [
  'solicitud.estado_cambiado',
  'solicitud.completada',
  'solicitud.rechazada',
  'solicitud.tramitada',
]

export async function GET(req: NextRequest) {
  const userId = await validateApiKey(req.headers.get('authorization'))
  if (!userId) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const endpoints = await (prisma as any).webhookEndpoint.findMany({
    where: { userId },
    select: { id: true, url: true, activo: true, eventos: true, createdAt: true },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json({ data: endpoints })
}

export async function POST(req: NextRequest) {
  const userId = await validateApiKey(req.headers.get('authorization'))
  if (!userId) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { url, eventos = [] } = await req.json()

  if (!url || typeof url !== 'string') {
    return NextResponse.json({ error: 'Campo "url" requerido' }, { status: 400 })
  }

  try { new URL(url) } catch {
    return NextResponse.json({ error: 'URL inválida' }, { status: 400 })
  }

  const eventosInvalidos = (eventos as string[]).filter(e => !EVENTOS_VALIDOS.includes(e))
  if (eventosInvalidos.length > 0) {
    return NextResponse.json({
      error: `Eventos inválidos: ${eventosInvalidos.join(', ')}`,
      validos: EVENTOS_VALIDOS,
    }, { status: 400 })
  }

  const secret = generarSecretWebhook()

  const endpoint = await (prisma as any).webhookEndpoint.create({
    data: { userId, url, secret, eventos },
    select: { id: true, url: true, activo: true, eventos: true, createdAt: true },
  })

  // Devolvemos el secret SOLO en la creación — no se puede recuperar después
  return NextResponse.json({ ...endpoint, secret }, { status: 201 })
}
