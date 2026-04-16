import { EstadoSolicitud } from '@prisma/client'

const ESTADOS: Record<EstadoSolicitud, { label: string; className: string }> = {
  PENDIENTE:   { label: 'Pendiente',   className: 'bg-yellow-100 text-yellow-700' },
  EN_PROCESO:  { label: 'En proceso',  className: 'bg-blue-100 text-blue-700' },
  COMPLETADA:  { label: 'Completada',  className: 'bg-green-100 text-green-700' },
  RECHAZADA:   { label: 'Rechazada',   className: 'bg-red-100 text-red-700' },
}

export function EstadoBadge({ estado }: { estado: EstadoSolicitud }) {
  const { label, className } = ESTADOS[estado]
  return (
    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${className}`}>
      {label}
    </span>
  )
}
