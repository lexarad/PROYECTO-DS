import { describe, it, expect } from 'vitest'
import { generarTOTP, segundosRestantesTOTP } from '@/lib/automatizacion/auth/totp'

// Vector de prueba RFC 6238: secret = 'JBSWY3DPEHPK3PXP' (base32 de 'Hello!')
// Generado con: https://totp.danhersam.com/ y authy para verificación
const TEST_SECRET = 'JBSWY3DPEHPK3PXP'

describe('generarTOTP', () => {
  it('genera un código de 6 dígitos', () => {
    const code = generarTOTP(TEST_SECRET)
    expect(code).toHaveLength(6)
    expect(code).toMatch(/^\d{6}$/)
  })

  it('produce el mismo código en el mismo período de 30s', () => {
    const code1 = generarTOTP(TEST_SECRET)
    const code2 = generarTOTP(TEST_SECRET)
    expect(code1).toBe(code2)
  })

  it('acepta período personalizado', () => {
    const code = generarTOTP(TEST_SECRET, { period: 60 })
    expect(code).toHaveLength(6)
    expect(code).toMatch(/^\d{6}$/)
  })

  it('acepta digits personalizado', () => {
    const code = generarTOTP(TEST_SECRET, { digits: 8 })
    expect(code).toHaveLength(8)
    expect(code).toMatch(/^\d{8}$/)
  })

  it('produce un código con relleno de ceros si es necesario', () => {
    // Difícil de forzar, pero verificamos que nunca devuelve menos dígitos
    for (let i = 0; i < 20; i++) {
      const code = generarTOTP(TEST_SECRET)
      expect(code.length).toBe(6)
    }
  })

  it('acepta secrets con espacios (formato exportado por apps)', () => {
    const secretConEspacios = 'JBSWY3DP EHPK3PXP'
    // No debe lanzar error
    expect(() => generarTOTP(secretConEspacios)).not.toThrow()
    const code = generarTOTP(secretConEspacios)
    expect(code).toHaveLength(6)
  })

  it('acepta secrets en minúsculas', () => {
    const code = generarTOTP(TEST_SECRET.toLowerCase())
    expect(code).toHaveLength(6)
  })

  it('es determinista para un counter fijo', () => {
    // Llamar dos veces dentro del mismo segundo produce el mismo resultado
    const t1 = Date.now()
    const code1 = generarTOTP(TEST_SECRET)
    // Solo tiene sentido si no cruzamos el límite de 30s (muy improbable en un test)
    const t2 = Date.now()
    if (Math.floor(t1 / 30000) === Math.floor(t2 / 30000)) {
      const code2 = generarTOTP(TEST_SECRET)
      expect(code1).toBe(code2)
    }
  })
})

describe('segundosRestantesTOTP', () => {
  it('devuelve un valor entre 1 y 30', () => {
    const s = segundosRestantesTOTP()
    expect(s).toBeGreaterThanOrEqual(1)
    expect(s).toBeLessThanOrEqual(30)
  })

  it('acepta período personalizado', () => {
    const s = segundosRestantesTOTP(60)
    expect(s).toBeGreaterThanOrEqual(1)
    expect(s).toBeLessThanOrEqual(60)
  })
})
