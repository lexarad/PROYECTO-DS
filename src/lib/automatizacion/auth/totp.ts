import { createHmac } from 'crypto'

function base32Decode(base32: string): Buffer {
  const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'
  const cleaned = base32.toUpperCase().replace(/\s/g, '').replace(/=+$/, '')
  const output: number[] = []
  let bits = 0
  let value = 0

  for (const char of cleaned) {
    const idx = ALPHABET.indexOf(char)
    if (idx === -1) continue
    value = (value << 5) | idx
    bits += 5
    if (bits >= 8) {
      output.push((value >>> (bits - 8)) & 0xff)
      bits -= 8
    }
  }
  return Buffer.from(output)
}

/**
 * Genera un código TOTP (RFC 6238 / RFC 4226).
 * Compatible con Google Authenticator, Authy, y cualquier app TOTP estándar.
 */
export function generarTOTP(
  secret: string,
  options: { period?: number; digits?: number } = {}
): string {
  const { period = 30, digits = 6 } = options

  const epoch = Math.floor(Date.now() / 1000)
  const counter = Math.floor(epoch / period)

  const key = base32Decode(secret)
  const counterBuf = Buffer.alloc(8)
  // Write as big-endian 64-bit integer
  counterBuf.writeUInt32BE(Math.floor(counter / 0x100000000), 0)
  counterBuf.writeUInt32BE(counter >>> 0, 4)

  const hmac = createHmac('sha1', key)
  hmac.update(counterBuf)
  const hash = hmac.digest()

  const offset = hash[hash.length - 1] & 0x0f
  const code =
    ((hash[offset] & 0x7f) << 24) |
    ((hash[offset + 1] & 0xff) << 16) |
    ((hash[offset + 2] & 0xff) << 8) |
    (hash[offset + 3] & 0xff)

  return String(code % 10 ** digits).padStart(digits, '0')
}

/** Devuelve segundos restantes hasta que el código actual expire */
export function segundosRestantesTOTP(period = 30): number {
  return period - (Math.floor(Date.now() / 1000) % period)
}
