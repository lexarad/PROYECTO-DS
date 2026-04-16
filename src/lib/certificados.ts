import { CertificadoConfig } from '@/types'

export const CERTIFICADOS: CertificadoConfig[] = [
  {
    tipo: 'NACIMIENTO',
    label: 'Certificado de Nacimiento',
    descripcion: 'Certificado literal o extracto del Registro Civil.',
    precio: 19.9,
    campos: [
      { nombre: 'nombre', label: 'Nombre completo', tipo: 'text', requerido: true, placeholder: 'Nombre y apellidos' },
      { nombre: 'fechaNacimiento', label: 'Fecha de nacimiento', tipo: 'date', requerido: true },
      { nombre: 'lugarNacimiento', label: 'Municipio de nacimiento', tipo: 'text', requerido: true, placeholder: 'Ej: Madrid' },
      { nombre: 'nombrePadre', label: 'Nombre del padre', tipo: 'text', requerido: false },
      { nombre: 'nombreMadre', label: 'Nombre de la madre', tipo: 'text', requerido: false },
    ],
  },
  {
    tipo: 'MATRIMONIO',
    label: 'Certificado de Matrimonio',
    descripcion: 'Certificado del Registro Civil de matrimonio.',
    precio: 19.9,
    campos: [
      { nombre: 'nombreConyuge1', label: 'Nombre cónyuge 1', tipo: 'text', requerido: true },
      { nombre: 'nombreConyuge2', label: 'Nombre cónyuge 2', tipo: 'text', requerido: true },
      { nombre: 'fechaMatrimonio', label: 'Fecha de matrimonio', tipo: 'date', requerido: true },
      { nombre: 'lugarMatrimonio', label: 'Municipio de matrimonio', tipo: 'text', requerido: true },
    ],
  },
  {
    tipo: 'DEFUNCION',
    label: 'Certificado de Defunción',
    descripcion: 'Certificado del Registro Civil de fallecimiento.',
    precio: 19.9,
    campos: [
      { nombre: 'nombreFallecido', label: 'Nombre del fallecido', tipo: 'text', requerido: true },
      { nombre: 'fechaDefuncion', label: 'Fecha de defunción', tipo: 'date', requerido: true },
      { nombre: 'lugarDefuncion', label: 'Municipio de defunción', tipo: 'text', requerido: true },
    ],
  },
  {
    tipo: 'EMPADRONAMIENTO',
    label: 'Certificado de Empadronamiento',
    descripcion: 'Certificado de residencia en el padrón municipal.',
    precio: 14.9,
    campos: [
      { nombre: 'nombre', label: 'Nombre completo', tipo: 'text', requerido: true },
      { nombre: 'dni', label: 'DNI / NIE', tipo: 'text', requerido: true, placeholder: '12345678A' },
      { nombre: 'municipio', label: 'Municipio de empadronamiento', tipo: 'text', requerido: true },
      { nombre: 'direccion', label: 'Dirección actual', tipo: 'text', requerido: true },
    ],
  },
  {
    tipo: 'ANTECEDENTES_PENALES',
    label: 'Certificado de Antecedentes Penales',
    descripcion: 'Certificado del Ministerio de Justicia.',
    precio: 24.9,
    campos: [
      { nombre: 'nombre', label: 'Nombre completo', tipo: 'text', requerido: true },
      { nombre: 'dni', label: 'DNI / NIE / Pasaporte', tipo: 'text', requerido: true },
      { nombre: 'fechaNacimiento', label: 'Fecha de nacimiento', tipo: 'date', requerido: true },
      { nombre: 'nacionalidad', label: 'Nacionalidad', tipo: 'text', requerido: true, placeholder: 'Española' },
    ],
  },
  {
    tipo: 'VIDA_LABORAL',
    label: 'Informe de Vida Laboral',
    descripcion: 'Informe completo de tu historial laboral en la Seguridad Social.',
    precio: 14.9,
    campos: [
      { nombre: 'nombre', label: 'Nombre completo', tipo: 'text', requerido: true },
      { nombre: 'dni', label: 'DNI / NIE', tipo: 'text', requerido: true },
      { nombre: 'naf', label: 'Nº Afiliación Seguridad Social (opcional)', tipo: 'text', requerido: false },
    ],
  },
]

export function getCertificado(tipo: string): CertificadoConfig | undefined {
  return CERTIFICADOS.find((c) => c.tipo === tipo)
}
