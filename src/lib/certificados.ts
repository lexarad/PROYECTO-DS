import { CampoFormulario, CertificadoConfig } from '@/types'
import { TipoCertificado } from '@prisma/client'

// Campos del solicitante comunes a todos los certificados del MJ
const CAMPOS_SOLICITANTE: CampoFormulario[] = [
  { seccion: 'Tus datos (solicitante)', nombre: 'solNombre', label: 'Nombre', tipo: 'text', requerido: true, placeholder: 'Tu nombre' },
  { seccion: 'Tus datos (solicitante)', nombre: 'solApellido1', label: 'Primer apellido', tipo: 'text', requerido: true },
  { seccion: 'Tus datos (solicitante)', nombre: 'solApellido2', label: 'Segundo apellido', tipo: 'text', requerido: false },
  { seccion: 'Tus datos (solicitante)', nombre: 'solDni', label: 'DNI / NIE / Pasaporte', tipo: 'text', requerido: true, placeholder: '12345678A' },
  { seccion: 'Tus datos (solicitante)', nombre: 'solTelefono', label: 'Teléfono de contacto', tipo: 'tel', requerido: true, placeholder: '600 000 000' },
  { seccion: 'Tus datos (solicitante)', nombre: 'solDireccion', label: 'Dirección (envío postal)', tipo: 'text', requerido: true, placeholder: 'Calle, número, piso' },
  { seccion: 'Tus datos (solicitante)', nombre: 'solCp', label: 'Código postal', tipo: 'text', requerido: true, placeholder: '28001' },
  { seccion: 'Tus datos (solicitante)', nombre: 'solMunicipio', label: 'Municipio', tipo: 'text', requerido: true },
  { seccion: 'Tus datos (solicitante)', nombre: 'solProvincia', label: 'Provincia', tipo: 'text', requerido: true },
]

const TIPOS_CERTIFICADO_RC: CampoFormulario = {
  seccion: 'Opciones del certificado',
  nombre: 'tipoCertificado',
  label: 'Tipo de certificado',
  tipo: 'select',
  requerido: true,
  opciones: ['Literal', 'Extracto', 'Plurilingüe (Extracto)'],
}

const FINALIDAD_RC: CampoFormulario = {
  seccion: 'Opciones del certificado',
  nombre: 'finalidad',
  label: 'Finalidad',
  tipo: 'select',
  requerido: true,
  opciones: [
    'Trámites ante la Administración',
    'Matrimonio',
    'Herencia / sucesión',
    'Solicitud de pensión',
    'Expedición de pasaporte / DNI',
    'Trámites bancarios o notariales',
    'Uso en el extranjero',
    'Otros',
  ],
}

