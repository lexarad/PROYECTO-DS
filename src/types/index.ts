import { TipoCertificado, EstadoSolicitud } from '@prisma/client'

export type { TipoCertificado, EstadoSolicitud }

export interface CertificadoConfig {
  tipo: TipoCertificado
  label: string
  descripcion: string
  precio: number
  campos: CampoFormulario[]
}

export interface CampoFormulario {
  nombre: string
  label: string
  tipo: 'text' | 'email' | 'date' | 'select' | 'textarea'
  requerido: boolean
  opciones?: string[]
  placeholder?: string
}

// Extend next-auth types
declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      email: string
      name?: string | null
      image?: string | null
      role: string
    }
  }
}
