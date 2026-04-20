import { describe, it, expect } from 'vitest'

const LABELS_ENTREGA: Record<string, string> = {
  metodo_entrega: 'Método de entrega',
  postal_nombre: 'Destinatario postal',
  postal_direccion: 'Dirección postal',
  postal_cp: 'Código postal',
  postal_ciudad: 'Ciudad',
  postal_pais: 'País',
}

function humanizeKey(k: string): string {
  return (LABELS_ENTREGA[k] ?? k.replace(/_/g, ' ').replace(/([A-Z])/g, ' $1').toLowerCase())
}

describe('labels de entrega postal', () => {
  it('devuelve etiqueta legible para metodo_entrega', () => {
    expect(humanizeKey('metodo_entrega')).toBe('Método de entrega')
  })

  it('devuelve etiqueta legible para todos los campos postales', () => {
    expect(humanizeKey('postal_nombre')).toBe('Destinatario postal')
    expect(humanizeKey('postal_direccion')).toBe('Dirección postal')
    expect(humanizeKey('postal_cp')).toBe('Código postal')
    expect(humanizeKey('postal_ciudad')).toBe('Ciudad')
    expect(humanizeKey('postal_pais')).toBe('País')
  })

  it('convierte guiones bajos a espacios en claves no mapeadas', () => {
    expect(humanizeKey('mi_campo_nuevo')).toBe('mi campo nuevo')
  })

  it('no rompe con claves camelCase legacy', () => {
    expect(humanizeKey('nombreCompleto')).toBe('nombre completo')
  })
})

describe('validación campos postal obligatorios', () => {
  const REQUERIDOS = ['postal_nombre', 'postal_direccion', 'postal_cp', 'postal_ciudad']

  function validarPostal(datos: Record<string, string>): boolean {
    return REQUERIDOS.every(k => (datos[k] ?? '').trim().length > 0)
  }

  it('pasa con todos los campos rellenos', () => {
    expect(validarPostal({
      postal_nombre: 'Juan García',
      postal_direccion: 'Calle Mayor 1',
      postal_cp: '28001',
      postal_ciudad: 'Madrid',
    })).toBe(true)
  })

  it('falla si falta cualquier campo obligatorio', () => {
    expect(validarPostal({ postal_nombre: 'Juan', postal_direccion: 'Calle 1', postal_cp: '28001' })).toBe(false)
    expect(validarPostal({ postal_nombre: '', postal_direccion: 'Calle 1', postal_cp: '28001', postal_ciudad: 'Madrid' })).toBe(false)
  })

  it('postal_pais es opcional', () => {
    expect(validarPostal({
      postal_nombre: 'Juan',
      postal_direccion: 'Calle 1',
      postal_cp: '28001',
      postal_ciudad: 'Madrid',
      // sin postal_pais
    })).toBe(true)
  })
})
