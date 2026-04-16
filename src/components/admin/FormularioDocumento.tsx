'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Props {
  solicitudId: string
}

export function FormularioDocumento({ solicitudId }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [open, setOpen] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const form = new FormData(e.currentTarget)
    const res = await fetch(`/api/admin/solicitudes/${solicitudId}/documentos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nombre: form.get('nombre'),
        url: form.get('url'),
        tipo: form.get('tipo'),
      }),
    })

    setLoading(false)
    if (!res.ok) {
      const data = await res.json()
      setError(data.error || 'Error al añadir el documento.')
    } else {
      setOpen(false)
      ;(e.target as HTMLFormElement).reset()
      router.refresh()
    }
  }

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="btn-secondary text-sm py-2 px-4">
        + Añadir documento
      </button>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 border-t border-gray-100 pt-4">
      <p className="text-sm font-medium text-gray-700">Añadir documento</p>

      <div>
        <label className="label text-xs">Nombre del documento</label>
        <input name="nombre" required className="input text-sm" placeholder="Ej: Certificado de nacimiento.pdf" />
      </div>
      <div>
        <label className="label text-xs">URL del archivo</label>
        <input name="url" type="url" required className="input text-sm" placeholder="https://..." />
      </div>
      <div>
        <label className="label text-xs">Tipo</label>
        <select name="tipo" className="input text-sm">
          <option value="PDF">PDF</option>
          <option value="IMAGEN">Imagen</option>
          <option value="OTRO">Otro</option>
        </select>
      </div>

      {error && <p className="text-xs text-red-600">{error}</p>}

      <div className="flex gap-2">
        <button type="submit" disabled={loading} className="btn-primary text-sm py-2 px-4">
          {loading ? 'Guardando...' : 'Guardar'}
        </button>
        <button type="button" onClick={() => setOpen(false)} className="btn-secondary text-sm py-2 px-4">
          Cancelar
        </button>
      </div>
    </form>
  )
}
