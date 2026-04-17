'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Props {
  solicitudId: string
}

export function BotonConfirmarPago({ solicitudId }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function confirmar() {
    if (!confirm('¿Confirmar el pago manualmente? Esto marcará la solicitud como pagada y enviará el email de confirmación al cliente.')) return
    setLoading(true)
    setError(null)
    const res = await fetch(`/api/admin/solicitudes/${solicitudId}/confirmar-pago`, { method: 'POST' })
    setLoading(false)
    if (res.ok) {
      setDone(true)
      setTimeout(() => router.refresh(), 800)
    } else {
      const data = await res.json()
      setError(data.error ?? 'Error al confirmar el pago')
    }
  }

  if (done) {
    return <p className="text-xs text-green-700 font-medium bg-green-50 px-3 py-2 rounded-lg">Pago confirmado. Email enviado al cliente.</p>
  }

  return (
    <div className="space-y-2 mt-3">
      <button
        onClick={confirmar}
        disabled={loading}
        className="w-full text-sm px-3 py-2 rounded-lg font-medium bg-green-600 hover:bg-green-700 text-white transition-colors disabled:opacity-60"
      >
        {loading ? 'Procesando...' : 'Confirmar pago manualmente'}
      </button>
      {error && <p className="text-xs text-red-600">{error}</p>}
      <p className="text-xs text-gray-400">Usar solo si Stripe confirma el pago pero el webhook no llegó.</p>
    </div>
  )
}
