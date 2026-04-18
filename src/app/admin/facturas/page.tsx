'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

type Factura = {
  id: string
  numero: string
  clienteNombre: string
  clienteEmail: string
  baseImponible: number
  cuotaIVA: number
  total: number
  fechaEmision: string
  solicitud: { referencia: string | null; tipo: string }
  user: { email: string; name: string | null } | null
}

export default function AdminFacturasPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [facturas, setFacturas] = useState<Factura[]>([])
  const [total, setTotal] = useState(0)
  const [pages, setPages] = useState(1)
  const [loading, setLoading] = useState(true)

  const q = searchParams.get('q') ?? ''
  const page = parseInt(searchParams.get('page') ?? '1')

  const fetchFacturas = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams({ q, page: String(page) })
    const res = await fetch(`/api/admin/facturas?${params}`)
    const data = await res.json()
    setFacturas(data.facturas)
    setTotal(data.total)
    setPages(data.pages)
    setLoading(false)
  }, [q, page])

  useEffect(() => { fetchFacturas() }, [fetchFacturas])

  function navigate(newQ?: string, newPage?: number) {
    const params = new URLSearchParams()
    if (newQ !== undefined ? newQ : q) params.set('q', newQ ?? q)
    if ((newPage ?? page) > 1) params.set('page', String(newPage ?? page))
    router.push(`/admin/facturas?${params.toString()}`)
  }

  const ingresos = facturas.reduce((acc, f) => acc + f.total, 0)

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Facturas</h1>
          <p className="text-gray-500 text-sm mt-0.5">{total} factura{total !== 1 ? 's' : ''} emitidas</p>
        </div>
        {ingresos > 0 && (
          <div className="card px-5 py-3 text-right">
            <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">Ingresos (página)</p>
            <p className="text-xl font-bold text-green-700">{ingresos.toFixed(2)} €</p>
          </div>
        )}
      </div>

      {/* Búsqueda */}
      <div className="card p-4 mb-6">
        <input
          type="search"
          defaultValue={q}
          placeholder="Buscar por número, email o nombre..."
          className="input w-full max-w-md"
          onKeyDown={(e) => {
            if (e.key === 'Enter') navigate((e.target as HTMLInputElement).value, 1)
          }}
        />
      </div>

      {loading ? (
        <div className="card p-8 text-center text-gray-400">Cargando...</div>
      ) : facturas.length === 0 ? (
        <div className="card p-12 text-center">
          <div className="text-5xl mb-3">🧾</div>
          <p className="text-gray-500">No hay facturas{q ? ` para "${q}"` : ''}</p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Nº Factura</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Cliente</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden md:table-cell">Referencia</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden lg:table-cell">Fecha</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Base</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">IVA</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Total</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {facturas.map((f) => (
                <tr key={f.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <span className="font-mono font-semibold text-gray-900 text-xs">{f.numero}</span>
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900">{f.clienteNombre}</p>
                    <p className="text-xs text-gray-400">{f.clienteEmail}</p>
                  </td>
                  <td className="px-4 py-3 text-xs font-mono text-gray-500 hidden md:table-cell">
                    {f.solicitud.referencia}
                  </td>
                  <td className="px-4 py-3 text-gray-500 hidden lg:table-cell">
                    {new Date(f.fechaEmision).toLocaleDateString('es-ES')}
                  </td>
                  <td className="px-4 py-3 text-right text-gray-600">{f.baseImponible.toFixed(2)} €</td>
                  <td className="px-4 py-3 text-right text-gray-600">{f.cuotaIVA.toFixed(2)} €</td>
                  <td className="px-4 py-3 text-right font-bold text-gray-900">{f.total.toFixed(2)} €</td>
                  <td className="px-4 py-3 text-right">
                    <a
                      href={`/api/facturas/${f.id}/pdf`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-semibold text-green-700 bg-green-50 border border-green-200 px-2.5 py-1 rounded-lg hover:bg-green-100 transition-colors"
                    >
                      PDF
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {pages > 1 && (
            <div className="px-4 py-3 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
              <button
                disabled={page <= 1}
                onClick={() => navigate(undefined, page - 1)}
                className="text-sm text-brand-600 disabled:text-gray-300"
              >
                ← Anterior
              </button>
              <span className="text-xs text-gray-500">Página {page} de {pages}</span>
              <button
                disabled={page >= pages}
                onClick={() => navigate(undefined, page + 1)}
                className="text-sm text-brand-600 disabled:text-gray-300"
              >
                Siguiente →
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
