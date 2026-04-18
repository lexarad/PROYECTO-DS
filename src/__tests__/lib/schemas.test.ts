import { describe, it, expect } from 'vitest'
import {
  nacimientoSchema,
  matrimonioSchema,
  defuncionSchema,
  fallecidoSchema,
  validarDatos,
} from '@/lib/automatizacion/schemas'

const SOLICITANTE_BASE = {
  solNombre: 'María',
  solApellido1: 'García',
  solDni: '12345678Z',
  solTelefono: '612345678',
  solDireccion: 'Calle Mayor 1',
  solCp: '28001',
  solMunicipio: 'Madrid',
  solProvincia: 'Madrid',
}

describe('nacimientoSchema', () => {
  const VALIDO = {
    ...SOLICITANTE_BASE,
    nombre: 'Juan',
    apellido1: 'López',
    fechaNacimiento: '15/03/1990',
    lugarNacimiento: 'Madrid',
    provinciaNacimiento: 'Madrid',
    tipoCertificado: 'Literal',
    finalidad: 'Uso administrativo',
  }

  it('acepta datos válidos completos', () => {
    expect(nacimientoSchema.safeParse(VALIDO).success).toBe(true)
  })

  it('acepta datos válidos con campos opcionales', () => {
    const con = { ...VALIDO, apellido2: 'Martínez', nombrePadre: 'Carlos', solApellido2: 'Ruiz' }
    expect(nacimientoSchema.safeParse(con).success).toBe(true)
  })

  it('rechaza fecha en formato incorrecto', () => {
    const result = nacimientoSchema.safeParse({ ...VALIDO, fechaNacimiento: '1990-03-15' })
    expect(result.success).toBe(false)
  })

  it('rechaza DNI inválido', () => {
    const result = nacimientoSchema.safeParse({ ...VALIDO, solDni: '1234' })
    expect(result.success).toBe(false)
  })

  it('rechaza teléfono inválido (empieza por 1)', () => {
    const result = nacimientoSchema.safeParse({ ...VALIDO, solTelefono: '112345678' })
    expect(result.success).toBe(false)
  })

  it('rechaza código postal de 4 dígitos', () => {
    const result = nacimientoSchema.safeParse({ ...VALIDO, solCp: '2800' })
    expect(result.success).toBe(false)
  })

  it('transforma DNI a mayúsculas', () => {
    const result = nacimientoSchema.safeParse({ ...VALIDO, solDni: '12345678z' })
    if (result.success) expect(result.data.solDni).toBe('12345678Z')
  })
})

describe('matrimonioSchema', () => {
  const VALIDO = {
    ...SOLICITANTE_BASE,
    c1Nombre: 'Ana',
    c1Apellido1: 'Pérez',
    c2Nombre: 'Luis',
    c2Apellido1: 'Gómez',
    fechaMatrimonio: '20/06/2010',
    lugarMatrimonio: 'Barcelona',
    provinciaMatrimonio: 'Barcelona',
    tipoCertificado: 'Literal',
    finalidad: 'Uso civil',
  }

  it('acepta datos válidos', () => {
    expect(matrimonioSchema.safeParse(VALIDO).success).toBe(true)
  })

  it('rechaza si falta el nombre del cónyuge 1', () => {
    const { c1Nombre: _c1Nombre, ...sin } = VALIDO
    expect(matrimonioSchema.safeParse(sin).success).toBe(false)
  })

  it('rechaza fecha en formato ISO (YYYY-MM-DD)', () => {
    const result = matrimonioSchema.safeParse({ ...VALIDO, fechaMatrimonio: '2010-06-20' })
    expect(result.success).toBe(false)
  })
})

describe('defuncionSchema', () => {
  const VALIDO = {
    ...SOLICITANTE_BASE,
    nombre: 'Pedro',
    apellido1: 'Sánchez',
    fechaDefuncion: '01/01/2023',
    lugarDefuncion: 'Sevilla',
    provinciaDefuncion: 'Sevilla',
    tipoCertificado: 'Literal',
    finalidad: 'Sucesiones',
  }

  it('acepta datos válidos', () => {
    expect(defuncionSchema.safeParse(VALIDO).success).toBe(true)
  })

  it('rechaza nombre vacío', () => {
    expect(defuncionSchema.safeParse({ ...VALIDO, nombre: '' }).success).toBe(false)
  })
})

describe('fallecidoSchema (ultimas voluntades / seguros)', () => {
  const VALIDO = {
    ...SOLICITANTE_BASE,
    nombre: 'Rosa',
    apellido1: 'Martínez',
    fechaDefuncion: '15/07/2022',
    lugarDefuncion: 'Valencia',
    provinciaDefuncion: 'Valencia',
    finalidad: 'Herencia',
  }

  it('acepta datos válidos', () => {
    expect(fallecidoSchema.safeParse(VALIDO).success).toBe(true)
  })

  it('rechaza cuando falta la fecha de defunción', () => {
    const { fechaDefuncion: _fechaDefuncion, ...sin } = VALIDO
    expect(fallecidoSchema.safeParse(sin).success).toBe(false)
  })

  it('rechaza NIE con formato incorrecto', () => {
    expect(fallecidoSchema.safeParse({ ...VALIDO, solDni: 'X1234' }).success).toBe(false)
  })

  it('acepta NIE válido (X1234567L)', () => {
    expect(fallecidoSchema.safeParse({ ...VALIDO, solDni: 'X1234567L' }).success).toBe(true)
  })
})

describe('validarDatos (router de schemas)', () => {
  const BASE_NACIMIENTO = {
    ...SOLICITANTE_BASE,
    nombre: 'Carlos', apellido1: 'López',
    fechaNacimiento: '01/01/1985', lugarNacimiento: 'Madrid',
    provinciaNacimiento: 'Madrid', tipoCertificado: 'Extracto', finalidad: 'Pasaporte',
  }

  it('valida NACIMIENTO', () => {
    expect(validarDatos('NACIMIENTO', BASE_NACIMIENTO).success).toBe(true)
  })

  it('retorna error para tipo sin schema', () => {
    const result = validarDatos('EMPADRONAMIENTO' as any, {})
    expect(result.success).toBe(false)
  })

  it('retorna error para ANTECEDENTES_PENALES con datos vacíos', () => {
    const result = validarDatos('ANTECEDENTES_PENALES' as any, {})
    expect(result.success).toBe(false)
  })

  it('valida ANTECEDENTES_PENALES con datos correctos', () => {
    const result = validarDatos('ANTECEDENTES_PENALES' as any, {
      ...SOLICITANTE_BASE,
      nombre: 'Pedro', apellido1: 'López',
      fechaNacimiento: '15/03/1985',
      tipoDocumento: 'DNI', numeroDocumento: '12345678A',
      finalidad: 'Trámites ante la Administración', modalidad: 'Ordinario',
    })
    expect(result.success).toBe(true)
  })

  it('valida ULTIMAS_VOLUNTADES', () => {
    const result = validarDatos('ULTIMAS_VOLUNTADES' as any, {
      ...SOLICITANTE_BASE,
      nombre: 'Rosa', apellido1: 'Martínez',
      fechaDefuncion: '01/01/2020', lugarDefuncion: 'Madrid',
      provinciaDefuncion: 'Madrid', finalidad: 'Herencia',
    })
    expect(result.success).toBe(true)
  })

  it('retorna error para tipo desconocido', () => {
    const result = validarDatos('TIPO_INEXISTENTE' as any, {})
    expect(result.success).toBe(false)
  })
})
