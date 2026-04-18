'use client'

import { useEffect, useState } from 'react'

interface StatsReferidos {
  referralCode: string
  referralUrl: string
  totalReferidos: number
  totalCreditos: number
  referidos: { id: string; name: string | null; email: string; createdAt: string }[]
  creditos: { id: string; codigoPromo: string | null; cantidad: number; createdAt: string }[]
}

export function PanelReferidos() {
  const [stats, setStats] = useState<StatsReferidos | null>(null)
  const [copiado, setCopiado] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/referidos')
      .then(r => r.json())
      .then(setStats)
      .finally(() => setLoading(false))
  }, [])

  const copiar = async (text: string) => {
    await navigator.clipboard.writeText(text)
    setCopiado(true)
    setTimeout(() => setCopiado(false), 2000)
  }

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-24 bg-gray-100 rounded-lg" />
        <div className="h-32 bg-gray-100 rounded-lg" />
      </div>
    )
  }

  if (!stats) return null

  return (
    <div className="space-y-6">
      {/* Código y link */}
      <div className="card p-6">
        <h2 className="font-semibold text-gray-900 mb-1">Tu enlace de referido</h2>
        <p className="text-sm text-gray-500 mb-4">
          Comparte este enlace. Cuando alguien se registre y haga su primera compra, recibirás un <strong>15% de descuento</strong> para usar en tu próxima solicitud.
        </p>

        <div className="flex gap-2">
          <input
            readOnly
            value={stats.referralUrl}
            className="input flex-1 font-mono text-sm"
          />
          <button
            onClick={() => copiar(stats.referralUrl)}
            className="btn-secondary shrink-0"
          >
            {copiado ? '¡Copiado!' : 'Copiar'}
          </button>
        </div>

        <p className="text-xs text-gray-400 mt-2">
          Código: <span className="font-mono font-semibold text-gray-600">{stats.referralCode}</span>
        </p>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-2 gap-4">
        <div className="card p-5 text-center">
          <p className="text-3xl font-bold text-blue-600">{stats.totalReferidos}</p>
          <p className="text-sm text-gray-500 mt-1">Usuarios referidos</p>
        </div>
        <div className="card p-5 text-center">
          <p className="text-3xl font-bold text-green-600">{stats.creditos.length}</p>
          <p className="text-sm text-gray-500 mt-1">Descuentos ganados</p>
        </div>
      </div>

      {/* Códigos ganados */}
      {stats.creditos.length > 0 && (
        <div className="card p-6">
          <h3 className="font-semibold text-gray-900 mb-3">Descuentos obtenidos</h3>
          <div className="space-y-2">
            {stats.creditos.map(c => (
              <div key={c.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                <div>
                  <span className="font-mono text-sm font-semibold text-blue-700">{c.codigoPromo ?? '—'}</span>
                  <span className="text-xs text-gray-400 ml-2">15% de descuento</span>
                </div>
                <div className="flex items-center gap-2">
                  {c.codigoPromo && (
                    <button
                      onClick={() => copiar(c.codigoPromo!)}
                      className="text-xs text-blue-600 underline"
                    >
                      Copiar código
                    </button>
                  )}
                  <span className="text-xs text-gray-400">
                    {new Date(c.createdAt).toLocaleDateString('es-ES')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Lista de referidos */}
      {stats.referidos.length > 0 && (
        <div className="card p-6">
          <h3 className="font-semibold text-gray-900 mb-3">Usuarios referidos</h3>
          <div className="space-y-2">
            {stats.referidos.map(r => (
              <div key={r.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                <span className="text-sm text-gray-700">{r.name ?? r.email.split('@')[0]}</span>
                <span className="text-xs text-gray-400">
                  {new Date(r.createdAt).toLocaleDateString('es-ES')}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {stats.referidos.length === 0 && (
        <div className="card p-8 text-center">
          <p className="text-gray-400 text-sm">Aún no has referido a nadie. ¡Comparte tu enlace!</p>
        </div>
      )}
    </div>
  )
}
