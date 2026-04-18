'use client'

import { useState } from 'react'

export function BotonReenviarEmail({ solicitudId }: { solicitudId: string }) {
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)

  async function reenviar() {
    setLoading(true)
    setMsg(null)
    const res = await fetch(`/api/admin/solicitudes/${solicitudId}/reenviar-email`, { method: 'POST' })
    setMsg(res.ok ? { ok: true, text: 'Email reenviado.' } : { ok: false, text: 'Error al enviar.' })
    setLoading(false)
  }

  return (
    <div>
      <button
        onClick={reenviar}
        disabled={loading}
        className="w-full text-sm border border-gray-200 text-gray-600 px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
      >
        {loading ? 'Enviando...' : '✉ Reenviar email al cliente'}
      </button>
      {msg && (
        <p className={`text-xs mt-1 ${msg.ok ? 'text-green-600' : 'text-red-600'}`}>{msg.text}</p>
      )}
    </div>
  )
}
