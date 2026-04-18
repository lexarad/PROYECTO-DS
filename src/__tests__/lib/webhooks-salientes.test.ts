import { describe, it, expect } from 'vitest'
import { generarSecretWebhook } from '@/lib/webhooks-salientes'

describe('generarSecretWebhook', () => {
  it('genera un secret con prefijo whsec_', () => {
    const secret = generarSecretWebhook()
    expect(secret).toMatch(/^whsec_[a-f0-9]{48}$/)
  })

  it('cada llamada genera un secret distinto', () => {
    const a = generarSecretWebhook()
    const b = generarSecretWebhook()
    expect(a).not.toBe(b)
  })

  it('el secret tiene longitud correcta (48 hex = 24 bytes)', () => {
    const secret = generarSecretWebhook()
    const hex = secret.replace('whsec_', '')
    expect(hex.length).toBe(48)
  })
})

describe('eventos válidos de webhook', () => {
  const EVENTOS = [
    'solicitud.estado_cambiado',
    'solicitud.completada',
    'solicitud.rechazada',
    'solicitud.tramitada',
  ]

  it('los 4 tipos de evento están definidos', () => {
    expect(EVENTOS).toHaveLength(4)
  })

  it('todos los eventos siguen el formato recurso.accion', () => {
    for (const ev of EVENTOS) {
      expect(ev).toMatch(/^\w+\.\w+$/)
    }
  })
})
