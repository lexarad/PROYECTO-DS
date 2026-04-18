import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createHmac } from 'crypto'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const MAX_INTENTOS = 3
const BACKOFF_MS = [30_000, 120_000, 600_000]

function firmar(secret: string, timestamp: number, payload: string): string {
  return createHmac('sha256', secret).update(`${timestamp}.${payload}`).digest('hex')
}

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  // Deliveries fallidos con próximo reintento vencido
  const pendientes = await (prisma as any).webhookDelivery.findMany({
    where: {
      ok: false,
      intentos: { lt: MAX_INTENTOS },
      proximoIntento: { lte: new Date() },
    },
    include: { endpoint: true },
    take: 50,
  })

  let reintentos = 0
  let exitos = 0

  for (const delivery of pendientes) {
    const ep = delivery.endpoint
    if (!ep?.activo) continue

    const payloadStr = JSON.stringify({ evento: delivery.evento, ...delivery.payload })
    const timestamp = Math.floor(Date.now() / 1000)
    const firma = firmar(ep.secret, timestamp, payloadStr)

    let ok = false
    let status: number | undefined
    let error: string | undefined

    try {
      const res = await fetch(ep.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CertiDocs-Signature': `t=${timestamp},v1=${firma}`,
          'X-CertiDocs-Event': delivery.evento,
        },
        body: payloadStr,
        signal: AbortSignal.timeout(10_000),
      })
      status = res.status
      ok = res.ok
      if (!ok) error = `HTTP ${status}`
    } catch (err) {
      error = String(err)
    }

    const nuevosIntentos = delivery.intentos + 1
    const proximoIntento = ok || nuevosIntentos >= MAX_INTENTOS
      ? null
      : new Date(Date.now() + BACKOFF_MS[nuevosIntentos - 1])

    await (prisma as any).webhookDelivery.update({
      where: { id: delivery.id },
      data: { ok, status, intentos: nuevosIntentos, error: error ?? null, proximoIntento },
    })

    reintentos++
    if (ok) exitos++
  }

  return NextResponse.json({ reintentos, exitos, fallidos: reintentos - exitos })
}
