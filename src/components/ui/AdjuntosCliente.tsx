'use client'

import { useState, useRef } from 'react'

interface Adjunto {
  id: string
  nombre: string
  url: string
  tipo: string
  tamanio: number
  createdAt: string
}

interface Props {
  solicitudId: string
  adjuntosIniciales: Adjunto[]
}

const MAX_PER_SOLICITUD = 5

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

function FileIcon({ tipo }: { tipo: string }) {
  if (tipo === 'application/pdf') return <span className="text-red-500">PDF</span>
  return <span className="text-blue-500">IMG</span>
}

export function AdjuntosCliente({ solicitudId, adjuntosIniciales }: Props) {
  const [adjuntos, setAdjuntos] = useState<Adjunto[]>(adjuntosIniciales)
  const [subiendo, setSubiendo] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [eliminando, setEliminando] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (inputRef.current) inputRef.current.value = ''

    setError(null)
    setSubiendo(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await fetch(`/api/solicitudes/${solicitudId}/adjuntos`, { method: 'POST', body: fd })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Error al subir el archivo'); return }
      setAdjuntos(prev => [...prev, data])
    } catch {
      setError('Error de conexión. Inténtalo de nuevo.')
    } finally {
      setSubiendo(false)
    }
  }

  async function handleDelete(adjuntoId: string) {
    setEliminando(adjuntoId)
    setError(null)
    try {
      const res = await fetch(`/api/solicitudes/${solicitudId}/adjuntos/${adjuntoId}`, { method: 'DELETE' })
      if (!res.ok) { const d = await res.json(); setError(d.error ?? 'Error al eliminar'); return }
      setAdjuntos(prev => prev.filter(a => a.id !== adjuntoId))
    } catch {
      setError('Error de conexión.')
    } finally {
      setEliminando(null)
    }
  }

  const puedeSeguirSubiendo = adjuntos.length < MAX_PER_SOLICITUD

  return (
    <div className="card p-6">
      <h2 className="font-semibold mb-1">Documentos de apoyo</h2>
      <p className="text-sm text-gray-500 mb-4">
        Adjunta una copia de tu DNI/NIF y cualquier documento que facilite la tramitación (máx. {MAX_PER_SOLICITUD} archivos, 10 MB cada uno). Formatos: PDF, JPG, PNG.
      </p>

      {error && (
        <div className="mb-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          {error}
        </div>
      )}

      {adjuntos.length > 0 && (
        <ul className="space-y-2 mb-4">
          {adjuntos.map(adj => (
            <li key={adj.id} className="flex items-center gap-3 py-2 border-b border-gray-100 last:border-0">
              <span className="text-xs font-mono font-semibold w-8 shrink-0">
                <FileIcon tipo={adj.tipo} />
              </span>
              <div className="flex-1 min-w-0">
                <a href={adj.url} target="_blank" rel="noreferrer"
                  className="text-sm font-medium text-brand-600 hover:underline truncate block">
                  {adj.nombre}
                </a>
                <p className="text-xs text-gray-400">{formatBytes(adj.tamanio)}</p>
              </div>
              <button
                onClick={() => handleDelete(adj.id)}
                disabled={eliminando === adj.id}
                className="text-xs text-red-500 hover:text-red-700 disabled:opacity-50 shrink-0"
              >
                {eliminando === adj.id ? '…' : 'Eliminar'}
              </button>
            </li>
          ))}
        </ul>
      )}

      {adjuntos.length === 0 && (
        <p className="text-sm text-gray-400 mb-4">Aún no has adjuntado ningún documento.</p>
      )}

      {puedeSeguirSubiendo && (
        <label className={`btn-secondary text-sm cursor-pointer inline-flex items-center gap-2 ${subiendo ? 'opacity-60 pointer-events-none' : ''}`}>
          <input
            ref={inputRef}
            type="file"
            accept=".pdf,.jpg,.jpeg,.png,.webp,.heic"
            className="hidden"
            onChange={handleUpload}
            disabled={subiendo}
          />
          {subiendo ? (
            <>
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
              Subiendo…
            </>
          ) : (
            <>
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              Subir documento
            </>
          )}
        </label>
      )}

      {!puedeSeguirSubiendo && (
        <p className="text-xs text-gray-400">Has alcanzado el máximo de {MAX_PER_SOLICITUD} archivos.</p>
      )}
    </div>
  )
}
