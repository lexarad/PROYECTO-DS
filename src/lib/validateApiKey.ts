import { prisma } from './prisma'
import { hashApiKey } from './apikeys'

/** Valida una API key y devuelve el userId si es válida, o null */
export async function validateApiKey(authHeader: string | null): Promise<string | null> {
  if (!authHeader?.startsWith('Bearer cd_')) return null

  const key = authHeader.replace('Bearer ', '')
  const keyHash = hashApiKey(key)

  const apiKey = await prisma.apiKey.findUnique({
    where: { keyHash },
    select: { id: true, userId: true, activa: true },
  })

  if (!apiKey || !apiKey.activa) return null

  // Actualizar lastUsedAt sin bloquear
  prisma.apiKey.update({ where: { id: apiKey.id }, data: { lastUsedAt: new Date() } }).catch(() => {})

  return apiKey.userId
}
