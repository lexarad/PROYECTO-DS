'use client'

import { useState } from 'react'

interface Props {
  solicitudId: string
  precio: number
}

export function BotonPago({ solicitudId, precio }: Props) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handlePago() {
    setLoading(true)
    setError('')

    const res = await fetch('/api/pagos/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ solicitudId }),
    })

    const data = await res.json()
    setLoading(false)

    if (!res.ok) {
      setError(data.error || 'Error al iniciar el pago.')
      return
    }

    window.location.href = data.url
  }

  return (
    <div>
      <button onClick={handlePago} disabled={loading} className="btn-primary w-full text-base py-3">
        {loading ? 'Redirigiendo a pago...' : `Pagar ${precio.toFixed(2)} € con tarjeta`}
      </button>
      {error && <p className="text-sm text-red-600 mt-2">{error}</p>}
      <p className="text-xs text-gray-400 mt-2 text-center">Pago seguro procesado por Stripe</p>
    </div>
  )
}
