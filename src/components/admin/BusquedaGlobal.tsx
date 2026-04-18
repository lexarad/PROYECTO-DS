'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'

type Solicitud = { id: string; referencia: string | null; tipo: string; estado: string; user: { email: string; name: string | null } | null; emailInvitado: string | null }
type Usuario   = { id: string; name: string | null; email: string; plan: string; role: string }
type Factura   = { id: string; numero: string; total: number; clienteEmail: string; fechaEmision: string }

interface Results { solicitudes: Solicitud[]; usuarios: Usuario[]; facturas: Factura[] }

const EMPTY: Results = { solicitudes: [], usuarios: [], facturas: [] }

export function BusquedaGlobal() {
  const [open, setOpen] = useState(false)
  const [q, setQ] = useState('')
  const [results, setResults] = useState<Results>(EMPTY)
  const [loading, setLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Cmd+K / Ctrl+K
  useEffect(() => {
    function handler(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setOpen(o => !o)
      }
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 50)
    else { setQ(''); setResults(EMPTY) }
  }, [open])

  const buscar = useCallback(async (texto: string) => {
    if (texto.length < 2) { setResults(EMPTY); return }
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/buscar?q=${encodeURIComponent(texto)}`)
      if (res.ok) setResults(await res.json())
    } catch { /* silent */ }
    finally { setLoading(false) }
  }, [])

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value
    setQ(val)
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => buscar(val), 300)
  }

  function ir(href: string) { router.push(href); setOpen(false) }

  const total = results.solicitudes.length + results.usuarios.length + results.facturas.length
  const sinResultados = q.length >= 2 && !loading && total === 0

  if (!open) return (
    <button
      onClick={() => setOpen(true)}
      className="hidden md:flex items-center gap-2 text-sm text-brand-300 hover:text-white bg-brand-800 hover:bg-brand-700 px-3 py-1.5 rounded-lg transition-colors"
    >
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
      </svg>
      <span>Buscar</span>
      <kbd className="text-xs bg-brand-700 px-1.5 py-0.5 rounded font-mono">⌘K</kbd>
    </button>
  )

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[10vh] bg-black/50 backdrop-blur-sm" onClick={() => setOpen(false)}>
      <div className="w-full max-w-xl bg-white rounded-2xl shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
        {/* Input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100">
          <svg className="h-5 w-5 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
          </svg>
          <input
            ref={inputRef}
            type="text"
            value={q}
            onChange={handleChange}
            placeholder="Buscar solicitud, usuario, factura…"
            className="flex-1 text-sm outline-none placeholder-gray-400"
          />
          {loading && <span className="text-xs text-gray-400 animate-pulse">Buscando…</span>}
          <kbd className="text-xs bg-gray-100 px-1.5 py-0.5 rounded font-mono text-gray-400">Esc</kbd>
        </div>

        {/* Resultados */}
        <div className="max-h-[60vh] overflow-y-auto py-2">
          {sinResultados && (
            <p className="text-sm text-gray-400 text-center py-8">Sin resultados para «{q}»</p>
          )}

          {results.solicitudes.length > 0 && (
            <section>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide px-4 py-2">Solicitudes</p>
              {results.solicitudes.map(s => (
                <button key={s.id} onClick={() => ir(`/admin/solicitudes/${s.id}`)}
                  className="w-full text-left px-4 py-2.5 hover:bg-gray-50 flex items-center gap-3">
                  <span className="text-xs font-mono text-gray-500 w-28 shrink-0">{s.referencia}</span>
                  <span className="text-sm flex-1">{s.tipo.replace(/_/g, ' ')}</span>
                  <span className="text-xs text-gray-400">{s.user?.email ?? s.emailInvitado ?? '—'}</span>
                </button>
              ))}
            </section>
          )}

          {results.usuarios.length > 0 && (
            <section>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide px-4 py-2 mt-1">Usuarios</p>
              {results.usuarios.map(u => (
                <button key={u.id} onClick={() => ir(`/admin/usuarios`)}
                  className="w-full text-left px-4 py-2.5 hover:bg-gray-50 flex items-center gap-3">
                  <span className="text-sm flex-1">{u.name ?? u.email}</span>
                  <span className="text-xs text-gray-400">{u.email}</span>
                  <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${u.plan === 'FREE' ? 'bg-gray-100 text-gray-500' : 'bg-blue-100 text-blue-700'}`}>{u.plan}</span>
                </button>
              ))}
            </section>
          )}

          {results.facturas.length > 0 && (
            <section>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide px-4 py-2 mt-1">Facturas</p>
              {results.facturas.map(f => (
                <button key={f.id} onClick={() => ir(`/admin/facturas`)}
                  className="w-full text-left px-4 py-2.5 hover:bg-gray-50 flex items-center gap-3">
                  <span className="text-sm font-mono">{f.numero}</span>
                  <span className="text-sm flex-1 text-gray-500">{f.clienteEmail}</span>
                  <span className="text-sm font-semibold">{f.total.toFixed(2)} €</span>
                </button>
              ))}
            </section>
          )}

          {!q && (
            <p className="text-sm text-gray-400 text-center py-8">Escribe para buscar en todo el sistema</p>
          )}
        </div>
      </div>
    </div>
  )
}
