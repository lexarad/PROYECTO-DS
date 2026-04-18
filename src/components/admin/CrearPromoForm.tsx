'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export function CrearPromoForm() {
  const router = useRouter()
  const [codigo, setCodigo] = useState('')
  const [descuento, setDescuento] = useState('10')
  const [maxUsos, setMaxUsos] = useState('')
  const [expira, setExpira] = useState('')
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setMsg(null)
    const res = await fetch('/api/admin/promos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        codigo: codigo.toUpperCase().trim(),
        descuento: parseFloat(descuento),
        maxUsos: maxUsos ? parseInt(maxUsos) : null,
        expira: expira || null,
      }),
    })
    const data = await res.json()
    if (res.ok) {
      setMsg({ ok: true, text: `Código "${data.codigo}" creado.` })
      setCodigo('')
      setDescuento('10')
      setMaxUsos('')
      setExpira('')
      router.refresh()
    } else {
      setMsg({ ok: false, text: data.error ?? 'Error al crear' })
    }
    setLoading(false)
  }

  return (
    <div className="card p-6">
      <h2 className="font-semibold mb-4">Crear código</h2>
      <form onSubmit={submit} className="flex flex-wrap gap-3 items-end">
        <div>
          <label className="block text-xs text-gray-500 mb-1">Código</label>
          <input
            value={codigo}
            onChange={(e) => setCodigo(e.target.value.toUpperCase())}
            required
            placeholder="BIENVENIDA10"
            className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm font-mono w-40"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Descuento (%)</label>
          <input
            type="number"
            value={descuento}
            onChange={(e) => setDescuento(e.target.value)}
            min="1"
            max="100"
            required
            className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm w-20"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Máx. usos</label>
          <input
            type="number"
            value={maxUsos}
            onChange={(e) => setMaxUsos(e.target.value)}
            min="1"
            placeholder="∞"
            className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm w-24"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Expira</label>
          <input
            type="date"
            value={expira}
            onChange={(e) => setExpira(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="btn-primary text-sm py-1.5 px-4 disabled:opacity-50"
        >
          {loading ? 'Creando...' : 'Crear'}
        </button>
      </form>
      {msg && (
        <p className={`mt-2 text-sm ${msg.ok ? 'text-green-600' : 'text-red-600'}`}>{msg.text}</p>
      )}
    </div>
  )
}
