import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mocks hoisted (deben estar antes de cualquier import que los referencie)
const mocks = vi.hoisted(() => ({
  userFindUnique: vi.fn(),
  creditoReferidoFindUnique: vi.fn(),
  creditoReferidoCreate: vi.fn(),
  codigoPromoCreate: vi.fn(),
}))

vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: { findUnique: mocks.userFindUnique },
    creditoReferido: {
      findUnique: mocks.creditoReferidoFindUnique,
      create: mocks.creditoReferidoCreate,
    },
    codigoPromo: { create: mocks.codigoPromoCreate },
  },
}))

import { generarReferralCode, procesarCreditoReferido } from '@/lib/referidos'

describe('generarReferralCode', () => {
  it('genera un código de 8 caracteres', () => {
    const code = generarReferralCode()
    expect(code).toHaveLength(8)
  })

  it('solo usa caracteres del alfabeto permitido', () => {
    const CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
    for (let i = 0; i < 50; i++) {
      const code = generarReferralCode()
      for (const ch of code) {
        expect(CHARS).toContain(ch)
      }
    }
  })

  it('genera códigos distintos en llamadas sucesivas', () => {
    const codes = new Set(Array.from({ length: 20 }, () => generarReferralCode()))
    expect(codes.size).toBeGreaterThan(15)
  })

  it('no contiene caracteres ambiguos (0, O, 1, I)', () => {
    for (let i = 0; i < 100; i++) {
      const code = generarReferralCode()
      expect(code).not.toMatch(/[01OI]/)
    }
  })
})

describe('procesarCreditoReferido', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('retorna null si el usuario no tiene referidoPorId', async () => {
    mocks.userFindUnique.mockResolvedValue({ referidoPorId: null })
    const result = await procesarCreditoReferido('user-sin-referido')
    expect(result).toBeNull()
    expect(mocks.creditoReferidoCreate).not.toHaveBeenCalled()
  })

  it('retorna null si ya existe un crédito para ese referido', async () => {
    mocks.userFindUnique.mockResolvedValue({ referidoPorId: 'referidor-1' })
    mocks.creditoReferidoFindUnique.mockResolvedValue({ id: 'existing-credit' })
    const result = await procesarCreditoReferido('user-ya-procesado')
    expect(result).toBeNull()
    expect(mocks.creditoReferidoCreate).not.toHaveBeenCalled()
  })

  it('crea un CodigoPromo y CreditoReferido cuando todo es válido', async () => {
    mocks.userFindUnique.mockResolvedValue({ referidoPorId: 'referidor-42' })
    mocks.creditoReferidoFindUnique.mockResolvedValue(null)
    mocks.codigoPromoCreate.mockResolvedValue({})
    mocks.creditoReferidoCreate.mockResolvedValue({})

    const result = await procesarCreditoReferido('nuevo-usuario')

    expect(result).not.toBeNull()
    expect(result?.userId).toBe('referidor-42')
    expect(result?.codigoPromo).toMatch(/^REF-/)
    expect(mocks.codigoPromoCreate).toHaveBeenCalledOnce()
    expect(mocks.creditoReferidoCreate).toHaveBeenCalledOnce()
  })

  it('el código promo tiene descuento 15 y maxUsos 1', async () => {
    mocks.userFindUnique.mockResolvedValue({ referidoPorId: 'ref-99' })
    mocks.creditoReferidoFindUnique.mockResolvedValue(null)
    mocks.codigoPromoCreate.mockResolvedValue({})
    mocks.creditoReferidoCreate.mockResolvedValue({})

    await procesarCreditoReferido('user-nuevo')

    const callArg = mocks.codigoPromoCreate.mock.calls[0][0].data
    expect(callArg.descuento).toBe(15)
    expect(callArg.maxUsos).toBe(1)
    expect(callArg.expira).toBeInstanceOf(Date)
  })

  it('el creditoReferido se crea con el userId correcto del referidor', async () => {
    mocks.userFindUnique.mockResolvedValue({ referidoPorId: 'referidor-xyz' })
    mocks.creditoReferidoFindUnique.mockResolvedValue(null)
    mocks.codigoPromoCreate.mockResolvedValue({})
    mocks.creditoReferidoCreate.mockResolvedValue({})

    await procesarCreditoReferido('referido-abc')

    const creditoArg = mocks.creditoReferidoCreate.mock.calls[0][0].data
    expect(creditoArg.userId).toBe('referidor-xyz')
    expect(creditoArg.referidoId).toBe('referido-abc')
    expect(creditoArg.cantidad).toBe(5)
  })
})
