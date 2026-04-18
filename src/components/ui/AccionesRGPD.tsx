'use client'

import { useState } from 'react'
import { signOut } from 'next-auth/react'

export function AccionesRGPD() {
  const [confirmando, setConfirmando] = useState(false)
  const [eliminando, setEliminando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function eliminarCuenta() {
    setEliminando(true)
    setError(null)
    try {
      const res = await fetch('/api/user/cuenta', { method: 'DELETE' })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Error al eliminar la cuenta'); setEliminando(false); return }
      await signOut({ callbackUrl: '/' })
    } catch {
      setError('Error de conexión.')
      setEliminando(false)
    }
  }

  return (
    <div className="card p-6 space-y-4">
      <h2 className="font-semibold">Privacidad y datos (RGPD)</h2>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">{error}</p>
      )}

      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <p className="text-sm font-medium">Exportar mis datos</p>
          <p className="text-xs text-gray-500 mt-0.5">Descarga un archivo JSON con todas tus solicitudes, facturas y mensajes.</p>
        </div>
        <a
          href="/api/user/exportar-datos"
          download
          className="btn-secondary text-sm py-2 px-4 shrink-0"
        >
          Descargar JSON
        </a>
      </div>

      <div className="border-t border-gray-100 pt-4">
        {!confirmando ? (
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <p className="text-sm font-medium text-red-700">Eliminar mi cuenta</p>
              <p className="text-xs text-gray-500 mt-0.5">Esta acción es irreversible. Tus datos personales serán eliminados.</p>
            </div>
            <button
              onClick={() => setConfirmando(true)}
              className="text-sm font-medium text-red-600 border border-red-200 bg-red-50 hover:bg-red-100 px-4 py-2 rounded-lg transition-colors shrink-0"
            >
              Eliminar cuenta
            </button>
          </div>
        ) : (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 space-y-3">
            <p className="text-sm font-semibold text-red-800">¿Estás seguro?</p>
            <p className="text-xs text-red-700">
              Se eliminarán tu nombre, email, API keys y suscripción. Las solicitudes pagadas se conservarán de forma anónima para cumplir con las obligaciones fiscales.
            </p>
            <div className="flex gap-3">
              <button
                onClick={eliminarCuenta}
                disabled={eliminando}
                className="text-sm font-semibold text-white bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg disabled:opacity-50 transition-colors"
              >
                {eliminando ? 'Eliminando…' : 'Sí, eliminar definitivamente'}
              </button>
              <button
                onClick={() => setConfirmando(false)}
                className="text-sm text-gray-600 hover:text-gray-900"
              >
                Cancelar
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
