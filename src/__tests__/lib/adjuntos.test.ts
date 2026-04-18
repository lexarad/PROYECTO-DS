import { describe, it, expect } from 'vitest'

const MAX_SIZE = 10 * 1024 * 1024
const MAX_PER_SOLICITUD = 5
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'application/pdf']

function validarAdjunto(tipo: string, tamanio: number, actuales: number): string | null {
  if (actuales >= MAX_PER_SOLICITUD) return `Máximo ${MAX_PER_SOLICITUD} archivos por solicitud`
  if (tamanio > MAX_SIZE) return 'El archivo supera 10 MB'
  if (!ALLOWED_TYPES.includes(tipo)) return 'Tipo de archivo no permitido. Usa PDF, JPG, PNG o WEBP'
  return null
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

describe('validarAdjunto', () => {
  it('acepta PDF dentro del límite', () => {
    expect(validarAdjunto('application/pdf', 500_000, 0)).toBeNull()
  })

  it('acepta imagen JPEG', () => {
    expect(validarAdjunto('image/jpeg', 1_000_000, 2)).toBeNull()
  })

  it('acepta PNG', () => {
    expect(validarAdjunto('image/png', 2_000_000, 0)).toBeNull()
  })

  it('rechaza si ya hay 5 adjuntos', () => {
    expect(validarAdjunto('application/pdf', 100, 5)).toMatch(/Máximo/)
  })

  it('rechaza archivos mayores de 10 MB', () => {
    expect(validarAdjunto('image/jpeg', MAX_SIZE + 1, 0)).toMatch(/supera 10 MB/)
  })

  it('rechaza tipos no permitidos (docx)', () => {
    expect(validarAdjunto('application/vnd.openxmlformats-officedocument.wordprocessingml.document', 100, 0)).toMatch(/no permitido/)
  })

  it('rechaza tipos no permitidos (gif)', () => {
    expect(validarAdjunto('image/gif', 100, 0)).toMatch(/no permitido/)
  })

  it('acepta justo en el límite de tamaño', () => {
    expect(validarAdjunto('application/pdf', MAX_SIZE, 0)).toBeNull()
  })

  it('acepta el cuarto archivo (index 4) de 5', () => {
    expect(validarAdjunto('image/png', 100, 4)).toBeNull()
  })
})

describe('formatBytes', () => {
  it('formatea bytes', () => {
    expect(formatBytes(500)).toBe('500 B')
  })

  it('formatea KB', () => {
    expect(formatBytes(102_400)).toBe('100 KB')
  })

  it('formatea MB', () => {
    expect(formatBytes(2 * 1024 * 1024)).toBe('2.0 MB')
  })
})
