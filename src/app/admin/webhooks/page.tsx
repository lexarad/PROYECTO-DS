'use client'

import { useState, useEffect, useCallback } from 'react'

type Evento = {
  id: string
  stripeId: string
  tipo: string
  procesado: boolean
  error: string | null
  createdAt: string
}

export default function AdminWebhooksPage() {
  const [eventos, setEventos] = useState<Evento[]>([])
  const [total, setTotal] = useState(0)
  const [pages, setPages] = useState(1)
  const [page, setPage] = useState(1)
  const [soloErrores, setSoloErrores] = useState(false)
  const [loading, setLoading] = useState(true)
  const [expandido, setExpandido] = useState<string | null>(null)

  const fetchEventos = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams({ page: String(page) })
    if (soloErrores) params.set('errores', '1')
    const res = await fetch(`/api/admin/webhooks?${params}`)
    const data = await res.json()
    setEventos(data.eventos ?? [])
    setTotal(data.total ?? 0)
    setPages(data.pages ?? 1)
    setLoading(false)
  }, [page, soloErrores])

  useEffect(() => { fetchEventos() }, [fetchEventos])

  const tipoColor = (tipo: string) => {
    if (tipo.includes('completed')) return 'bg-green-100 text-green-700'
    if (tipo.includes('deleted') || tipo.includes('failed')) return 'bg-red-100 text-red-700'
    if (tipo.includes('updated')) return 'bg-blue-100 text-blue-700'
    return 'bg-gray-100 text-gray-600'
  }

  const errores = eventos.filter((e) => e.error).length

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Webhook Events</h1>
          <p className="text-sm text-gray-500 mt-0.5">Log de eventos Stripe recibidos</p>
        </div>
        <div className="flex items-center gap-3">
          {errores > 0 && (
            <span className="text-xs font-bold bg-red-100 text-red-700 px-2.5 py-1 rounded-full">
              {errores} error{errores !== 1 ? 'es' : ''}
            </span>
          )}
          <button
            onClick={() => { setSoloErrores(!soloErrores); setPage(1) }}
            className={`text-sm px-3 py-1.5 rounded-lg border transition-colors ${
              soloErrores
                ? 'bg-red-600 text-white border-red-600'
                : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
            }`}
          >
            {soloErrores ? 'Ver todos' : 'Solo errores'}
          </button>
          <button onClick={fetchEventos} className="text-sm text-gray-500 hover:text-gray-700">
            Actualizar
          </button>
        </div>
      </div>

      {loading ? (
        <div className="card p-8 text-center text-gray-400">Cargando...</div>
      ) : eventos.length === 0 ? (
        <div className="card p-12 text-center">
          <div className="text-4xl mb-3">📭</div>
          <p className="text-gray-500">{soloErrores ? 'Sin errores registrados' : 'Sin eventos todavía'}</p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Tipo</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden md:table-cell">Stripe ID</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden lg:table-cell">Fecha</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Estado</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {eventos.map((e) => (
                <>
                  <tr key={e.id} className={`hover:bg-gray-50 transition-colors ${e.error ? 'bg-red-50/40' : ''}`}>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${tipoColor(e.tipo)}`}>
                        {e.tipo}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-gray-400 hidden md:table-cell">
                      {e.stripeId.slice(0, 24)}…
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs hidden lg:table-cell">
                      {new Date(e.createdAt).toLocaleString('es-ES')}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {e.error ? (
                        <span className="text-xs font-bold text-red-600 bg-red-100 px-2 py-0.5 rounded-full">Error</span>
                      ) : e.procesado ? (
                        <span className="text-xs font-medium text-green-600 bg-green-100 px-2 py-0.5 rounded-full">OK</span>
                      ) : (
                        <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">Pendiente</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {e.error && (
                        <button
                          onClick={() => setExpandido(expandido === e.id ? null : e.id)}
                          className="text-xs text-red-600 hover:underline"
                        >
                          {expandido === e.id ? 'Ocultar' : 'Ver error'}
                        </button>
                      )}
                    </td>
                  </tr>
                  {expandido === e.id && e.error && (
                    <tr key={`${e.id}-err`}>
                      <td colSpan={5} className="px-4 pb-3">
                        <pre className="text-xs bg-red-50 border border-red-200 rounded-lg p-3 text-red-800 overflow-x-auto whitespace-pre-wrap">
                          {e.error}
                        </pre>
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>

          {pages > 1 && (
            <div className="px-4 py-3 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
              <span className="text-xs text-gray-500">{total} eventos · página {page}/{pages}</span>
              <div className="flex gap-2">
                <button disabled={page <= 1} onClick={() => setPage(page - 1)} className="text-sm text-brand-600 disabled:text-gray-300">← Ant</button>
                <button disabled={page >= pages} onClick={() => setPage(page + 1)} className="text-sm text-brand-600 disabled:text-gray-300">Sig →</button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
