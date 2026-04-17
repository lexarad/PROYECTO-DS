'use client'

import { useState } from 'react'

interface Props {
  solicitudId: string
  notasIniciales: string | null
}

export function NotasInternas({ solicitudId, notasIniciales }: Props) {
  const [notas, setNotas] = useState(notasIniciales ?? '')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  async function guardar() {
    setSaving(true)
    setSaved(false)
    await fetch(`/api/admin/solicitudes/${solicitudId}/notas`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ notas: notas.trim() || null }),
    })
    setSaving(false)
    setSaved(true)
  }

  return (
    <div className="space-y-2">
      <textarea
        value={notas}
        onChange={(e) => { setNotas(e.target.value); setSaved(false) }}
        placeholder="Notas internas (no visibles para el cliente)"
        rows={3}
        className="input text-sm resize-none"
      />
      <div className="flex items-center justify-between">
        <button
          onClick={guardar}
          disabled={saving}
          className="text-xs font-medium text-brand-600 hover:text-brand-800 disabled:opacity-60"
        >
          {saving ? 'Guardando...' : 'Guardar notas'}
        </button>
        {saved && <p className="text-xs text-green-600">Guardado</p>}
      </div>
    </div>
  )
}
