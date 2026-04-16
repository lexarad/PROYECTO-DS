'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { EstadoSolicitud } from '@prisma/client'

const ESTADOS: { value: EstadoSolicitud; label: string }[] = [
  { value: 'PENDIENTE', label: 'Pendiente' },
  { value: 'EN_PROCESO', label: 'En proceso' },
  { value: 'COMPLETADA', label: 'Completada' },
  { value: 'RECHAZADA', label: 'Rechazada' },
]

interface Props {
  solicitudId: string
  estadoActual: EstadoSolicitud
}

export function SelectorEstado({ solicitudId, estadoActual }: Props) {
  const router = useRouter()
  const [estado, setEstado] = useState<EstadoSolicitud>(estadoActual)
  const [loading, setLoading] = useState(false)
  const [ok, setOk] = useState(false)

  async function guardar() {
    if (estado === estadoActual) return
    setLoading(true)
    setOk(false)

    await fetch(`/api/admin/solicitudes/${solicitudId}/estado`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ estado }),
    })

    setLoading(false)
    setOk(true)
    router.refresh()
  }

  return (
    <div className="space-y-3">
      <select
        value={estado}
        onChange={(e) => { setEstado(e.target.value as EstadoSolicitud); setOk(false) }}
        className="input text-sm"
      >
        {ESTADOS.map((e) => (
          <option key={e.value} value={e.value}>{e.label}</option>
        ))}
      </select>

      <button
        onClick={guardar}
        disabled={loading || estado === estadoActual}
        className="btn-primary w-full text-sm py-2"
      >
        {loading ? 'Guardando...' : 'Guardar estado'}
      </button>

      {ok && <p className="text-xs text-green-600 text-center">Estado actualizado</p>}
    </div>
  )
}