export const CERTIFICADOS: CertificadoConfig[] = [
  {
    tipo: 'NACIMIENTO',
    label: 'Certificado de Nacimiento',
    descripcion: 'Certificado literal, extracto o plurilingüe del Registro Civil.',
    precio: 9.9,
    campos: [
      // Datos del inscrito
      { seccion: 'Datos del inscrito', nombre: 'nombre', label: 'Nombre', tipo: 'text', requerido: true, placeholder: 'Nombre de pila' },
      { seccion: 'Datos del inscrito', nombre: 'apellido1', label: 'Primer apellido', tipo: 'text', requerido: true },
      { seccion: 'Datos del inscrito', nombre: 'apellido2', label: 'Segundo apellido', tipo: 'text', requerido: false },
      { seccion: 'Datos del inscrito', nombre: 'fechaNacimiento', label: 'Fecha de nacimiento', tipo: 'date', requerido: true },
      { seccion: 'Datos del inscrito', nombre: 'lugarNacimiento', label: 'Municipio de nacimiento', tipo: 'text', requerido: true, placeholder: 'Ej: Sevilla' },
      { seccion: 'Datos del inscrito', nombre: 'provinciaNacimiento', label: 'Provincia de nacimiento', tipo: 'text', requerido: true, placeholder: 'Ej: Sevilla' },
      { seccion: 'Datos del inscrito', nombre: 'nombrePadre', label: 'Nombre del padre', tipo: 'text', requerido: false },
      { seccion: 'Datos del inscrito', nombre: 'nombreMadre', label: 'Nombre de la madre', tipo: 'text', requerido: false },
      // Opciones
      TIPOS_CERTIFICADO_RC,
      FINALIDAD_RC,
      // Solicitante
      ...CAMPOS_SOLICITANTE,
    ],
  },

  {
    tipo: 'MATRIMONIO',
    label: 'Certificado de Matrimonio',
    descripcion: 'Certificado literal, extracto o plurilingüe del Registro Civil.',
    precio: 9.9,
    campos: [
      // Cónyuge 1
      { seccion: 'Datos del cónyuge 1', nombre: 'c1Nombre', label: 'Nombre', tipo: 'text', requerido: true },
      { seccion: 'Datos del cónyuge 1', nombre: 'c1Apellido1', label: 'Primer apellido', tipo: 'text', requerido: true },
      { seccion: 'Datos del cónyuge 1', nombre: 'c1Apellido2', label: 'Segundo apellido', tipo: 'text', requerido: false },
      // Cónyuge 2
      { seccion: 'Datos del cónyuge 2', nombre: 'c2Nombre', label: 'Nombre', tipo: 'text', requerido: true },
      { seccion: 'Datos del cónyuge 2', nombre: 'c2Apellido1', label: 'Primer apellido', tipo: 'text', requerido: true },
      { seccion: 'Datos del cónyuge 2', nombre: 'c2Apellido2', label: 'Segundo apellido', tipo: 'text', requerido: false },
      // Matrimonio
      { seccion: 'Datos del matrimonio', nombre: 'fechaMatrimonio', label: 'Fecha de matrimonio', tipo: 'date', requerido: true },
      { seccion: 'Datos del matrimonio', nombre: 'lugarMatrimonio', label: 'Municipio de celebración', tipo: 'text', requerido: true },
      { seccion: 'Datos del matrimonio', nombre: 'provinciaMatrimonio', label: 'Provincia', tipo: 'text', requerido: true },
      // Opciones
      TIPOS_CERTIFICADO_RC,
      FINALIDAD_RC,
      // Solicitante
      ...CAMPOS_SOLICITANTE,
    ],
  },

  {
    tipo: 'DEFUNCION',
    label: 'Certificado de Defunción',
    descripcion: 'Certificado literal, extracto o plurilingüe del Registro Civil.',
    precio: 9.9,
    campos: [
      // Datos del fallecido
      { seccion: 'Datos del fallecido', nombre: 'nombre', label: 'Nombre', tipo: 'text', requerido: true },
      { seccion: 'Datos del fallecido', nombre: 'apellido1', label: 'Primer apellido', tipo: 'text', requerido: true },
      { seccion: 'Datos del fallecido', nombre: 'apellido2', label: 'Segundo apellido', tipo: 'text', requerido: false },
      { seccion: 'Datos del fallecido', nombre: 'fechaDefuncion', label: 'Fecha de defunción', tipo: 'date', requerido: true },
      { seccion: 'Datos del fallecido', nombre: 'lugarDefuncion', label: 'Municipio de defunción', tipo: 'text', requerido: true },
      { seccion: 'Datos del fallecido', nombre: 'provinciaDefuncion', label: 'Provincia de defunción', tipo: 'text', requerido: true },
      { seccion: 'Datos del fallecido', nombre: 'nombrePadre', label: 'Nombre del padre (si se conoce)', tipo: 'text', requerido: false },
      { seccion: 'Datos del fallecido', nombre: 'nombreMadre', label: 'Nombre de la madre (si se conoce)', tipo: 'text', requerido: false },
      // Opciones
      TIPOS_CERTIFICADO_RC,
      FINALIDAD_RC,
      // Solicitante
      ...CAMPOS_SOLICITANTE,
    ],
  },

  {
    tipo: 'EMPADRONAMIENTO',
    label: 'Certificado de Empadronamiento',
    descripcion: 'Certificado o volante de residencia en el padrón municipal.',
    precio: 14.9,
    campos: [
      { seccion: 'Datos del empadronado', nombre: 'nombre', label: 'Nombre', tipo: 'text', requerido: true },
      { seccion: 'Datos del empadronado', nombre: 'apellido1', label: 'Primer apellido', tipo: 'text', requerido: true },
      { seccion: 'Datos del empadronado', nombre: 'apellido2', label: 'Segundo apellido', tipo: 'text', requerido: false },
      { seccion: 'Datos del empadronado', nombre: 'dni', label: 'DNI / NIE', tipo: 'text', requerido: true, placeholder: '12345678A' },
      { seccion: 'Datos del empadronado', nombre: 'fechaNacimiento', label: 'Fecha de nacimiento', tipo: 'date', requerido: true },
      { seccion: 'Datos del domicilio', nombre: 'municipio', label: 'Municipio de empadronamiento', tipo: 'text', requerido: true },
      { seccion: 'Datos del domicilio', nombre: 'direccion', label: 'Dirección completa', tipo: 'text', requerido: true, placeholder: 'Calle, número, piso, letra' },
      { seccion: 'Datos del domicilio', nombre: 'cp', label: 'Código postal', tipo: 'text', requerido: true },
      {
        seccion: 'Opciones',
        nombre: 'tipoDocumento',
        label: 'Tipo de documento',
        tipo: 'select',
        requerido: true,
        opciones: ['Certificado de empadronamiento', 'Volante de empadronamiento', 'Certificado histórico de empadronamiento'],
      },
      {
        seccion: 'Opciones',
        nombre: 'finalidad',
        label: 'Finalidad',
        tipo: 'select',
        requerido: true,
        opciones: ['Trámites administrativos', 'Trámites bancarios', 'Escolarización', 'Prestaciones sociales', 'Uso en el extranjero', 'Otros'],
      },
      { seccion: 'Tu teléfono de contacto', nombre: 'telefono', label: 'Teléfono', tipo: 'tel', requerido: true, placeholder: '600 000 000' },
    ],
  },

  {
    tipo: 'ANTECEDENTES_PENALES',
    label: 'Certificado de Antecedentes Penales',
    descripcion: 'Certificado negativo o positivo del Ministerio de Justicia.',
    precio: 24.9,
    campos: [
      { seccion: 'Datos personales', nombre: 'nombre', label: 'Nombre', tipo: 'text', requerido: true },
      { seccion: 'Datos personales', nombre: 'apellido1', label: 'Primer apellido', tipo: 'text', requerido: true },
      { seccion: 'Datos personales', nombre: 'apellido2', label: 'Segundo apellido', tipo: 'text', requerido: false },
      { seccion: 'Datos personales', nombre: 'dni', label: 'DNI / NIE / Pasaporte', tipo: 'text', requerido: true, placeholder: '12345678A' },
      { seccion: 'Datos personales', nombre: 'fechaNacimiento', label: 'Fecha de nacimiento', tipo: 'date', requerido: true },
      { seccion: 'Datos personales', nombre: 'lugarNacimiento', label: 'Municipio de nacimiento', tipo: 'text', requerido: true },
      { seccion: 'Datos personales', nombre: 'provinciaNacimiento', label: 'Provincia de nacimiento', tipo: 'text', requerido: true },
      { seccion: 'Datos personales', nombre: 'nacionalidad', label: 'Nacionalidad', tipo: 'text', requerido: true, placeholder: 'Española' },
      { seccion: 'Datos personales', nombre: 'nombrePadre', label: 'Nombre del padre', tipo: 'text', requerido: false },
      { seccion: 'Datos personales', nombre: 'nombreMadre', label: 'Nombre de la madre', tipo: 'text', requerido: false },
      {
        seccion: 'Opciones',
        nombre: 'finalidad',
        label: 'Finalidad',
        tipo: 'select',
        requerido: true,
        opciones: ['Trabajo en España', 'Trabajo en el extranjero', 'Adopción', 'Trámites de extranjería', 'Otros'],
      },
      // Solicitante
      ...CAMPOS_SOLICITANTE,
    ],
  },

  {
    tipo: 'VIDA_LABORAL',
    label: 'Informe de Vida Laboral',
    descripcion: 'Informe completo de tu historial en la Seguridad Social.',
    precio: 14.9,
    campos: [
      { seccion: 'Datos personales', nombre: 'nombre', label: 'Nombre', tipo: 'text', requerido: true },
      { seccion: 'Datos personales', nombre: 'apellido1', label: 'Primer apellido', tipo: 'text', requerido: true },
      { seccion: 'Datos personales', nombre: 'apellido2', label: 'Segundo apellido', tipo: 'text', requerido: false },
      { seccion: 'Datos personales', nombre: 'dni', label: 'DNI / NIE', tipo: 'text', requerido: true, placeholder: '12345678A' },
      { seccion: 'Datos personales', nombre: 'fechaNacimiento', label: 'Fecha de nacimiento', tipo: 'date', requerido: true },
      { seccion: 'Datos personales', nombre: 'telefono', label: 'Teléfono', tipo: 'tel', requerido: true, placeholder: '600 000 000' },
      { seccion: 'Datos Seguridad Social', nombre: 'naf', label: 'Nº de Afiliación SS (NAF)', tipo: 'text', requerido: false, placeholder: 'Opcional — si lo conoces' },
      { seccion: 'Datos Seguridad Social', nombre: 'iban', label: 'IBAN (si necesitas acreditación de cotizaciones)', tipo: 'text', requerido: false, placeholder: 'ES00 0000 0000 00 0000000000' },
      {
        seccion: 'Opciones',
        nombre: 'finalidad',
        label: 'Finalidad del informe',
        tipo: 'select',
        requerido: true,
        opciones: ['Jubilación / pensión', 'Solicitud de préstamo', 'Trámites laborales', 'Subsidio o prestación', 'Uso personal', 'Otros'],
      },
    ],
  },
]

