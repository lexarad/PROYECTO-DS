import { z } from 'zod'

// Fecha: acepta DD/MM/YYYY (MJ) y YYYY-MM-DD (HTML date input), normaliza a DD/MM/YYYY
const fecha = z
  .string()
  .transform(s => {
    // Convertir YYYY-MM-DD → DD/MM/YYYY
    const iso = s.match(/^(\d{4})-(\d{2})-(\d{2})$/)
    if (iso) return `${iso[3]}/${iso[2]}/${iso[1]}`
    return s
  })
  .pipe(z.string().regex(/^\d{2}\/\d{2}\/\d{4}$/, 'La fecha debe tener formato DD/MM/YYYY'))

const dni = z
  .string()
  .regex(/^[0-9XYZ][0-9]{6,7}[A-Z]$/i, 'DNI/NIE inválido')
  .transform(s => s.toUpperCase())

const cp = z
  .string()
  .regex(/^\d{5}$/, 'El código postal debe tener 5 dígitos')

const nombre = z.string().min(1).max(100).transform(s => s.trim())
const lugar  = z.string().min(1).max(200).transform(s => s.trim())

// Bloque solicitante común a todos los certificados
const solicitanteSchema = z.object({
  solNombre:    nombre,
  solApellido1: nombre,
  solApellido2: nombre.optional(),
  solDni:       dni,
  solTelefono:  z.string().regex(/^[6-9]\d{8}$/, 'Teléfono español inválido'),
  solDireccion: z.string().min(3).max(200).transform(s => s.trim()),
  solCp:        cp,
  solMunicipio: lugar,
  solProvincia: nombre,
})

export const nacimientoSchema = solicitanteSchema.extend({
  nombre:              nombre,
  apellido1:           nombre,
  apellido2:           nombre.optional(),
  fechaNacimiento:     fecha,
  lugarNacimiento:     lugar,
  provinciaNacimiento: nombre,
  nombrePadre:         nombre.optional(),
  nombreMadre:         nombre.optional(),
  tipoCertificado:     z.string().min(1),
  finalidad:           z.string().min(1),
})

export const matrimonioSchema = solicitanteSchema.extend({
  c1Nombre:            nombre,
  c1Apellido1:         nombre,
  c1Apellido2:         nombre.optional(),
  c2Nombre:            nombre,
  c2Apellido1:         nombre,
  c2Apellido2:         nombre.optional(),
  fechaMatrimonio:     fecha,
  lugarMatrimonio:     lugar,
  provinciaMatrimonio: nombre,
  tipoCertificado:     z.string().min(1),
  finalidad:           z.string().min(1),
})

export const defuncionSchema = solicitanteSchema.extend({
  nombre:              nombre,
  apellido1:           nombre,
  apellido2:           nombre.optional(),
  fechaDefuncion:      fecha,
  lugarDefuncion:      lugar,
  provinciaDefuncion:  nombre,
  nombrePadre:         nombre.optional(),
  nombreMadre:         nombre.optional(),
  tipoCertificado:     z.string().min(1),
  finalidad:           z.string().min(1),
})

export const fallecidoSchema = solicitanteSchema.extend({
  nombre:            nombre,
  apellido1:         nombre,
  apellido2:         nombre.optional(),
  fechaDefuncion:    fecha,
  lugarDefuncion:    lugar,
  provinciaDefuncion: nombre,
  finalidad:         z.string().min(1),
})

export type DatosNacimientoValidados  = z.infer<typeof nacimientoSchema>
export type DatosMatrimonioValidados  = z.infer<typeof matrimonioSchema>
export type DatosDefuncionValidados   = z.infer<typeof defuncionSchema>
export type DatosFallecidoValidados   = z.infer<typeof fallecidoSchema>

// Map tipo → schema
import { TipoCertificado } from '@prisma/client'

export const antecedentesPenalesSchema = solicitanteSchema.extend({
  nombre:          nombre,
  apellido1:       nombre,
  apellido2:       nombre.optional(),
  fechaNacimiento: fecha,
  tipoDocumento:   z.enum(['DNI', 'NIE', 'Pasaporte']),
  numeroDocumento: z.string().min(5).max(20).transform(s => s.toUpperCase()),
  finalidad:       z.string().min(1),
  modalidad:       z.enum(['Ordinario', 'Urgente']),
})

export const vidaLaboralSchema = solicitanteSchema.extend({
  tipoInforme:   z.enum(['completo', 'fecha']).optional(),
  fechaConsulta: fecha.optional(),
  metodoEnvio:   z.enum(['email', 'postal', 'descarga']).optional(),
  emailEnvio:    z.string().email().optional(),
  solEmail:      z.string().email().optional().or(z.literal('')),
})

export function validarDatos(tipo: TipoCertificado, datos: unknown) {
  switch (tipo) {
    case 'NACIMIENTO':        return nacimientoSchema.safeParse(datos)
    case 'MATRIMONIO':        return matrimonioSchema.safeParse(datos)
    case 'DEFUNCION':         return defuncionSchema.safeParse(datos)
    case 'ULTIMAS_VOLUNTADES':
    case 'SEGUROS_FALLECIMIENTO': return fallecidoSchema.safeParse(datos)
    case 'ANTECEDENTES_PENALES':  return antecedentesPenalesSchema.safeParse(datos)
    case 'VIDA_LABORAL':          return vidaLaboralSchema.safeParse(datos)
    default: return { success: false as const, error: { message: `Tipo ${tipo} no tiene schema de validación` } }
  }
}
