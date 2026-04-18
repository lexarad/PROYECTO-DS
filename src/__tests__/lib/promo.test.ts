import { describe, it, expect } from 'vitest'

function validarPromo(promo: {
  activo: boolean
  expira: Date | null
  maxUsos: number | null
  usos: number
  descuento: number
}): { ok: boolean; error?: string; descuento?: number } {
  if (!promo.activo) return { ok: false, error: 'Código no válido' }
  if (promo.expira && promo.expira < new Date()) return { ok: false, error: 'Código expirado' }
  if (promo.maxUsos !== null && promo.usos >= promo.maxUsos) return { ok: false, error: 'Código agotado' }
  return { ok: true, descuento: promo.descuento }
}

function aplicarDescuentoPromo(precio: number, descuento: number): number {
  return parseFloat((precio * (1 - descuento / 100)).toFixed(2))
}

describe('validarPromo', () => {
  const BASE = { activo: true, expira: null, maxUsos: null, usos: 0, descuento: 10 }

  it('acepta código válido sin restricciones', () => {
    expect(validarPromo(BASE)).toEqual({ ok: true, descuento: 10 })
  })

  it('rechaza código inactivo', () => {
    expect(validarPromo({ ...BASE, activo: false })).toMatchObject({ ok: false })
  })

  it('rechaza código expirado', () => {
    const pasado = new Date(Date.now() - 1000)
    expect(validarPromo({ ...BASE, expira: pasado })).toMatchObject({ ok: false, error: 'Código expirado' })
  })

  it('acepta código con fecha futura', () => {
    const futuro = new Date(Date.now() + 86400000)
    expect(validarPromo({ ...BASE, expira: futuro })).toMatchObject({ ok: true })
  })

  it('rechaza código agotado (maxUsos alcanzado)', () => {
    expect(validarPromo({ ...BASE, maxUsos: 5, usos: 5 })).toMatchObject({ ok: false, error: 'Código agotado' })
  })

  it('acepta cuando usos < maxUsos', () => {
    expect(validarPromo({ ...BASE, maxUsos: 5, usos: 4 })).toMatchObject({ ok: true })
  })

  it('maxUsos null = ilimitado', () => {
    expect(validarPromo({ ...BASE, maxUsos: null, usos: 9999 })).toMatchObject({ ok: true })
  })
})

describe('aplicarDescuentoPromo', () => {
  it('aplica 10% correctamente', () => {
    expect(aplicarDescuentoPromo(19.9, 10)).toBe(17.91)
  })

  it('aplica 25% correctamente', () => {
    const result = aplicarDescuentoPromo(24.9, 25)
    expect(result).toBeCloseTo(18.675, 1)
  })

  it('aplica 100% → 0', () => {
    expect(aplicarDescuentoPromo(19.9, 100)).toBe(0)
  })

  it('precio 0 → sigue siendo 0', () => {
    expect(aplicarDescuentoPromo(0, 15)).toBe(0)
  })

  it('resultado redondeado a 2 decimales', () => {
    const result = aplicarDescuentoPromo(14.9, 10)
    expect(result.toString()).toMatch(/^\d+\.\d{1,2}$/)
  })
})