// Certificados extra: Últimas Voluntades + Seguros de Fallecimiento
const CAMPOS_FALLECIDO_UV: CampoFormulario[] = [
  { seccion: 'Datos del fallecido', nombre: 'nombre', label: 'Nombre', tipo: 'text', requerido: true },
  { seccion: 'Datos del fallecido', nombre: 'apellido1', label: 'Primer apellido', tipo: 'text', requerido: true },
  { seccion: 'Datos del fallecido', nombre: 'apellido2', label: 'Segundo apellido', tipo: 'text', requerido: false },
  { seccion: 'Datos del fallecido', nombre: 'fechaDefuncion', label: 'Fecha de defunción', tipo: 'date', requerido: true },
  { seccion: 'Datos del fallecido', nombre: 'lugarDefuncion', label: 'Municipio de defunción', tipo: 'text', requerido: true },
  { seccion: 'Datos del fallecido', nombre: 'provinciaDefuncion', label: 'Provincia de defunción', tipo: 'text', requerido: true },
]

CERTIFICADOS.push(
  {
    tipo: 'ULTIMAS_VOLUNTADES',
    label: 'Certificado de Últimas Voluntades',
    descripcion: 'Acredita si el fallecido otorgó testamento y ante qué notario.',
    precio: 24.9,
    requiresTasa: true,
    tasaImporte: 3.86,
    tasaDescripcion: 'Tasa Modelo 790 Código 006 (Ministerio de Justicia)',
    campos: [
      ...CAMPOS_FALLECIDO_UV,
      {
        seccion: 'Opciones',
        nombre: 'finalidad',
        label: 'Finalidad',
        tipo: 'select',
        requerido: true,
        opciones: ['Tramitación de herencia', 'Notaría', 'Gestión bancaria', 'Otros'],
      },
      ...CAMPOS_SOLICITANTE,
    ],
  },
  {
    tipo: 'SEGUROS_FALLECIMIENTO',
    label: 'Certificado de Seguros de Fallecimiento',
    descripcion: 'Acredita si el fallecido tenía contratados seguros de vida o accidentes.',
    precio: 24.9,
    requiresTasa: true,
    tasaImporte: 3.86,
    tasaDescripcion: 'Tasa Modelo 790 Código 006 (Ministerio de Justicia)',
    campos: [
      ...CAMPOS_FALLECIDO_UV,
      {
        seccion: 'Opciones',
        nombre: 'finalidad',
        label: 'Finalidad',
        tipo: 'select',
        requerido: true,
        opciones: ['Tramitación de herencia', 'Reclamación a aseguradora', 'Notaría', 'Otros'],
      },
      ...CAMPOS_SOLICITANTE,
    ],
  },
)

