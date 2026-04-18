'use client'

import { useEffect, useRef, useState } from 'react'

interface JobSnapshot {
  estado: string
  logs: string | null
  error: string | null
  refOrganismo: string | null
  screenshotUrls: string[]
  intentos: number
  completadoAt: string | null
}

interface Props {
  jobId: string
  estadoInicial: string
  logsIniciales: string | null
  errorInicial: string | null
  refOrganismoInicial: string | null
  screenshotsIniciales: string[]
}

const ESTADOS_TERMINALES = new Set(['COMPLETADO', 'FALLIDO', 'REQUIERE_MANUAL'])
const POLL_MS = 3_000

const ESTADO_STYLE: Record<string, string> = {
  PENDIENTE:       'bg-gray-100 text-gray-700',
  EN_CURSO:        'bg-blue-100 text-blue-700 animate-pulse',
  COMPLETADO:      'bg-green-100 text-green-700',
  FALLIDO:         'bg-red-100 text-red-700',
  REQUIERE_MANUAL: 'bg-orange-100 text-orange-800',
}

const ESTADO_LABEL: Record<string, string> = {
  PENDIENTE:       'Pendiente',
  EN_CURSO:        'En curso',
  COMPLETADO:      'Completado',
  FALLIDO:         'Fallido',
  REQUIERE_MANUAL: 'Requiere acción manual',
}

export function JobLiveMonitor({
  jobId,
  estadoInicial,
  logsIniciales,
  errorInicial,
  refOrganismoInicial,
  screenshotsIniciales,
}: Props) {
  const [snap, setSnap] = useState<JobSnapshot>({
    estado: estadoInicial,
    logs: logsIniciales,
    error: errorInicial,
    refOrganismo: refOrganismoInicial,
    screenshotUrls: screenshotsIniciales,
    intentos: 0,
    completadoAt: null,
  })
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (ESTADOS_TERMINALES.has(estadoInicial)) return

    const poll = async () => {
      try {
        const res = await fetch(`/api/admin/automatizacion/${jobId}/status`)
        if (!res.ok) return
        const data: JobSnapshot = await res.json()
        setSnap(data)
        if (ESTADOS_TERMINALES.has(data.estado) && intervalRef.current) {
          clearInterval(intervalRef.current)
        }
      } catch {
        // silent — network blip, will retry
      }
    }

    intervalRef.current = setInterval(poll, POLL_MS)
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [jobId, estadoInicial])

  const logs = snap.logs ? snap.logs.split('\n').filter(Boolean) : []
  const isLive = snap.estado === 'EN_CURSO'

  return (
    <div className="space-y-6">
      {/* Estado badge + live indicator */}
      <div className="flex items-center gap-3">
        <span className={`text-sm font-medium px-3 py-1 rounded-full ${ESTADO_STYLE[snap.estado] ?? 'bg-gray-100 text-gray-700'}`}>
          {ESTADO_LABEL[snap.estado] ?? snap.estado}
        </span>
        {isLive && (
          <span className="flex items-center gap-1.5 text-xs text-blue-600 font-medium">
            <span className="inline-block w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
            Actualizando en vivo
          </span>
        )}
        {snap.refOrganismo && snap.refOrganismo !== 'DRY-RUN' && (
          <span className="text-sm font-mono font-bold text-green-700 bg-green-50 px-2 py-0.5 rounded">
            Ref: {snap.refOrganismo}
          </span>
        )}
      </div>

      {/* Error */}
      {snap.error && (
        <div className="card p-4 border-l-4 border-red-400 bg-red-50">
          <p className="text-xs font-semibold text-red-700 mb-1">Error</p>
          <pre className="text-xs text-red-800 whitespace-pre-wrap font-mono">{snap.error}</pre>
        </div>
      )}

      {/* Logs */}
      {logs.length > 0 ? (
        <div className="card overflow-hidden">
          <div className="px-4 py-3 bg-gray-800 border-b border-gray-700 flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-300">Logs de ejecución</span>
            <span className="text-xs text-gray-500">{logs.length} líneas{isLive ? ' · en vivo' : ''}</span>
          </div>
          <div className="bg-gray-900 p-4 overflow-auto max-h-80">
            {logs.map((line, i) => {
              const isError = line.includes('ERROR:')
              return (
                <div key={i} className={`font-mono text-xs leading-5 ${isError ? 'text-red-400' : 'text-gray-300'}`}>
                  {line}
                </div>
              )
            })}
          </div>
        </div>
      ) : isLive ? (
        <div className="card p-6 text-center text-sm text-gray-400 animate-pulse">
          Esperando primeros logs…
        </div>
      ) : null}

      {/* Screenshots */}
      {snap.screenshotUrls.length > 0 && (
        <div className="card p-4 space-y-3">
          <h2 className="font-semibold text-sm text-gray-700">
            Screenshots ({snap.screenshotUrls.length})
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {snap.screenshotUrls.map((url, i) => {
              const paso = url.split('/').pop()?.replace('.png', '') ?? `paso-${i + 1}`
              return (
                <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="block group">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={url}
                    alt={paso}
                    className="w-full rounded border border-gray-200 group-hover:border-brand-400 transition-colors object-cover aspect-video"
                  />
                  <p className="text-xs text-gray-500 mt-1 text-center truncate">{paso}</p>
                </a>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
