import { describe, it, expect, vi } from 'vitest'
import { esAutomatizable } from '@/lib/automatizacion/runner'
import { JobLogger } from '@/lib/automatizacion/logger'
import { antecedentesPenalesSchema } from '@/lib/automatizacion/schemas'

const BASE_SOLICITANTE = {
  solNombre: 'Ana', solApellido1: 'García', solDni: '12345678A',
  solTelefono: '612345678', solDireccion: 'Calle Mayor 1',
  solCp: '28001', solMunicipio: 'Madrid', solProvincia: 'Madrid',
}

describe('antecedentesPenalesSchema', () => {
  it('valida datos correctos con DNI', () => {
    const r = antecedentesPenalesSchema.safeParse({
      ...BASE_SOLICITANTE,
      nombre: 'Pedro', apellido1: 'López', fechaNacimiento: '15/03/1985',
      tipoDocumento: 'DNI', numeroDocumento: '12345678A',
      finalidad: 'Trámites ante la Administración', modalidad: 'Ordinario',
    })
    expect(r.success).toBe(true)
  })

  it('valida datos con NIE', () => {
    const r = antecedentesPenalesSchema.safeParse({
      ...BASE_SOLICITANTE,
      nombre: 'John', apellido1: 'Smith', fechaNacimiento: '01/01/1990',
      tipoDocumento: 'NIE', numeroDocumento: 'X1234567A',
      finalidad: 'Otros', modalidad: 'Urgente',
    })
    expect(r.success).toBe(true)
  })

  it('rechaza modalidad inválida', () => {
    const r = antecedentesPenalesSchema.safeParse({
      ...BASE_SOLICITANTE,
      nombre: 'Pedro', apellido1: 'López', fechaNacimiento: '15/03/1985',
      tipoDocumento: 'DNI', numeroDocumento: '12345678A',
      finalidad: 'Otros', modalidad: 'SuperUrgente',
    })
    expect(r.success).toBe(false)
  })

  it('rechaza tipoDocumento inválido', () => {
    const r = antecedentesPenalesSchema.safeParse({
      ...BASE_SOLICITANTE,
      nombre: 'Pedro', apellido1: 'López', fechaNacimiento: '15/03/1985',
      tipoDocumento: 'CIF', numeroDocumento: 'B12345678',
      finalidad: 'Otros', modalidad: 'Ordinario',
    })
    expect(r.success).toBe(false)
  })

  it('rechaza fecha con formato incorrecto', () => {
    const r = antecedentesPenalesSchema.safeParse({
      ...BASE_SOLICITANTE,
      nombre: 'Pedro', apellido1: 'López', fechaNacimiento: '1985-03-15',
      tipoDocumento: 'DNI', numeroDocumento: '12345678A',
      finalidad: 'Otros', modalidad: 'Ordinario',
    })
    expect(r.success).toBe(false)
  })

  it('normaliza número de documento a mayúsculas', () => {
    const r = antecedentesPenalesSchema.safeParse({
      ...BASE_SOLICITANTE,
      nombre: 'Pedro', apellido1: 'López', fechaNacimiento: '15/03/1985',
      tipoDocumento: 'DNI', numeroDocumento: '12345678a',
      finalidad: 'Otros', modalidad: 'Ordinario',
    })
    expect(r.success).toBe(true)
    if (r.success) expect(r.data.numeroDocumento).toBe('12345678A')
  })
})

describe('esAutomatizable', () => {
  it('devuelve true para NACIMIENTO', () => {
    expect(esAutomatizable('NACIMIENTO')).toBe(true)
  })
  it('devuelve true para MATRIMONIO', () => {
    expect(esAutomatizable('MATRIMONIO')).toBe(true)
  })
  it('devuelve true para DEFUNCION', () => {
    expect(esAutomatizable('DEFUNCION')).toBe(true)
  })
  it('devuelve true para ULTIMAS_VOLUNTADES', () => {
    expect(esAutomatizable('ULTIMAS_VOLUNTADES')).toBe(true)
  })
  it('devuelve true para SEGUROS_FALLECIMIENTO', () => {
    expect(esAutomatizable('SEGUROS_FALLECIMIENTO')).toBe(true)
  })
  it('devuelve false para EMPADRONAMIENTO', () => {
    expect(esAutomatizable('EMPADRONAMIENTO')).toBe(false)
  })
  it('devuelve true para ANTECEDENTES_PENALES', () => {
    expect(esAutomatizable('ANTECEDENTES_PENALES')).toBe(true)
  })
  it('devuelve true para VIDA_LABORAL', () => {
    expect(esAutomatizable('VIDA_LABORAL')).toBe(true)
  })
  it('devuelve false para string vacío', () => {
    expect(esAutomatizable('')).toBe(false)
  })
  it('devuelve false para tipo inventado', () => {
    expect(esAutomatizable('TIPO_INEXISTENTE')).toBe(false)
  })
})

describe('JobLogger', () => {
  it('acumula líneas de log', () => {
    const logger = new JobLogger()
    logger.log('paso 1')
    logger.log('paso 2')
    const dump = logger.dump()
    expect(dump).toContain('paso 1')
    expect(dump).toContain('paso 2')
  })

  it('marca errores con [ERROR]', () => {
    const logger = new JobLogger()
    logger.error('algo salió mal')
    expect(logger.dump()).toContain('ERROR:')
    expect(logger.dump()).toContain('algo salió mal')
  })

  it('dump devuelve string vacío si no hay logs', () => {
    const logger = new JobLogger()
    expect(logger.dump()).toBe('')
  })

  it('los logs tienen timestamp', () => {
    const logger = new JobLogger()
    logger.log('evento')
    const dump = logger.dump()
    // Formato ISO o HH:MM
    expect(dump).toMatch(/\d{2}:\d{2}/)
  })

  it('llama a flushFn cada N entradas', async () => {
    const flushFn = vi.fn().mockResolvedValue(undefined)
    const logger = new JobLogger(flushFn, 3)
    logger.log('a')
    logger.log('b')
    expect(flushFn).not.toHaveBeenCalled()
    logger.log('c')
    // Dar un tick para que la promesa se resuelva
    await new Promise((r) => setTimeout(r, 0))
    expect(flushFn).toHaveBeenCalledTimes(1)
    expect(flushFn.mock.calls[0][0]).toContain('a')
  })

  it('llama a flushFn también con error()', async () => {
    const flushFn = vi.fn().mockResolvedValue(undefined)
    const logger = new JobLogger(flushFn, 2)
    logger.log('x')
    logger.error('fallo')
    await new Promise((r) => setTimeout(r, 0))
    expect(flushFn).toHaveBeenCalledTimes(1)
    expect(flushFn.mock.calls[0][0]).toContain('ERROR:')
  })

  it('no llama a flushFn si no se pasa', () => {
    const logger = new JobLogger()
    for (let i = 0; i < 10; i++) logger.log(`línea ${i}`)
    expect(logger.dump().split('\n').length).toBe(10)
  })
})
