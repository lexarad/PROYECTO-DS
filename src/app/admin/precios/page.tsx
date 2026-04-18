'use client'

import { useState, useEffect } from 'react'

type PrecioRow = {
  tipo: string
  label: string
  precioDefault: number
  precioActual: number
  personalizado: boolean
  activo: boolean
  descripcion: string | null
  updatedAt: string | null
}

export default function PreciosPage() {
  const [filas, setFilas] = useState<PrecioRow[]>([])
  const [editando, setEditando] = useState<Record<string, { precio: string; descripcion: string }>>({})
  const [guardando, setGuardando] = useState<string | null>(null)
  const [msg, setMsg] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/admin/precios').then(r => r.json()).then(data => { setFilas(data); setLoading(false) })
  }, [])

  function iniciarEdicion(f: PrecioRow) {
    setEditando(prev => ({
      ...prev,
      [f.tipo]: { precio: String(f.precioActual), descripcion: f.descripcion ?? '' },
    }))
  }

  function cancelar(tipo: string) {
    setEditando(prev => { const n = { ...prev }; delete n[tipo]; return n })
  }

  async function guardar(f: PrecioRow) {
    const vals = editando[f.tipo]
    if (!vals) return
    const precio = parseFloat(vals.precio)
    if (isNaN(precio) || precio < 0) { setMsg('Precio inválido'); return }

    setGuardando(f.tipo)
    setMsg(null)
    const res = await fetch(`/api/admin/precios/${f.tipo}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ precioBase: precio, descripcion: vals.descripcion || null }),
    })
    if (res.ok) {
      setFilas(prev => prev.map(r => r.tipo === f.tipo
        ? { ...r, precioActual: precio, personalizado: true, descripcion: vals.descripcion || null }
        : r
      ))
      cancelar(f.tipo)
      setMsg(`✓ Precio de ${f.label} actualizado a ${precio.toFixed(2)}€`)
    } else {
      const d = await res.json()
      setMsg(`Error: ${d.error}`)
    }
    setGuardando(null)
  }

  async function restaurar(f: PrecioRow) {
    setGuardando(f.tipo)
    await fetch(`/api/admin/precios/${f.tipo}`, { method: 'DELETE' })
    setFilas(prev => prev.map(r => r.tipo === f.tipo
      ? { ...r, precioActual: r.precioDefault, personalizado: false, descripcion: null }
      : r
    ))
    cancelar(f.tipo)
    setGuardando(null)
    setMsg(`✓ Precio de ${f.label} restaurado al valor por defecto (${f.precioDefault.toFixed(2)}€)`)
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Configuración de precios</h1>
        <p className="text-sm text-gray-500 mt-0.5">Ajusta el precio base de cada tipo de certificado. Los cambios se aplican en nuevas solicitudes.</p>
      </div>

      {msg && (
        <div className={`mb-4 text-sm px-4 py-2 rounded-lg border ${msg.startsWith('✓') ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-700'}`}>
          {msg}
        </div>
      )}

      {loading ? (
        <div className="card p-8 text-center text-gray-400">Cargando…</div>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Certificado</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">Por defecto</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">Precio actual</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 hidden lg:table-cell">Nota</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filas.map(f => {
                const enEdicion = !!editando[f.tipo]
                const vals = editando[f.tipo]
                return (
                  <tr key={f.tipo} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <p className="font-medium">{f.label}</p>
                      {f.personalizado && (
                        <span className="text-xs text-brand-600 font-medium">Personalizado</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right text-gray-400">{f.precioDefault.toFixed(2)} €</td>
                    <td className="px-4 py-3 text-right">
                      {enEdicion ? (
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          max="9999"
                          value={vals.precio}
                          onChange={e => setEditando(p => ({ ...p, [f.tipo]: { ...p[f.tipo], precio: e.target.value } }))}
                          className="w-24 text-right border border-brand-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-brand-300"
                          autoFocus
                        />
                      ) : (
                        <span className={`font-semibold ${f.personalizado ? 'text-brand-700' : ''}`}>
                          {f.precioActual.toFixed(2)} €
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      {enEdicion ? (
                        <input
                          type="text"
                          placeholder="Nota interna…"
                          value={vals.descripcion}
                          onChange={e => setEditando(p => ({ ...p, [f.tipo]: { ...p[f.tipo], descripcion: e.target.value } }))}
                          className="w-full border border-gray-200 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-brand-300"
                        />
                      ) : (
                        <span className="text-gray-400 text-xs">{f.descripcion ?? '—'}</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2 justify-end">
                        {enEdicion ? (
                          <>
                            <button onClick={() => guardar(f)} disabled={guardando === f.tipo}
                              className="text-xs font-semibold text-white bg-brand-600 hover:bg-brand-700 px-3 py-1.5 rounded-lg disabled:opacity-50">
                              {guardando === f.tipo ? '…' : 'Guardar'}
                            </button>
                            <button onClick={() => cancelar(f.tipo)} className="text-xs text-gray-500 hover:text-gray-700">
                              Cancelar
                            </button>
                          </>
                        ) : (
                          <>
                            <button onClick={() => iniciarEdicion(f)}
                              className="text-xs text-brand-600 hover:underline">
                              Editar
                            </button>
                            {f.personalizado && (
                              <button onClick={() => restaurar(f)} disabled={guardando === f.tipo}
                                className="text-xs text-gray-400 hover:text-gray-600">
                                Restaurar
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      <p className="mt-4 text-xs text-gray-400">
        Los descuentos de plan (PRO/ENTERPRISE) y códigos promocionales se aplican sobre el precio base configurado.
      </p>
    </div>
  )
}
