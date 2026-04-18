'use client'

import { useEffect, useState } from 'react'
import { TimelineEstado } from './TimelineEstado'
import { EstadoBadge } from './EstadoBadge'
import { EstadoSolicitud } from '@prisma/client'

interface Historial {
  id?: string
  estado: EstadoSolicitud
  nota: string | null
  createdAt: Date | string
}

interface Documento {
  id: string
  nombre: string
  url: string
}

interface Data {
  estado: EstadoSolicitud
  pagado: boolean
  historial: Historial[]
  documentos: Documento[]
}

const ESTADOS_FINALES = new Set(['COMPLETADA', 'RECHAZADA'])
const POLL_INTERVAL = 15_000

const MENSAJES_ESTADO: Record<string, string> = {
  PENDIENTE:  'Tu solicitud está pendiente de pago.',
  EN_PROCESO: 'Hemos recibido tu pago y estamos tramitando tu certificado con el organismo correspondiente.',
  TRAMITADO:  'Hemos enviado tu solicitud al organismo oficial. El plazo habitual es de 5 a 15 días hábiles.',
  COMPLETADA: 'Tu certificado está listo. Puedes descargarlo abajo.',
  RECHAZADA:  'Tu solicitud no ha podido completarse. Contacta con nosotros en soporte@certidocs.es.',
}

const BANNER_COLOR: Record<string, string> = {
  COMPLETADA: 'bg-green-50 text-green-800 border-green-200',
  RECHAZADA:  'bg-red-50 text-red-800 border-red-200',
  EN_PROCESO: 'bg-blue-50 text-blue-800 border-blue-200',
  TRAMITADO:  'bg-orange-50 text-orange-800 border-orange-200',
  PENDIENTE:  'bg-gray-50 text-gray-700 border-gray-200',
}

interface Props {
  ref_: string
  initialData: Data
}

export function SeguimientoPoller({ ref_, initialData }: Props) {
  const [data, setData] = useState<Data>(initialData)
  const [ultimaActualizacion, setUltimaActualizacion] = useState<Date>(new Date())

  useEffect(() => {
    if (ESTADOS_FINALES.has(data.estado)) return

    const id = setInterval(async () => {
      try {
        const res = await fetch(`/api/seguimiento/${ref_}`, { cache: 'no-store' })
        if (!res.ok) return
        const next: Data = await res.json()
        setData(next)
        setUltimaActualizacion(new Date())
        if (ESTADOS_FINALES.has(next.estado)) clearInterval(id)
      } catch {
        // network error — keep polling
      }
    }, POLL_INTERVAL)

    return () => clearInterval(id)
  }, [ref_, data.estado])

  const esFinal = ESTADOS_FINALES.has(data.estado)

  return (
    <div className="space-y-5">
      {/* Estado banner */}
      <div className={`rounded-xl px-5 py-4 text-sm font-medium border ${BANNER_COLOR[data.estado] ?? BANNER_COLOR.PENDIENTE}`}>
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <span>{MENSAJES_ESTADO[data.estado] ?? ''}</span>
          {!esFinal && (
            <span className="text-xs opacity-60 flex-shrink-0">
              Actualiza cada {POLL_INTERVAL / 1000}s · {ultimaActualizacion.toLocaleTimeString('es-ES', { timeStyle: 'short' })}
            </span>
          )}
        </div>
      </div>

      {/* Estado badge inline (for dynamic update) */}
      <div className="flex justify-end">
        <EstadoBadge estado={data.estado} />
      </div>

      {/* Documentos */}
      {data.documentos.length > 0 && (
        <div className="card p-6">
          <h2 className="font-semibold mb-4">Documentos disponibles</h2>
          <ul className="space-y-2">
            {data.documentos.map(doc => (
              <li key={doc.id}>
                <a
                  href={doc.url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-3 text-brand-600 hover:text-brand-800 text-sm font-medium bg-brand-50 hover:bg-brand-100 transition-colors rounded-lg px-4 py-3"
                >
                  <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  {doc.nombre}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Historial */}
      <div className="card p-6">
        <h2 className="font-semibold mb-5">Historial de estado</h2>
        <TimelineEstado historial={data.historial} />
      </div>
    </div>
  )
}
