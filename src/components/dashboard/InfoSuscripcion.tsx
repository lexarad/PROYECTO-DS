'use client'

import { useState, useEffect } from 'react'

interface SubInfo {
  status: string
  currentPeriodEnd: string
  cancelAtPeriodEnd: boolean
  cancelAt: string | null
}

export function InfoSuscripcion() {
  const [info, setInfo] = useState<SubInfo | null | 'loading'>('loading')

  useEffect(() => {
    fetch('/api/suscripcion/info')
      .then(r => r.ok ? r.json() : null)
      .then(data => setInfo(data?.subscription ?? null))
      .catch(() => setInfo(null))
  }, [])

  if (info === 'loading' || !info) return null

  const fecha = new Date(info.currentPeriodEnd).toLocaleDateString('es-ES', { dateStyle: 'long' })

  const statusColor: Record<string, string> = {
    active:   'bg-green-100 text-green-800',
    past_due: 'bg-red-100 text-red-800',
    canceled: 'bg-gray-100 text-gray-600',
    trialing: 'bg-blue-100 text-blue-800',
    unpaid:   'bg-orange-100 text-orange-800',
  }

  const statusLabel: Record<string, string> = {
    active:   'Activa',
    past_due: 'Pago pendiente',
    canceled: 'Cancelada',
    trialing: 'Periodo de prueba',
    unpaid:   'Sin pagar',
  }

  return (
    <div className={`mt-3 rounded-lg border px-4 py-3 text-sm ${
      info.status === 'past_due' || info.status === 'unpaid'
        ? 'border-red-200 bg-red-50'
        : 'border-gray-200 bg-gray-50'
    }`}>
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${statusColor[info.status] ?? 'bg-gray-100 text-gray-600'}`}>
            {statusLabel[info.status] ?? info.status}
          </span>
          {info.cancelAtPeriodEnd ? (
            <span className="text-gray-600">
              Se cancela el <strong>{fecha}</strong>
            </span>
          ) : (
            <span className="text-gray-600">
              Próxima factura: <strong>{fecha}</strong>
            </span>
          )}
        </div>
        {(info.status === 'past_due' || info.status === 'unpaid') && (
          <a
            href="/api/suscripcion/portal"
            className="text-xs font-medium text-red-700 underline hover:text-red-900"
          >
            Actualizar método de pago →
          </a>
        )}
      </div>
    </div>
  )
}
