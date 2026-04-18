'use client'

import { useState, useCallback } from 'react'

interface Endpoint {
  id: string
  url: string
  activo: boolean
  eventos: string[]
  createdAt: string
  _count?: { deliveries: number }
}

interface Delivery {
  id: string
  evento: string
  status: number | null
  ok: boolean
  intentos: number
  error: string | null
  createdAt: string
}

const TODOS_EVENTOS = [
  'solicitud.estado_cambiado',
  'solicitud.completada',
  'solicitud.rechazada',
  'solicitud.tramitada',
]

function fmt(d: string) {
  return new Date(d).toLocaleString('es-ES', { dateStyle: 'short', timeStyle: 'short' })
}

interface Props {
  initialEndpoints: Endpoint[]
}

export function GestorWebhooks({ initialEndpoints }: Props) {
  const [endpoints, setEndpoints] = useState<Endpoint[]>(initialEndpoints)
  const [newUrl, setNewUrl] = useState('')
  const [newEventos, setNewEventos] = useState<string[]>(TODOS_EVENTOS)
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState('')
  const [newSecret, setNewSecret] = useState<string | null>(null)
  const [deliveries, setDeliveries] = useState<Record<string, Delivery[]>>({})
  const [loadingDeliveries, setLoadingDeliveries] = useState<string | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [toggling, setToggling] = useState<string | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)

  const loadDeliveries = useCallback(async (id: string) => {
    if (deliveries[id]) {
      setExpandedId(expandedId === id ? null : id)
      return
    }
    setLoadingDeliveries(id)
    const r = await fetch(`/api/webhooks/${id}/deliveries`)
    if (r.ok) {
      const data = await r.json()
      setDeliveries(prev => ({ ...prev, [id]: data.deliveries }))
      setExpandedId(id)
    }
    setLoadingDeliveries(null)
  }, [deliveries, expandedId])

  async function crear() {
    setCreating(true)
    setCreateError('')
    setNewSecret(null)
    const r = await fetch('/api/webhooks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: newUrl, eventos: newEventos }),
    })
    const data = await r.json()
    if (r.ok) {
      setEndpoints(prev => [{ ...data, _count: { deliveries: 0 } }, ...prev])
      setNewSecret(data.secret)
      setNewUrl('')
      setNewEventos(TODOS_EVENTOS)
    } else {
      setCreateError(data.error ?? 'Error al crear el endpoint')
    }
    setCreating(false)
  }

  async function toggleActivo(id: string, activo: boolean) {
    setToggling(id)
    const r = await fetch(`/api/webhooks/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ activo: !activo }),
    })
    if (r.ok) {
      setEndpoints(prev => prev.map(e => e.id === id ? { ...e, activo: !activo } : e))
    }
    setToggling(null)
  }

  async function eliminar(id: string) {
    if (!confirm('¿Eliminar este endpoint? Se perderán todos los registros de entrega.')) return
    setDeleting(id)
    await fetch(`/api/webhooks/${id}`, { method: 'DELETE' })
    setEndpoints(prev => prev.filter(e => e.id !== id))
    setDeleting(null)
  }

  return (
    <div className="space-y-6">
      {/* Crear endpoint */}
      <div className="card p-5 space-y-4">
        <h2 className="font-semibold text-gray-800">Añadir endpoint</h2>
        <div>
          <label className="label text-sm">URL del endpoint (HTTPS)</label>
          <input
            value={newUrl}
            onChange={e => setNewUrl(e.target.value)}
            placeholder="https://tuapp.com/webhooks/certidocs"
            className="input"
            type="url"
          />
        </div>
        <div>
          <label className="label text-sm">Eventos a recibir</label>
          <div className="flex flex-wrap gap-2">
            {TODOS_EVENTOS.map(ev => (
              <label key={ev} className="flex items-center gap-1.5 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={newEventos.includes(ev)}
                  onChange={e => setNewEventos(prev =>
                    e.target.checked ? [...prev, ev] : prev.filter(x => x !== ev)
                  )}
                  className="rounded"
                />
                <span className="font-mono text-xs">{ev}</span>
              </label>
            ))}
          </div>
        </div>
        {createError && <p className="text-sm text-red-600">{createError}</p>}
        <button
          onClick={crear}
          disabled={creating || !newUrl || newEventos.length === 0}
          className="btn-primary text-sm px-4 py-2 disabled:opacity-50"
        >
          {creating ? 'Creando...' : 'Crear endpoint'}
        </button>
      </div>

      {/* Secreto recién creado */}
      {newSecret && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-sm font-semibold text-yellow-800 mb-2">
            Secreto de firma — guárdalo ahora, no se mostrará de nuevo
          </p>
          <code className="block bg-yellow-100 text-yellow-900 font-mono text-xs p-3 rounded break-all">
            {newSecret}
          </code>
          <p className="text-xs text-yellow-700 mt-2">
            Úsalo para verificar la firma HMAC-SHA256 del header <code>X-Webhook-Signature</code>.
          </p>
          <button
            onClick={() => setNewSecret(null)}
            className="mt-2 text-xs text-yellow-700 underline"
          >
            He guardado el secreto
          </button>
        </div>
      )}

      {/* Lista de endpoints */}
      {endpoints.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-6">No tienes endpoints configurados.</p>
      ) : (
        <div className="space-y-3">
          {endpoints.map(ep => (
            <div key={ep.id} className="card overflow-hidden">
              <div className="px-4 py-3 flex flex-col sm:flex-row sm:items-center gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`inline-block w-2 h-2 rounded-full shrink-0 ${ep.activo ? 'bg-green-500' : 'bg-gray-300'}`} />
                    <span className="font-mono text-sm truncate">{ep.url}</span>
                  </div>
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {ep.eventos.map(ev => (
                      <span key={ev} className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded font-mono">
                        {ev}
                      </span>
                    ))}
                  </div>
                  <p className="text-xs text-gray-400 mt-1">
                    Creado {fmt(ep.createdAt)} · {ep._count?.deliveries ?? 0} entregas
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => loadDeliveries(ep.id)}
                    disabled={loadingDeliveries === ep.id}
                    className="text-xs text-gray-500 hover:text-gray-700 underline"
                  >
                    {loadingDeliveries === ep.id ? '...' : expandedId === ep.id ? 'Ocultar' : 'Entregas'}
                  </button>
                  <button
                    onClick={() => toggleActivo(ep.id, ep.activo)}
                    disabled={toggling === ep.id}
                    className={`text-xs px-2.5 py-1 rounded border transition-colors ${
                      ep.activo
                        ? 'border-gray-300 text-gray-600 hover:bg-gray-50'
                        : 'border-green-300 text-green-700 hover:bg-green-50'
                    }`}
                  >
                    {ep.activo ? 'Desactivar' : 'Activar'}
                  </button>
                  <button
                    onClick={() => eliminar(ep.id)}
                    disabled={deleting === ep.id}
                    className="text-xs text-red-600 hover:text-red-800 underline"
                  >
                    {deleting === ep.id ? '...' : 'Eliminar'}
                  </button>
                </div>
              </div>

              {expandedId === ep.id && deliveries[ep.id] && (
                <div className="border-t border-gray-100 bg-gray-50 px-4 py-3">
                  <p className="text-xs font-semibold text-gray-600 mb-2">Últimas 50 entregas</p>
                  {deliveries[ep.id].length === 0 ? (
                    <p className="text-xs text-gray-400">Sin entregas registradas.</p>
                  ) : (
                    <div className="space-y-1">
                      {deliveries[ep.id].map(d => (
                        <div key={d.id} className="flex items-center gap-3 text-xs">
                          <span className={`w-2 h-2 rounded-full shrink-0 ${d.ok ? 'bg-green-500' : 'bg-red-500'}`} />
                          <span className="font-mono text-gray-600">{d.evento}</span>
                          <span className={`font-medium ${d.ok ? 'text-green-700' : 'text-red-600'}`}>
                            {d.status ?? '—'}
                          </span>
                          {d.intentos > 1 && (
                            <span className="text-gray-400">{d.intentos} intentos</span>
                          )}
                          {d.error && (
                            <span className="text-red-500 truncate max-w-[200px]" title={d.error}>
                              {d.error}
                            </span>
                          )}
                          <span className="text-gray-400 ml-auto">{fmt(d.createdAt)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
