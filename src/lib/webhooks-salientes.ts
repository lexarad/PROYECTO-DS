import { createHmac, randomBytes } from 'crypto'
import { prisma } from '@/lib/prisma'

export type EventoWebhook =
  | 'solicitud.estado_cambiado'
  | 'solicitud.completada'
  | 'solicitud.rechazada'
  | 'solicitud.tramitada'

const BACKOFF_MS = [30_000, 120_000, 600_000]  // 30s, 2min, 10min

export function generarSecretWebhook(): string {
  return `whsec_${randomBytes(24).toString('hex')}`
}

/** Firma el payload con HMAC-SHA256 para que el receptor pueda verificar autenticidad */
function firmar(secret: string, timestamp: number, payload: string): string {
  const data = `${timestamp}.${payload}`
  return createHmac('sha256', secret).update(data).digest('hex')
}

/** Envía el evento a todos los endpoints activos del usuario que lo escuchan */
export async function dispararEvento(
  userId: string,
  evento: EventoWebhook,
  payload: Record<string, unknown>
): Promise<void> {
  const endpoints = await (prisma as any).webhookEndpoint.findMany({
    where: {
      userId,
      activo: true,
      OR: [
        { eventos: { has: evento } },
        { eventos: { isEmpty: true } },  // sin filtro = escucha todo
      ],
    },
  })

  if (endpoints.length === 0) return

  await Promise.allSettled(
    endpoints.map((ep: { id: string; url: string; secret: string }) =>
      enviarConReintentos(ep, evento, payload)
    )
  )
}

async function enviarConReintentos(
  ep: { id: string; url: string; secret: string },
  evento: string,
  payload: Record<string, unknown>
): Promise<void> {
  const payloadStr = JSON.stringify({ evento, ...payload })
  const timestamp = Math.floor(Date.now() / 1000)
  const firma = firmar(ep.secret, timestamp, payloadStr)

  let ultimoError = ''
  let status: number | undefined

  for (let intento = 0; intento <= 2; intento++) {
    if (intento > 0) {
      await new Promise(r => setTimeout(r, BACKOFF_MS[intento - 1]))
    }

    try {
      const res = await fetch(ep.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CertiDocs-Signature': `t=${timestamp},v1=${firma}`,
          'X-CertiDocs-Event': evento,
        },
        body: payloadStr,
        signal: AbortSignal.timeout(10_000),
      })

      status = res.status

      if (res.ok) {
        await (prisma as any).webhookDelivery.create({
          data: { endpointId: ep.id, evento, payload, status, intentos: intento + 1, ok: true },
        })
        return
      }

      ultimoError = `HTTP ${res.status}`
    } catch (err) {
      ultimoError = String(err)
    }
  }

  // Todos los reintentos fallaron
  await (prisma as any).webhookDelivery.create({
    data: {
      endpointId: ep.id,
      evento,
      payload,
      status,
      intentos: 3,
      ok: false,
      error: ultimoError,
    },
  })
}
