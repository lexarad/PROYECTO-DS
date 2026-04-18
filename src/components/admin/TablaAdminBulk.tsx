'use client'

import { useState } from 'react'
import Link from 'next/link'
import { EstadoBadge } from '@/components/ui/EstadoBadge'
import { useRouter } from 'next/navigation'

type Solicitud = {
  id: string
  referencia: string | null
  tipo: string
  estado: string
  precio: number
  pagado: boolean
  createdAt: Date
  user: { name: string | null; email: string } | null
  emailInvitado: string | null
  _count?: { mensajes: number }
}

const ESTADOS_BULK = [
  { value: 'EN_PROCESO', label: 'En proceso' },
  { value: 'TRAMITADO', label: 'Tramitado' },
  { value: 'COMPLETADA', label: 'Completada' },
  { value: 'RECHAZADA', label: 'Rechazada' },
]

export function TablaAdminBulk({ solicitudes }: { solicitudes: Solicitud[] }) {
  const router = useRouter()
  const [seleccionadas, setSeleccionadas] = useState<Set<string>>(new Set())
  const [estadoBulk, setEstadoBulk] = useState('TRAMITADO')
  const [aplicando, setAplicando] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)

  const toggleTodas = () => {
    if (seleccionadas.size === solicitudes.length) {
      setSeleccionadas(new Set())
    } else {
      setSeleccionadas(new Set(solicitudes.map((s) => s.id)))
    }
  }

  const toggle = (id: string) => {
    const next = new Set(seleccionadas)
    next.has(id) ? next.delete(id) : next.add(id)
    setSeleccionadas(next)
  }

  async function aplicarBulk() {
    if (!seleccionadas.size) return
    setAplicando(true)
    setMsg(null)
    const res = await fetch('/api/admin/solicitudes/bulk', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids: Array.from(seleccionadas), estado: estadoBulk }),
    })
    const data = await res.json()
    if (res.ok) {
      setMsg(`${data.actualizadas} solicitud${data.actualizadas !== 1 ? 'es' : ''} actualizadas a ${estadoBulk}`)
      setSeleccionadas(new Set())
      router.refresh()
    } else {
      setMsg(`Error: ${data.error}`)
    }
    setAplicando(false)
  }

  return (
    <div>
      {/* Toolbar bulk */}
      {seleccionadas.size > 0 && (
        <div className="mb-3 flex items-center gap-3 bg-brand-50 border border-brand-200 rounded-lg px-4 py-2.5">
          <span className="text-sm font-semibold text-brand-800">
            {seleccionadas.size} seleccionada{seleccionadas.size !== 1 ? 's' : ''}
          </span>
          <select
            value={estadoBulk}
            onChange={(e) => setEstadoBulk(e.target.value)}
            className="text-sm border border-gray-200 rounded-lg px-2 py-1"
          >
            {ESTADOS_BULK.map((e) => (
              <option key={e.value} value={e.value}>{e.label}</option>
            ))}
          </select>
          <button
            onClick={aplicarBulk}
            disabled={aplicando}
            className="btn-primary text-sm py-1.5 px-4 disabled:opacity-50"
          >
            {aplicando ? 'Aplicando...' : 'Aplicar cambio'}
          </button>
          <button onClick={() => setSeleccionadas(new Set())} className="text-sm text-gray-500 hover:text-gray-700">
            Cancelar
          </button>
        </div>
      )}

      {msg && (
        <div className="mb-3 text-sm bg-green-50 border border-green-200 text-green-800 px-4 py-2 rounded-lg">
          {msg}
        </div>
      )}

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 w-8">
                <input
                  type="checkbox"
                  checked={seleccionadas.size === solicitudes.length && solicitudes.length > 0}
                  onChange={toggleTodas}
                  className="rounded"
                />
              </th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Referencia</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Tipo</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600 hidden md:table-cell">Cliente</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600 hidden lg:table-cell">Fecha</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Precio</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Estado</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {solicitudes.length === 0 && (
              <tr>
                <td colSpan={8} className="text-center py-12 text-gray-400">
                  No hay solicitudes con los filtros aplicados.
                </td>
              </tr>
            )}
            {solicitudes.map((s) => (
              <tr
                key={s.id}
                className={`hover:bg-gray-50 transition-colors ${seleccionadas.has(s.id) ? 'bg-brand-50/40' : ''}`}
              >
                <td className="px-4 py-3">
                  <input
                    type="checkbox"
                    checked={seleccionadas.has(s.id)}
                    onChange={() => toggle(s.id)}
                    className="rounded"
                  />
                </td>
                <td className="px-4 py-3 font-mono text-xs text-gray-700">{s.referencia}</td>
                <td className="px-4 py-3">{s.tipo.replace(/_/g, ' ')}</td>
                <td className="px-4 py-3 hidden md:table-cell">
                  <p>{s.user?.name ?? '—'}</p>
                  <p className="text-xs text-gray-400">{s.user?.email ?? s.emailInvitado ?? '—'}</p>
                </td>
                <td className="px-4 py-3 text-gray-500 hidden lg:table-cell">
                  {new Date(s.createdAt).toLocaleDateString('es-ES')}
                </td>
                <td className="px-4 py-3 font-semibold">{s.precio.toFixed(2)} €</td>
                <td className="px-4 py-3">
                  <EstadoBadge estado={s.estado as any} />
                </td>
                <td className="px-4 py-3 flex items-center gap-2">
                  <Link href={`/admin/solicitudes/${s.id}`} className="text-brand-600 hover:underline text-xs font-medium">
                    Gestionar →
                  </Link>
                  {(s._count?.mensajes ?? 0) > 0 && (
                    <span className="text-xs bg-red-100 text-red-700 font-bold px-1.5 py-0.5 rounded-full leading-none">
                      {s._count!.mensajes}
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
