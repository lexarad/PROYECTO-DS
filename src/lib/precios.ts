import { prisma } from '@/lib/prisma'
import { getCertificado } from '@/lib/certificados'
import type { TipoCertificado } from '@prisma/client'

// Cache en memoria para evitar una query por request; TTL 60s
const cache = new Map<string, { precio: number; ts: number }>()
const CACHE_TTL = 60_000

export async function getPrecioBase(tipo: TipoCertificado): Promise<number> {
  const now = Date.now()
  const hit = cache.get(tipo)
  if (hit && now - hit.ts < CACHE_TTL) return hit.precio

  try {
    const config = await prisma.precioConfig.findUnique({ where: { tipo } })
    if (config) {
      cache.set(tipo, { precio: config.precioBase, ts: now })
      return config.precioBase
    }
  } catch { /* fallback to hardcoded */ }

  // Fallback al precio hardcodeado en certificados.ts
  const fallback = getCertificado(tipo)?.precio ?? 19.9
  cache.set(tipo, { precio: fallback, ts: now })
  return fallback
}

export function invalidarCachePrecio(tipo: string) {
  cache.delete(tipo)
}
