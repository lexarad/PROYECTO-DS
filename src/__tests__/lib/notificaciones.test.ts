import { describe, it, expect } from 'vitest'

const TIPOS_VALIDOS = ['ESTADO_CAMBIADO', 'MENSAJE', 'DOCUMENTO', 'PAGO'] as const
type TipoNotificacion = typeof TIPOS_VALIDOS[number]

const TIPO_ICON: Record<TipoNotificacion, string> = {
  ESTADO_CAMBIADO: '📋',
  MENSAJE: '💬',
  DOCUMENTO: '📄',
  PAGO: '✅',
}

const ESTADOS_LABEL: Record<string, string> = {
  EN_PROCESO: 'En proceso',
  TRAMITADO: 'Tramitado',
  COMPLETADA: 'Completada',
  RECHAZADA: 'Rechazada',
  PENDIENTE: 'Pendiente',
}

function buildCuerpoEstado(referencia: string, estado: string, nota?: string): string {
  const label = ESTADOS_LABEL[estado] ?? estado
  return nota ? `${referencia} → ${label}: ${nota}` : `${referencia} → ${label}`
}

describe('TIPOS_VALIDOS', () => {
  it('contiene exactamente los 4 tipos', () => {
    expect(TIPOS_VALIDOS).toHaveLength(4)
  })

  it('ESTADO_CAMBIADO está en la lista', () => {
    expect(TIPOS_VALIDOS).toContain('ESTADO_CAMBIADO')
  })

  it('MENSAJE está en la lista', () => {
    expect(TIPOS_VALIDOS).toContain('MENSAJE')
  })
})

describe('TIPO_ICON', () => {
  it('asigna icono a todos los tipos', () => {
    for (const tipo of TIPOS_VALIDOS) {
      expect(TIPO_ICON[tipo]).toBeTruthy()
    }
  })

  it('PAGO tiene check verde', () => {
    expect(TIPO_ICON['PAGO']).toBe('✅')
  })
})

describe('buildCuerpoEstado', () => {
  it('sin nota incluye referencia y estado', () => {
    const cuerpo = buildCuerpoEstado('CD-123', 'COMPLETADA')
    expect(cuerpo).toContain('CD-123')
    expect(cuerpo).toContain('Completada')
  })

  it('con nota incluye la nota', () => {
    const cuerpo = buildCuerpoEstado('CD-123', 'RECHAZADA', 'Documentación incompleta')
    expect(cuerpo).toContain('Documentación incompleta')
  })

  it('estado desconocido usa el valor raw', () => {
    const cuerpo = buildCuerpoEstado('CD-999', 'NUEVO_ESTADO_FUTURO')
    expect(cuerpo).toContain('NUEVO_ESTADO_FUTURO')
  })
})

describe('ESTADOS_LABEL', () => {
  it('tiene etiqueta para EN_PROCESO', () => {
    expect(ESTADOS_LABEL['EN_PROCESO']).toBe('En proceso')
  })

  it('tiene etiqueta para COMPLETADA', () => {
    expect(ESTADOS_LABEL['COMPLETADA']).toBe('Completada')
  })

  it('tiene los 5 estados del enum', () => {
    expect(Object.keys(ESTADOS_LABEL)).toHaveLength(5)
  })
})
