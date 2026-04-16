import crypto from 'crypto'

/** Genera una API key con prefijo `cd_` y devuelve la key en claro y su hash */
export function generarApiKey(): { key: string; keyHash: string; keyPrefix: string } {
  const raw = crypto.randomBytes(32).toString('hex')
  const key = `cd_${raw}`
  const keyHash = crypto.createHash('sha256').update(key).digest('hex')
  const keyPrefix = key.slice(0, 10) // "cd_" + 7 chars
  return { key, keyHash, keyPrefix }
}

export function hashApiKey(key: string): string {
  return crypto.createHash('sha256').update(key).digest('hex')
}
