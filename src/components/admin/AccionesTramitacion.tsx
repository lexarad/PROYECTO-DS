'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { EstadoSolicitud } from '@prisma/client'

interface Props {
  solicitudId: string
  estadoActual: EstadoSolicitud
}

export function AccionesTramitacion({ solicitudId, estadoActual }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [estadoLocal, setEstadoLocal] = useState<EstadoSolicitud>(estadoActual)

  async function cambiarEstado(estado: EstadoSolicitud, nota: string) {
    if (loading) return
    setLoading(true)
    await fetch(`/api/admin/solicitudes/${solicitudId}/estado`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ estado, nota }),
    })
    setLoading(false)
    setEstadoLocal(estado)
    setTimeout(() => router.refresh(), 600)
  }

  if (estadoLocal === 'EN_PROCESO') {
    return (
      <button
        onClick={() => cambiarEstado('TRAMITADO', 'Formulario enviado al organismo. Esperando respuesta.')}
        disabled={loading}
        className="w-full text-sm text-center px-3 py-2 rounded-lg font-medium bg-orange-500 hover:bg-orange-600 text-white transition-colors disabled:opacity-60"
      >
        {loading ? 'Guardando...' : 'He enviado el formulario →'}
      </button>
    )
  }

  if (estadoLocal === 'TRAMITADO') {
    return (
      <button
        onClick={() => cambiarEstado('COMPLETADA', 'Certificado recibido y entregado al cliente.')}
        disabled={loading}
        className="w-full text-sm text-center px-3 py-2 rounded-lg font-medium bg-green-600 hover:bg-green-700 text-white transition-colors disabled:opacity-60"
      >
        {loading ? 'Guardando...' : 'Certificado recibido ✓'}
      </button>
    )
  }

  if (estadoLocal === 'COMPLETADA') {
    return (
      <p className="text-xs text-green-700 font-medium bg-green-50 px-3 py-2 rounded-lg text-center">
        Completada correctamente
      </p>
    )
  }

  return null
}
