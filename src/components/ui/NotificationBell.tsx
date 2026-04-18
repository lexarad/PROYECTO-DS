'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'

interface Notificacion {
  id: string
  tipo: string
  titulo: string
  cuerpo: string
  enlace: string | null
  leida: boolean
  createdAt: string
}

const TIPO_ICON: Record<string, string> = {
  ESTADO_CAMBIADO: '📋',
  MENSAJE: '💬',
  DOCUMENTO: '📄',
  PAGO: '✅',
}

const POLL_INTERVAL = 30_000

export function NotificationBell({ noLeidasIniciales }: { noLeidasIniciales: number }) {
  const [noLeidas, setNoLeidas] = useState(noLeidasIniciales)
  const [open, setOpen] = useState(false)
  const [notificaciones, setNotificaciones] = useState<Notificacion[]>([])
  const [cargando, setCargando] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  // Cerrar al hacer clic fuera
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // Polling del badge (sin abrir el dropdown)
  useEffect(() => {
    const id = setInterval(async () => {
      try {
        const res = await fetch('/api/notificaciones')
        if (res.ok) {
          const data = await res.json()
          setNoLeidas(data.noLeidas)
        }
      } catch { /* silent */ }
    }, POLL_INTERVAL)
    return () => clearInterval(id)
  }, [])

  async function abrirPanel() {
    if (open) { setOpen(false); return }
    setOpen(true)
    setCargando(true)
    try {
      const res = await fetch('/api/notificaciones')
      if (res.ok) {
        const data = await res.json()
        setNotificaciones(data.notificaciones)
        setNoLeidas(data.noLeidas)
      }
    } catch { /* silent */ }
    finally { setCargando(false) }
  }

  async function marcarTodas() {
    await fetch('/api/notificaciones', { method: 'PATCH' })
    setNotificaciones(prev => prev.map(n => ({ ...n, leida: true })))
    setNoLeidas(0)
  }

  async function limpiar() {
    await fetch('/api/notificaciones', { method: 'DELETE' })
    setNotificaciones([])
    setNoLeidas(0)
    setOpen(false)
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={abrirPanel}
        className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors"
        aria-label="Notificaciones"
      >
        <svg className="h-5 w-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {noLeidas > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1">
            {noLeidas > 99 ? '99+' : noLeidas}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 bg-white border border-gray-200 rounded-xl shadow-lg z-50">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <h3 className="font-semibold text-sm">Notificaciones</h3>
            <div className="flex gap-3">
              {noLeidas > 0 && (
                <button onClick={marcarTodas} className="text-xs text-brand-600 hover:underline">Marcar todas leídas</button>
              )}
              {notificaciones.length > 0 && (
                <button onClick={limpiar} className="text-xs text-gray-400 hover:text-gray-600">Limpiar</button>
              )}
            </div>
          </div>

          <div className="max-h-80 overflow-y-auto divide-y divide-gray-50">
            {cargando && (
              <div className="py-8 text-center text-sm text-gray-400">Cargando…</div>
            )}
            {!cargando && notificaciones.length === 0 && (
              <div className="py-8 text-center text-sm text-gray-400">Sin notificaciones</div>
            )}
            {!cargando && notificaciones.map(n => (
              <div key={n.id} className={`px-4 py-3 ${n.leida ? 'opacity-60' : 'bg-blue-50/30'}`}>
                <div className="flex items-start gap-2">
                  <span className="text-base mt-0.5 shrink-0">{TIPO_ICON[n.tipo] ?? '🔔'}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{n.titulo}</p>
                    <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{n.cuerpo}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      {new Date(n.createdAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
                {n.enlace && (
                  <Link href={n.enlace} onClick={() => setOpen(false)}
                    className="mt-1 text-xs text-brand-600 hover:underline block">
                    Ver →
                  </Link>
                )}
              </div>
            ))}
          </div>

          <div className="px-4 py-2 border-t border-gray-100">
            <Link href="/dashboard/notificaciones" onClick={() => setOpen(false)}
              className="text-xs text-gray-500 hover:text-gray-700">
              Ver todas →
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
