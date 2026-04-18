'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Props {
  jobId: string
  solicitudRef?: string
}

export function ResolverManualModal({ jobId, solicitudRef }: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const [refOrganismo, setRefOrganismo] = useState('')
  const [nota, setNota] = useState('')
  const [actualizarSolicitud, setActualizarSolicitud] = useState<'TRAMITADO' | 'COMPLETADA' | ''>('TRAMITADO')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!nota.trim()) return

    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/admin/automatizacion/${jobId}/resolver`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          refOrganismo: refOrganismo.trim() || undefined,
          nota: nota.trim(),
          actualizarSolicitud: actualizarSolicitud || null,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? 'Error al resolver el job')
      } else {
        setSuccess(true)
        setTimeout(() => {
          setOpen(false)
          router.refresh()
        }, 1200)
      }
    } catch {
      setError('Error de red')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="text-sm text-green-700 font-medium bg-green-50 px-4 py-2 rounded-lg">
        Job resuelto manualmente
      </div>
    )
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="btn-secondary text-sm px-4 py-1.5 border-orange-300 text-orange-700 hover:bg-orange-50"
      >
        Resolver manualmente
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div>
                <h2 className="font-semibold text-gray-900">Resolución manual del job</h2>
                {solicitudRef && (
                  <p className="text-xs text-gray-400 mt-0.5 font-mono">{solicitudRef}</p>
                )}
              </div>
              <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-600 text-xl leading-none">
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
              <div>
                <label className="label">Referencia del organismo / MJ</label>
                <input
                  type="text"
                  className="input font-mono"
                  placeholder="p.ej. MJ-2026-123456 (opcional)"
                  value={refOrganismo}
                  onChange={(e) => setRefOrganismo(e.target.value)}
                />
                <p className="text-xs text-gray-400 mt-1">
                  Número de expediente o referencia obtenida en la sede electrónica del Ministerio.
                </p>
              </div>

              <div>
                <label className="label">Nota de resolución <span className="text-red-500">*</span></label>
                <textarea
                  required
                  rows={3}
                  className="input resize-none"
                  placeholder="Describe qué hiciste y cuál fue el resultado. Se añadirá al historial de la solicitud."
                  value={nota}
                  onChange={(e) => setNota(e.target.value)}
                />
              </div>

              <div>
                <label className="label">Actualizar estado de la solicitud</label>
                <select
                  className="input"
                  value={actualizarSolicitud}
                  onChange={(e) => setActualizarSolicitud(e.target.value as 'TRAMITADO' | 'COMPLETADA' | '')}
                >
                  <option value="TRAMITADO">Enviada al organismo (TRAMITADO)</option>
                  <option value="COMPLETADA">Completada — certificado entregado (COMPLETADA)</option>
                  <option value="">No cambiar estado de la solicitud</option>
                </select>
              </div>

              {error && (
                <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
              )}

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="btn-secondary text-sm"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading || !nota.trim()}
                  className="btn-primary text-sm disabled:opacity-50"
                >
                  {loading ? 'Guardando...' : 'Marcar como resuelto'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
