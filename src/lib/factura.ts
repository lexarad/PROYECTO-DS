import { prisma } from '@/lib/prisma'
import { TipoCertificado } from '@prisma/client'

const EMPRESA = {
  nombre: process.env.EMPRESA_NOMBRE ?? 'CertiDocs SL',
  nif: process.env.EMPRESA_NIF ?? 'B12345678',
  direccion: process.env.EMPRESA_DIRECCION ?? 'Via Laietana 59, 4.º 1.ª, 08003 Barcelona',
  email: process.env.EMPRESA_EMAIL ?? 'soporte@certidocs.es',
}

const TIPO_LABEL: Record<TipoCertificado, string> = {
  NACIMIENTO: 'Nacimiento',
  MATRIMONIO: 'Matrimonio',
  DEFUNCION: 'Defunción',
  EMPADRONAMIENTO: 'Empadronamiento',
  ANTECEDENTES_PENALES: 'Antecedentes Penales',
  VIDA_LABORAL: 'Vida Laboral',
  ULTIMAS_VOLUNTADES: 'Últimas Voluntades',
  SEGUROS_FALLECIMIENTO: 'Seguros de Fallecimiento',
  OCR_EXTRACCION: 'Extracción OCR',
  TITULARIDAD_INMUEBLE: 'Titularidad de Inmueble',
}

export { EMPRESA }

async function generarNumeroFactura(): Promise<string> {
  const year = new Date().getFullYear()
  const count = await prisma.factura.count({
    where: { numero: { startsWith: `FAC-${year}-` } },
  })
  return `FAC-${year}-${String(count + 1).padStart(4, '0')}`
}

export async function crearFactura(solicitudId: string): Promise<{ id: string; numero: string }> {
  const solicitud = await prisma.solicitud.findUniqueOrThrow({
    where: { id: solicitudId },
    include: { user: true },
  })

  const total = solicitud.precio
  const baseImponible = parseFloat((total / 1.21).toFixed(2))
  const cuotaIVA = parseFloat((total - baseImponible).toFixed(2))

  const emailCliente = solicitud.user?.email ?? solicitud.emailInvitado ?? ''
  const nombreCliente = solicitud.user?.name ?? solicitud.emailInvitado ?? 'Cliente'
  const concepto = `Tramitación Certificado de ${TIPO_LABEL[solicitud.tipo]} – Ref: ${solicitud.referencia}`
  const numero = await generarNumeroFactura()

  const factura = await prisma.factura.create({
    data: {
      numero,
      solicitudId,
      userId: solicitud.userId ?? null,
      clienteEmail: emailCliente,
      clienteNombre: nombreCliente,
      baseImponible,
      cuotaIVA,
      total,
      concepto,
    },
  })

  return { id: factura.id, numero: factura.numero }
}

export type FacturaConDatos = {
  id: string
  numero: string
  clienteEmail: string
  clienteNombre: string
  clienteNif: string | null
  baseImponible: number
  tipoIVA: number
  cuotaIVA: number
  total: number
  concepto: string
  fechaEmision: Date
}

export { TIPO_LABEL }
