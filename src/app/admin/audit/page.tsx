'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'

type Log = {
  id: string
  adminEmail: string
  accion: string
  entidad: string
  entidadId: string
  resumen: string
  ip: string | null
  createdAt: string
}

const ACCION_COLOR: Record<string, string> = {
  ESTADO_CAMBIADO:   'bg-blue-100 text-blue-700',
  DOCUMENTO_AÑADIDO: 'bg-purple-100 text-purple-700',
  REEMBOLSO:         'bg-red-100 text-red-700',
  PAGO_CONFIRMADO:   'bg-green-100 text-green-700',
  NOTA_ACTUALIZADA:  'bg-gray-100 text-gray-600',
  MENSAJE_ENVIADO:   'bg-orange-100 text-orange-700',
  BULK_ESTADO:       'bg-yellow-100 text-yellow-700',
  PROMO_CREADA:      'bg-teal-100 text-teal-700',
  PROMO_ELIMINADA:   'bg-rose-100 text-rose-700',
}

const ACCIONES = [
  'ESTADO_CAMBIADO', 'DOCUMENTO_AÑADIDO', 'REEMBOLSO', 'PAGO_CONFIRMADO',
  'NOTA_ACTUALIZADA', 'MENSAJE_ENVIADO', 'BULK_ESTADO', 'PROMO_CREADA', 'PROMO_ELIMINADA',
]

export default function AuditPage() {
  const [logs, setLogs] = useState<Log[]>([])
  const [total, setTotal] = useState(0)
  const [pages, setPages] = useState(1)
  const [page, setPage] = useState(1)
  const [accion, setAccion] = useState('')
  const [q, setQ] = useState('')
  const [loading, setLoading] = useState(true)

  const fetch_ = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams({ page: String(page) })
    if (accion) params.set('accion', accion)
    if (q.trim()) params.set('q', q.trim())
    const res = await fetch(`/api/admin/audit?${params}`)
    const data = await res.json()
    setLogs(data.logs ?? [])
    setTotal(data.total ?? 0)
    setPages(data.pages ?? 1)
    setLoading(false)
  }, [page, accion, q])

  useEffect(() => { fetch_() }, [fetch_])

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Audit Log</h1>
          <p className="text-sm text-gray-500 mt-0.5">Registro de todas las acciones de administración</p>
        </div>
        <span className="text-sm text-gray-400">{total} entradas</span>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-3 mb-5">
        <input
          type="search"
          placeholder="Buscar en el log…"
          value={q}
          onChange={e => { setQ(e.target.value); setPage(1) }}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-300 w-56"
        />
        <select
          value={accion}
          onChange={e => { setAccion(e.target.value); setPage(1) }}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm"
        >
          <option value="">Todas las acciones</option>
          {ACCIONES.map(a => <option key={a} value={a}>{a.replace(/_/g, ' ')}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="card p-8 text-center text-gray-400">Cargando…</div>
      ) : logs.length === 0 ? (
        <div className="card p-12 text-center text-gray-400">Sin entradas de audit</div>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Acción</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Resumen</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 hidden md:table-cell">Admin</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 hidden lg:table-cell">Fecha</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {logs.map(log => (
                <tr key={log.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${ACCION_COLOR[log.accion] ?? 'bg-gray-100 text-gray-600'}`}>
                      {log.accion.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-700 max-w-xs">
                    <p className="truncate">{log.resumen}</p>
                    {log.ip && <p className="text-xs text-gray-400 font-mono">{log.ip}</p>}
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs hidden md:table-cell">{log.adminEmail}</td>
                  <td className="px-4 py-3 text-gray-400 text-xs hidden lg:table-cell whitespace-nowrap">
                    {new Date(log.createdAt).toLocaleString('es-ES')}
                  </td>
                  <td className="px-4 py-3">
                    {log.entidad === 'solicitud' && (
                      <Link href={`/admin/solicitudes/${log.entidadId}`}
                        className="text-xs text-brand-600 hover:underline">Ver →</Link>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {pages > 1 && (
            <div className="px-4 py-3 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
              <span className="text-xs text-gray-500">Página {page}/{pages}</span>
              <div className="flex gap-2">
                <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="text-sm text-brand-600 disabled:text-gray-300">← Ant</button>
                <button disabled={page >= pages} onClick={() => setPage(p => p + 1)} className="text-sm text-brand-600 disabled:text-gray-300">Sig →</button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
