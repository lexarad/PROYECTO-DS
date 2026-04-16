'use client'

import { useState } from 'react'

interface ApiKey {
  id: string
  nombre: string
  keyPrefix: string
  activa: boolean
  lastUsedAt: Date | null
  createdAt: Date
}

interface Props {
  initialKeys: ApiKey[]
}

export function GestorApiKeys({ initialKeys }: Props) {
  const [keys, setKeys] = useState(initialKeys)
  const [nombre, setNombre] = useState('')
  const [loading, setLoading] = useState(false)
  const [nuevaKey, setNuevaKey] = useState<string | null>(null)
  const [copiada, setCopiada] = useState(false)

  async function crear() {
    if (!nombre.trim()) return
    setLoading(true)
    const res = await fetch('/api/keys', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nombre }),
    })
    const data = await res.json()
    setLoading(false)
    if (res.ok) {
      setNuevaKey(data.key)
      setNombre('')
      setKeys((prev) => [{ id: Date.now().toString(), nombre: data.nombre, keyPrefix: data.keyPrefix, activa: true, lastUsedAt: null, createdAt: new Date() }, ...prev])
    }
  }

  async function revocar(id: string) {
    await fetch(`/api/keys/${id}`, { method: 'DELETE' })
    setKeys((prev) => prev.filter((k) => k.id !== id))
  }

  async function toggleActiva(id: string) {
    await fetch(`/api/keys/${id}`, { method: 'PATCH' })
    setKeys((prev) => prev.map((k) => k.id === id ? { ...k, activa: !k.activa } : k))
  }

  function copiar(text: string) {
    navigator.clipboard.writeText(text)
    setCopiada(true)
    setTimeout(() => setCopiada(false), 2000)
  }

  return (
    <div className="space-y-6">
      {/* Key recién creada */}
      {nuevaKey && (
        <div className="card p-4 border-green-300 bg-green-50">
          <p className="text-sm font-semibold text-green-800 mb-2">
            API key creada. Cópiala ahora — no la volverás a ver.
          </p>
          <div className="flex items-center gap-2">
            <code className="flex-1 text-xs bg-white border border-green-200 px-3 py-2 rounded font-mono break-all">
              {nuevaKey}
            </code>
            <button
              onClick={() => copiar(nuevaKey)}
              className="btn-secondary text-xs py-2 px-3 shrink-0"
            >
              {copiada ? '✓ Copiada' : 'Copiar'}
            </button>
          </div>
          <button onClick={() => setNuevaKey(null)} className="text-xs text-green-700 hover:underline mt-2">
            He guardado la clave, ocultar
          </button>
        </div>
      )}

      {/* Crear nueva */}
      <div className="card p-5">
        <h2 className="font-semibold mb-4">Nueva API key</h2>
        <div className="flex gap-3">
          <input
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder="Nombre descriptivo (ej: Mi app)"
            className="input text-sm flex-1"
            onKeyDown={(e) => e.key === 'Enter' && crear()}
          />
          <button onClick={crear} disabled={loading || !nombre.trim()} className="btn-primary text-sm py-2 px-4">
            {loading ? 'Creando...' : 'Crear'}
          </button>
        </div>
      </div>

      {/* Lista */}
      {keys.length > 0 && (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Nombre</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Prefijo</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Último uso</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Estado</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {keys.map((k) => (
                <tr key={k.id} className={!k.activa ? 'opacity-50' : ''}>
                  <td className="px-4 py-3 font-medium">{k.nombre}</td>
                  <td className="px-4 py-3 font-mono text-xs text-gray-500">{k.keyPrefix}...</td>
                  <td className="px-4 py-3 text-gray-500">
                    {k.lastUsedAt ? new Date(k.lastUsedAt).toLocaleDateString('es-ES') : 'Nunca'}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${k.activa ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      {k.activa ? 'Activa' : 'Inactiva'}
                    </span>
                  </td>
                  <td className="px-4 py-3 flex items-center gap-3 justify-end">
                    <button onClick={() => toggleActiva(k.id)} className="text-xs text-gray-500 hover:text-gray-700">
                      {k.activa ? 'Desactivar' : 'Activar'}
                    </button>
                    <button onClick={() => revocar(k.id)} className="text-xs text-red-500 hover:text-red-700">
                      Revocar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {keys.length === 0 && !nuevaKey && (
        <p className="text-sm text-gray-400 text-center py-8">No hay API keys. Crea una para empezar.</p>
      )}
    </div>
  )
}
