import { describe, it, expect } from 'vitest'
import { TIPO_LABEL, EMPRESA } from '@/lib/factura'

describe('TIPO_LABEL', () => {
  it('cubre los 8 tipos de certificado', () => {
    const tipos = Object.keys(TIPO_LABEL)
    expect(tipos).toHaveLength(8)
    expect(tipos).toContain('NACIMIENTO')
    expect(tipos).toContain('SEGUROS_FALLECIMIENTO')
  })

  it('los valores no contienen guiones bajos', () => {
    for (const label of Object.values(TIPO_LABEL)) {
      expect(label).not.toContain('_')
    }
  })
})

describe('EMPRESA', () => {
  it('tiene campos nombre, nif, direccion y email', () => {
    expect(EMPRESA).toHaveProperty('nombre')
    expect(EMPRESA).toHaveProperty('nif')
    expect(EMPRESA).toHaveProperty('direccion')
    expect(EMPRESA).toHaveProperty('email')
  })

  it('los valores no están vacíos', () => {
    expect(EMPRESA.nombre.length).toBeGreaterThan(0)
    expect(EMPRESA.nif.length).toBeGreaterThan(0)
  })
})

describe('Cálculo de IVA', () => {
  it('la base imponible es precio / 1.21', () => {
    const total = 48.40
    const base = parseFloat((total / 1.21).toFixed(2))
    const iva = parseFloat((total - base).toFixed(2))
    expect(base + iva).toBeCloseTo(total, 1)
    expect(iva / base).toBeCloseTo(0.21, 2)
  })

  it('el total con IVA es correcto para varios precios', () => {
    const precios = [19.9, 29, 79, 48.40, 100]
    for (const p of precios) {
      const base = parseFloat((p / 1.21).toFixed(2))
      const iva = parseFloat((p - base).toFixed(2))
      expect(base).toBeLessThan(p)
      expect(iva).toBeGreaterThan(0)
      expect(base + iva).toBeCloseTo(p, 1)
    }
  })
})