CERTIFICADOS.push({
  tipo: 'OCR_EXTRACCION' as TipoCertificado,
  label: 'Extracción de datos por OCR',
  descripcion: 'Extrae automáticamente los datos de un documento escaneado (JPG, PNG o PDF). Servicio de transcripción inteligente.',
  precio: 4.9,
  campos: [],
},
{
  tipo: 'TITULARIDAD_INMUEBLE' as TipoCertificado,
  label: 'Comprobación Titularidad de Inmueble',
  descripcion: 'Notas simples del Registro de la Propiedad. Verifica titularidad, cargas, hipotecas y datos catastrales.',
  precio: 29.9,
  campos: [
    { seccion: 'Datos del inmueble', nombre: 'direccion', label: 'Dirección completa', tipo: 'text', requerido: true, placeholder: 'Calle, número, municipio' },
    { seccion: 'Datos del inmueble', nombre: 'provincia', label: 'Provincia', tipo: 'text', requerido: true },
    { seccion: 'Datos del inmueble', nombre: 'referenciaCatastral', label: 'Referencia Catastral', tipo: 'text', requerido: false, placeholder: 'Opcional pero acelera el trámite' },
    {
      seccion: 'Opciones',
      nombre: 'finalidad',
      label: 'Finalidad de la consulta',
      tipo: 'select',
      requerido: true,
      opciones: ['Compraventa', 'Hipoteca', 'Alquiler', 'Conocimiento titular', 'Gestión hereditaria', 'Otros'],
    },
    ...CAMPOS_SOLICITANTE,
  ],
})

export function getCertificado(tipo: string): CertificadoConfig | undefined {
  return CERTIFICADOS.find((c) => c.tipo === tipo)
}

export function getCertificados(): CertificadoConfig[] {
  return CERTIFICADOS
}

export const TASA_GOBIERNO = 3.86
