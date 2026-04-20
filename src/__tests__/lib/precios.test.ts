import { describe, it, expect } from 'vitest'

// Mirror de la lógica de getPrecioBase sin dependencia de BD/prisma
const PRECIOS_HARDCODED: Record<string, number> = {
  NACIMIENTO: 19.9,
  MATRIMONIO: 19.9,
  DEFUNCION: 19.9,
  EMPADRONAMIENTO: 14.9,
  ANTECEDENTES_PENALES: 24.9,
  VIDA_LABORAL: 14.9,
  ULTIMAS_VOLUNTADES: 24.9,
  SEGUROS_FALLECIMIENTO: 24.9,
  TITULARIDAD_INMUEBLE: 29.9,
}

function getPrecioFallback(tipo: string): number {
  return PRECIOS_HARDCODED[tipo] ?? 19.9
}

function validarPrecioPatch(precioBase: unknown): string | null {
  const precio = parseFloat(String(precioBase))
  if (isNaN(precio)) return 'Precio inválido'
  if (precio < 0) return 'Precio inválido (0–9999)'
  if (precio > 9999) return 'Precio inválido (0–9999)'
  return null
}

describe('getPrecioFallback', () => {
  it('devuelve precio correcto para NACIMIENTO', () => {
    expect(getPrecioFallback('NACIMIENTO')).toBe(19.9)
  })

  it('devuelve precio correcto para ANTECEDENTES_PENALES', () => {
    expect(getPrecioFallback('ANTECEDENTES_PENALES')).toBe(24.9)
  })

  it('devuelve precio correcto para EMPADRONAMIENTO', () => {
    expect(getPrecioFallback('EMPADRONAMIENTO')).toBe(14.9)
  })

  it('devuelve 19.9 para tipos desconocidos', () => {
    expect(getPrecioFallback('TIPO_INVENTADO')).toBe(19.9)
  })

  it('cubre los 9 tipos de certificado', () => {
    expect(Object.keys(PRECIOS_HARDCODED)).toHaveLength(9)
  })
})

describe('validarPrecioPatch', () => {
  it('acepta precio válido', () => {
    expect(validarPrecioPatch(29.9)).toBeNull()
  })

  it('acepta precio cero', () => {
    expect(validarPrecioPatch(0)).toBeNull()
  })

  it('acepta precio en string numérico', () => {
    expect(validarPrecioPatch('49.99')).toBeNull()
  })

  it('rechaza precio negativo', () => {
    expect(validarPrecioPatch(-1)).toBeTruthy()
  })

  it('rechaza precio mayor que 9999', () => {
    expect(validarPrecioPatch(10000)).toBeTruthy()
  })

  it('rechaza NaN', () => {
    expect(validarPrecioPatch('precio')).toBeTruthy()
  })
})
