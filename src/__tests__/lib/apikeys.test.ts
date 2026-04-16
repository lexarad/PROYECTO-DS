import { describe, it, expect } from 'vitest'
import { generarApiKey, hashApiKey } from '@/lib/apikeys'

describe('generarApiKey', () => {
  it('genera una key con prefijo cd_', () => {
    const { key } = generarApiKey()
    expect(key.startsWith('cd_')).toBe(true)
  })

  it('el keyPrefix son los primeros 10 caracteres de la key', () => {
    const { key, keyPrefix } = generarApiKey()
    expect(keyPrefix).toBe(key.slice(0, 10))
  })

  it('el hash es distinto de la key en claro', () => {
    const { key, keyHash } = generarApiKey()
    expect(keyHash).not.toBe(key)
  })

  it('el hash es SHA-256 (64 chars hex)', () => {
    const { keyHash } = generarApiKey()
    expect(keyHash).toHaveLength(64)
    expect(keyHash).toMatch(/^[a-f0-9]+$/)
  })

  it('dos llamadas generan keys distintas', () => {
    const { key: k1 } = generarApiKey()
    const { key: k2 } = generarApiKey()
    expect(k1).not.toBe(k2)
  })
})

describe('hashApiKey', () => {
  it('produce el mismo hash para la misma key', () => {
    const { key, keyHash } = generarApiKey()
    expect(hashApiKey(key)).toBe(keyHash)
  })

  it('produce hashes distintos para keys distintas', () => {
    const { key: k1 } = generarApiKey()
    const { key: k2 } = generarApiKey()
    expect(hashApiKey(k1)).not.toBe(hashApiKey(k2))
  })
})
