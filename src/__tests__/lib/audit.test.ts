import { describe, it, expect } from 'vitest'

type AccionAudit =
  | 'ESTADO_CAMBIADO' | 'DOCUMENTO_AÑADIDO' | 'REEMBOLSO'
  | 'PAGO_CONFIRMADO' | 'NOTA_ACTUALIZADA' | 'MENSAJE_ENVIADO'
  | 'BULK_ESTADO' | 'PROMO_CREADA' | 'PROMO_ELIMINADA'

const ACCIONES_VALIDAS: AccionAudit[] = [
  'ESTADO_CAMBIADO', 'DOCUMENTO_AÑADIDO', 'REEMBOLSO',
  'PAGO_CONFIRMADO', 'NOTA_ACTUALIZADA', 'MENSAJE_ENVIADO',
  'BULK_ESTADO', 'PROMO_CREADA', 'PROMO_ELIMINADA',
]

function buildResumenEstado(referencia: string, estado: string, nota?: string): string {
  return nota ? `${referencia} → ${estado} (${nota})` : `${referencia} → ${estado}`
}

function buildResumenReembolso(referencia: string, precio: number, refundId: string): string {
  return `Reembolso ${precio.toFixed(2)}€ — ${referencia} (${refundId})`
}

function buildResumenDocumento(nombre: string, referencia: string): string {
  return `Doc "${nombre}" añadido a ${referencia}`
}

function buildResumenBulk(count: number, estado: string): string {
  return `Bulk: ${count} solicitudes → ${estado}`
}

describe('AccionAudit válidas', () => {
  it('hay exactamente 9 tipos de acción', () => {
    expect(ACCIONES_VALIDAS).toHaveLength(9)
  })

  it('ESTADO_CAMBIADO está incluido', () => {
    expect(ACCIONES_VALIDAS).toContain('ESTADO_CAMBIADO')
  })

  it('REEMBOLSO está incluido', () => {
    expect(ACCIONES_VALIDAS).toContain('REEMBOLSO')
  })
})

describe('buildResumenEstado', () => {
  it('sin nota omite los paréntesis', () => {
    const r = buildResumenEstado('CD-123', 'COMPLETADA')
    expect(r).toBe('CD-123 → COMPLETADA')
    expect(r).not.toContain('(')
  })

  it('con nota incluye la nota entre paréntesis', () => {
    expect(buildResumenEstado('CD-123', 'RECHAZADA', 'Falta DNI')).toBe('CD-123 → RECHAZADA (Falta DNI)')
  })
})

describe('buildResumenReembolso', () => {
  it('formatea correctamente el importe', () => {
    const r = buildResumenReembolso('CD-456', 49.99, 're_123')
    expect(r).toContain('49.99€')
    expect(r).toContain('CD-456')
    expect(r).toContain('re_123')
  })

  it('usa toFixed(2) para importes enteros', () => {
    expect(buildResumenReembolso('CD-1', 50, 're_x')).toContain('50.00€')
  })
})

describe('buildResumenDocumento', () => {
  it('incluye nombre y referencia', () => {
    const r = buildResumenDocumento('certificado.pdf', 'CD-789')
    expect(r).toContain('certificado.pdf')
    expect(r).toContain('CD-789')
  })
})

describe('buildResumenBulk', () => {
  it('incluye el conteo y el estado', () => {
    expect(buildResumenBulk(5, 'TRAMITADO')).toBe('Bulk: 5 solicitudes → TRAMITADO')
  })

  it('funciona con 1 solicitud', () => {
    expect(buildResumenBulk(1, 'COMPLETADA')).toContain('1 solicitudes')
  })
})
