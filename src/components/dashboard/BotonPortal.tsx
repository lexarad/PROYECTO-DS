'use client'

import { useState } from 'react'

export function BotonPortal() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleClick() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/suscripcion/portal', { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Error al abrir el portal')
      window.location.href = data.url
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error inesperado')
      setLoading(false)
    }
  }

  return (
    <div>
      <button
        onClick={handleClick}
        disabled={loading}
        className="w-full text-sm font-semibold border border-gray-200 text-gray-700 bg-white hover:bg-gray-50 px-4 py-2.5 rounded-lg transition-colors disabled:opacity-50"
      >
        {loading ? 'Abriendo portal...' : 'Gestionar suscripción →'}
      </button>
      {error && <p className="text-xs text-red-500 mt-2 text-center">{error}</p>}
    </div>
  )
}
