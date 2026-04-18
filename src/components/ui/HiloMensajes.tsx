'use client'

import { useState, useEffect, useRef, useCallback } from 'react'

interface Mensaje {
  id: string
  autorRol: 'USER' | 'ADMIN'
  contenido: string
  leido: boolean
  createdAt: string
}

interface Props {
  solicitudId: string
  /** 'USER' = vista cliente, 'ADMIN' = vista admin */
  perspectiva: 'USER' | 'ADMIN'
  mensajesIniciales: Mensaje[]
  /** Solo se usa en perspectiva USER para verificar solicitud cerrada */
  cerrada?: boolean
}

const MAX_CHARS = 2000
const POLL_INTERVAL = 10_000

export function HiloMensajes({ solicitudId, perspectiva, mensajesIniciales, cerrada }: Props) {
  const [mensajes, setMensajes] = useState<Mensaje[]>(mensajesIniciales)
  const [texto, setTexto] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const apiBase = perspectiva === 'ADMIN'
    ? `/api/admin/solicitudes/${solicitudId}/mensajes`
    : `/api/solicitudes/${solicitudId}/mensajes`

  const cargar = useCallback(async () => {
    try {
      const res = await fetch(apiBase)
      if (res.ok) setMensajes(await res.json())
    } catch { /* silent */ }
  }, [apiBase])

  useEffect(() => {
    pollRef.current = setInterval(cargar, POLL_INTERVAL)
    return () => { if (pollRef.current) clearInterval(pollRef.current) }
  }, [cargar])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [mensajes])

  async function enviar(e: React.FormEvent) {
    e.preventDefault()
    const t = texto.trim()
    if (!t || enviando) return
    setError(null)
    setEnviando(true)
    try {
      const res = await fetch(apiBase, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contenido: t }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Error al enviar'); return }
      setMensajes(prev => [...prev, data])
      setTexto('')
    } catch {
      setError('Error de conexión.')
    } finally {
      setEnviando(false)
    }
  }

  const puedeEnviar = !cerrada && texto.trim().length > 0 && texto.length <= MAX_CHARS

  return (
    <div className="flex flex-col">
      {/* Hilo */}
      <div className="space-y-3 max-h-96 overflow-y-auto pr-1 mb-4">
        {mensajes.length === 0 && (
          <p className="text-sm text-gray-400 text-center py-6">
            Aún no hay mensajes. Puedes escribir tu consulta abajo.
          </p>
        )}
        {mensajes.map(m => {
          const esMio = m.autorRol === perspectiva
          return (
            <div key={m.id} className={`flex ${esMio ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm ${
                esMio
                  ? 'bg-brand-600 text-white rounded-tr-sm'
                  : 'bg-gray-100 text-gray-800 rounded-tl-sm'
              }`}>
                <p className="whitespace-pre-wrap break-words">{m.contenido}</p>
                <p className={`text-xs mt-1 ${esMio ? 'text-blue-200' : 'text-gray-400'}`}>
                  {new Date(m.createdAt).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                  {' · '}
                  {new Date(m.createdAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
                  {esMio && !m.leido && perspectiva === 'USER' && <span className="ml-1">·</span>}
                </p>
              </div>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      {!cerrada && (
        <form onSubmit={enviar} className="space-y-2">
          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">{error}</p>
          )}
          <div className="flex gap-2 items-end">
            <div className="flex-1">
              <textarea
                value={texto}
                onChange={e => setTexto(e.target.value)}
                rows={2}
                maxLength={MAX_CHARS}
                placeholder="Escribe tu mensaje…"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-brand-300"
                onKeyDown={e => {
                  if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); enviar(e as any) }
                }}
              />
              <p className="text-xs text-gray-400 text-right">{texto.length}/{MAX_CHARS}</p>
            </div>
            <button
              type="submit"
              disabled={!puedeEnviar || enviando}
              className="btn-primary text-sm px-4 py-2 disabled:opacity-50 shrink-0"
            >
              {enviando ? '…' : 'Enviar'}
            </button>
          </div>
          <p className="text-xs text-gray-400">Ctrl+Enter para enviar rápido</p>
        </form>
      )}

      {cerrada && (
        <p className="text-xs text-gray-400 text-center">Esta solicitud está cerrada — no se pueden enviar más mensajes.</p>
      )}
    </div>
  )
}
