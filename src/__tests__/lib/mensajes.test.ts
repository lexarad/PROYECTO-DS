import { describe, it, expect } from 'vitest'

const MAX_CONTENIDO = 2000
const ESTADOS_CERRADOS = ['COMPLETADA', 'RECHAZADA']

function validarMensaje(contenido: unknown, estadoSolicitud: string): string | null {
  if (ESTADOS_CERRADOS.includes(estadoSolicitud)) {
    return 'No se pueden enviar mensajes en solicitudes cerradas'
  }
  if (typeof contenido !== 'string') return 'Contenido inválido'
  const t = contenido.trim()
  if (!t) return 'El mensaje no puede estar vacío'
  if (t.length > MAX_CONTENIDO) return `Máximo ${MAX_CONTENIDO} caracteres`
  return null
}

describe('validarMensaje', () => {
  it('acepta mensaje válido', () => {
    expect(validarMensaje('Hola, tengo una duda', 'EN_PROCESO')).toBeNull()
  })

  it('rechaza solicitud COMPLETADA', () => {
    expect(validarMensaje('Mensaje', 'COMPLETADA')).toMatch(/cerradas/)
  })

  it('rechaza solicitud RECHAZADA', () => {
    expect(validarMensaje('Mensaje', 'RECHAZADA')).toMatch(/cerradas/)
  })

  it('permite mensajes en PENDIENTE', () => {
    expect(validarMensaje('Mensaje', 'PENDIENTE')).toBeNull()
  })

  it('rechaza contenido vacío', () => {
    expect(validarMensaje('   ', 'EN_PROCESO')).toMatch(/vacío/)
  })

  it('rechaza mensaje demasiado largo', () => {
    expect(validarMensaje('a'.repeat(MAX_CONTENIDO + 1), 'EN_PROCESO')).toMatch(/Máximo/)
  })

  it('acepta mensaje exactamente en el límite', () => {
    expect(validarMensaje('a'.repeat(MAX_CONTENIDO), 'EN_PROCESO')).toBeNull()
  })

  it('rechaza contenido no string', () => {
    expect(validarMensaje(null, 'EN_PROCESO')).toBeTruthy()
  })

  it('rechaza contenido numérico', () => {
    expect(validarMensaje(123, 'EN_PROCESO')).toBeTruthy()
  })
})

describe('estados cerrados', () => {
  it('identifica COMPLETADA como cerrada', () => {
    expect(ESTADOS_CERRADOS.includes('COMPLETADA')).toBe(true)
  })

  it('identifica RECHAZADA como cerrada', () => {
    expect(ESTADOS_CERRADOS.includes('RECHAZADA')).toBe(true)
  })

  it('EN_PROCESO no es cerrada', () => {
    expect(ESTADOS_CERRADOS.includes('EN_PROCESO')).toBe(false)
  })

  it('TRAMITADO no es cerrada', () => {
    expect(ESTADOS_CERRADOS.includes('TRAMITADO')).toBe(false)
  })
})
