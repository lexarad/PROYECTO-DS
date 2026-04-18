'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function ReintentarJobBtn({ jobId }: { jobId: string }) {
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)
  const router = useRouter()

  async function reintentar() {
    setLoading(true)
    setMsg(null)
    try {
      const res = await fetch(`/api/admin/automatizacion/${jobId}`, { method: 'POST' })
      const data = await res.json()
      if (res.ok) {
        setMsg('Job relanzado correctamente')
        setTimeout(() => router.refresh(), 1500)
      } else {
        setMsg(data.error ?? 'Error al relanzar')
      }
    } catch {
      setMsg('Error de red')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        onClick={reintentar}
        disabled={loading}
        className="btn-primary text-sm px-4 py-1.5 disabled:opacity-50"
      >
        {loading ? 'Relanzando…' : 'Reintentar job'}
      </button>
      {msg && (
        <span className={`text-xs ${msg.includes('correctamente') ? 'text-green-600' : 'text-red-600'}`}>
          {msg}
        </span>
      )}
    </div>
  )
}
