import { EstadoSolicitud } from '@prisma/client'

interface EntradaHistorial {
  id: string
  estado: EstadoSolicitud
  nota: string | null
  createdAt: Date
}

const ESTADO_CONFIG: Record<EstadoSolicitud, { label: string; color: string; bg: string }> = {
  PENDIENTE:  { label: 'Pendiente',             color: 'text-yellow-700', bg: 'bg-yellow-100' },
  EN_PROCESO: { label: 'En proceso',            color: 'text-blue-700',   bg: 'bg-blue-100' },
  TRAMITADO:  { label: 'Enviado al organismo',  color: 'text-orange-700', bg: 'bg-orange-100' },
  COMPLETADA: { label: 'Completada',            color: 'text-green-700',  bg: 'bg-green-100' },
  RECHAZADA:  { label: 'Rechazada',             color: 'text-red-700',    bg: 'bg-red-100' },
}

interface Props {
  historial: EntradaHistorial[]
}

export function TimelineEstado({ historial }: Props) {
  if (historial.length === 0) {
    return <p className="text-sm text-gray-400">Sin historial registrado.</p>
  }

  return (
    <ol className="relative border-l border-gray-200 space-y-6 ml-3">
      {historial.map((entrada, i) => {
        const cfg = ESTADO_CONFIG[entrada.estado]
        return (
          <li key={entrada.id} className="ml-6">
            <span className={`absolute -left-3 flex h-6 w-6 items-center justify-center rounded-full ring-4 ring-white ${cfg.bg}`}>
              {i === 0 ? (
                <svg className={`w-3 h-3 ${cfg.color}`} fill="currentColor" viewBox="0 0 20 20">
                  <circle cx="10" cy="10" r="5" />
                </svg>
              ) : (
                <span className={`w-2 h-2 rounded-full ${cfg.bg.replace('100', '400')}`} />
              )}
            </span>
            <div>
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${cfg.bg} ${cfg.color}`}>
                {cfg.label}
              </span>
              <time className="ml-2 text-xs text-gray-400">
                {new Date(entrada.createdAt).toLocaleString('es-ES', { dateStyle: 'medium', timeStyle: 'short' })}
              </time>
              {entrada.nota && (
                <p className="mt-1 text-sm text-gray-500 italic">"{entrada.nota}"</p>
              )}
            </div>
          </li>
        )
      })}
    </ol>
  )
}
