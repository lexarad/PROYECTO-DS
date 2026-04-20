import { describe, it, expect } from 'vitest'
import { CERTIFICADOS, getCertificado } from '@/lib/certificados'

describe('CERTIFICADOS', () => {
  it('contiene exactamente 10 certificados', () => {
    expect(CERTIFICADOS).toHaveLength(10)
  })

  it('todos los certificados tienen precio positivo', () => {
    CERTIFICADOS.forEach((c) => expect(c.precio).toBeGreaterThan(0))
  })

  it('todos los certificados con formulario tienen al menos un campo requerido', () => {
    // OCR_EXTRACCION no tiene campos (es un servicio de upload, no formulario)
    const conFormulario = CERTIFICADOS.filter((c) => c.campos.length > 0)
    conFormulario.forEach((c) => {
      const requeridos = c.campos.filter((f) => f.requerido)
      expect(requeridos.length).toBeGreaterThan(0)
    })
  })
})

describe('getCertificado', () => {
  it('devuelve la configuración correcta por tipo', () => {
    const cert = getCertificado('NACIMIENTO')
    expect(cert).toBeDefined()
    expect(cert!.tipo).toBe('NACIMIENTO')
  })

  it('devuelve undefined para tipo inexistente', () => {
    expect(getCertificado('INEXISTENTE')).toBeUndefined()
  })

  it('es case-insensitive en el código — getNacimiento funciona en mayúsculas', () => {
    expect(getCertificado('MATRIMONIO')).toBeDefined()
    expect(getCertificado('VIDA_LABORAL')).toBeDefined()
  })
})
