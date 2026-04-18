'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Props {
  solicitudId: string
  referencia: string
  importe: number
  estado: string
}

export function BotonReembolso({ solicitudId, referencia, importe, estado }: Props) {
  const router = useRouter()
  const [paso, setPaso] = useState<'idle' | 'confirmar' | 'loading' | 'done' | 'error'>('idle')
  const [error, setError] = useState('')

  const yaRechazada = estado === 'RECHAZADA'

  if (yaRechazada) return null

  async function procesar() {
    setPaso('loading')
    setError('')
    try {
      const res = await fetch(`/api/admin/solicitudes/${solicitudId}/reembolso`, { method: 'POST' })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? 'Error al procesar el reembolso')
        setPaso('error')
        return
      }
      setPaso('done')
      setTimeout(() => router.refresh(), 1500)
    } catch {
      setError('Error de red')
      setPaso('error')
    }
  }

  if (paso === 'done') {
    return (
      <p className="text-xs font-medium text-green-700 bg-green-50 px-3 py-2 rounded-lg text-center">
        Reembolso procesado correctamente
      </p>
    )
  }

  if (paso === 'confirmar') {
    return (
      <div className="space-y-2 p-3 bg-red-50 border border-red-200 rounded-lg">
        <p className="text-xs font-semibold text-red-800">
          ¿Reembolsar {importe.toFixed(2)} € de {referencia}?
        </p>
        <p className="text-xs text-red-600">
          Se enviará el reembolso a Stripe y se notificará al cliente. Esta acción no se puede deshacer.
        </p>
        <div className="flex gap-2">
          <button
            onClick={procesar}
            className="text-xs font-semibold bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded-md transition-colors"
          >
            Sí, reembolsar
          </button>
          <button
            onClick={() => setPaso('idle')}
            className="text-xs font-medium text-gray-600 hover:text-gray-800 px-3 py-1.5 rounded-md bg-white border border-gray-200"
          >
            Cancelar
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-1">
      <button
        onClick={() => setPaso('confirmar')}
        disabled={paso === 'loading'}
        className="w-full text-xs font-medium text-red-700 hover:text-red-900 bg-red-50 hover:bg-red-100 px-3 py-2 rounded-lg transition-colors border border-red-200 disabled:opacity-50"
      >
        {paso === 'loading' ? 'Procesando...' : '↩ Reembolsar pago'}
      </button>
      {paso === 'error' && <p className="text-xs text-red-600 text-center">{error}</p>}
    </div>
  )
}
