'use client'

import { useState } from 'react'
import Link from 'next/link'

const ESTADO_STYLE: Record<string, string> = {
  PENDIENTE:       'bg-gray-100 text-gray-600',
  EN_CURSO:        'bg-blue-100 text-blue-700',
  COMPLETADO:      'bg-green-100 text-green-700',
  FALLIDO:         'bg-red-100 text-red-700',
  REQUIERE_MANUAL: 'bg-orange-100 text-orange-700',
}

interface Props {
  solicitudId: string
  jobExistente: { id: string; estado: string } | null
}

export function AutomatizarBtn({ solicitudId, jobExistente }: Props) {
  const [loading, setLoading] = useState(false)
  const [job, setJob] = useState(jobExistente)
  const [error, setError] = useState<string | null>(null)

  if (job) {
    return (
      <div className="flex flex-col gap-1">
        <div className={`text-xs font-medium px-2 py-1 rounded text-center ${ESTADO_STYLE[job.estado] ?? 'bg-gray-100 text-gray-600'}`}>
          Bot: {job.estado.replace(/_/g, ' ').toLowerCase()}
        </div>
        <Link href={`/admin/automatizacion/${job.id}`} className="text-xs text-brand-600 hover:underline text-center">
          Ver job →
        </Link>
      </div>
    )
  }

  async function automatizar() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/automatizacion/crear', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ solicitudId }),
      })
      const data = await res.json()
      if (res.ok) {
        setJob({ id: data.jobId, estado: 'PENDIENTE' })
      } else {
        setError(data.error ?? 'Error')
      }
    } catch {
      setError('Error de red')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-1">
      <button
        onClick={automatizar}
        disabled={loading}
        className="btn-primary text-sm text-center disabled:opacity-50"
      >
        {loading ? 'Creando job…' : '🤖 Automatizar'}
      </button>
      {error && <p className="text-xs text-red-600 text-center">{error}</p>}
    </div>
  )
}
