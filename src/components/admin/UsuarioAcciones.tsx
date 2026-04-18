'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Props {
  userId: string
  roleActual: string
  planActual: string
}

const ROLES  = ['USER', 'ADMIN']
const PLANES = ['FREE', 'PRO', 'ENTERPRISE']

export function UsuarioAcciones({ userId, roleActual, planActual }: Props) {
  const router = useRouter()
  const [role, setRole]       = useState(roleActual)
  const [plan, setPlan]       = useState(planActual)
  const [saving, setSaving]   = useState(false)
  const [msg, setMsg]         = useState('')
  const [error, setError]     = useState('')

  const dirty = role !== roleActual || plan !== planActual

  async function guardar() {
    setSaving(true)
    setMsg('')
    setError('')
    const res = await fetch(`/api/admin/usuarios/${userId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role, plan }),
    })
    const data = await res.json()
    if (res.ok) {
      setMsg('Cambios guardados')
      router.refresh()
    } else {
      setError(data.error ?? 'Error al guardar')
    }
    setSaving(false)
  }

  return (
    <div className="flex flex-col gap-3 min-w-[220px]">
      <div className="card p-4 space-y-3">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Gestionar cuenta</p>

        <div>
          <label className="label text-xs">Rol</label>
          <select
            value={role}
            onChange={e => setRole(e.target.value)}
            className="input text-sm"
          >
            {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>

        <div>
          <label className="label text-xs">Plan</label>
          <select
            value={plan}
            onChange={e => setPlan(e.target.value)}
            className="input text-sm"
          >
            {PLANES.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>

        {msg   && <p className="text-xs text-green-600">{msg}</p>}
        {error && <p className="text-xs text-red-600">{error}</p>}

        <button
          onClick={guardar}
          disabled={saving || !dirty}
          className="btn-primary w-full text-sm py-2 disabled:opacity-50"
        >
          {saving ? 'Guardando...' : 'Guardar cambios'}
        </button>
      </div>
    </div>
  )
}
