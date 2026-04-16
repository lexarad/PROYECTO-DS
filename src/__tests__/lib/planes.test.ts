import { describe, it, expect } from 'vitest'
import { PLANES, getPlan, aplicarDescuento } from '@/lib/planes'

describe('PLANES', () => {
  it('contiene FREE, PRO y ENTERPRISE', () => {
    const tipos = PLANES.map((p) => p.plan)
    expect(tipos).toContain('FREE')
    expect(tipos).toContain('PRO')
    expect(tipos).toContain('ENTERPRISE')
  })

  it('FREE tiene precio 0 y sin acceso API', () => {
    const free = getPlan('FREE')
    expect(free.precio).toBe(0)
    expect(free.apiAccess).toBe(false)
    expect(free.descuento).toBe(0)
  })

  it('PRO y ENTERPRISE tienen acceso API', () => {
    expect(getPlan('PRO').apiAccess).toBe(true)
    expect(getPlan('ENTERPRISE').apiAccess).toBe(true)
  })

  it('ENTERPRISE tiene mayor descuento que PRO', () => {
    expect(getPlan('ENTERPRISE').descuento).toBeGreaterThan(getPlan('PRO').descuento)
  })

  it('ENTERPRISE tiene solicitudes ilimitadas', () => {
    expect(getPlan('ENTERPRISE').maxSolicitudesMes).toBeNull()
  })
})

describe('aplicarDescuento', () => {
  it('FREE no aplica descuento', () => {
    expect(aplicarDescuento(19.9, 'FREE')).toBe(19.9)
  })

  it('PRO aplica 15% de descuento', () => {
    const resultado = aplicarDescuento(20, 'PRO')
    expect(resultado).toBe(17)
  })

  it('ENTERPRISE aplica 25% de descuento', () => {
    const resultado = aplicarDescuento(20, 'ENTERPRISE')
    expect(resultado).toBe(15)
  })

  it('redondea a 2 decimales', () => {
    const resultado = aplicarDescuento(19.9, 'PRO')
    const decimals = resultado.toString().split('.')[1]?.length ?? 0
    expect(decimals).toBeLessThanOrEqual(2)
  })
})
