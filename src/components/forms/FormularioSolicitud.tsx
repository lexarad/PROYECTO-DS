'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { CertificadoConfig } from '@/types'

interface Props {
  config: CertificadoConfig
}

export function FormularioSolicitud({ config }: Props) {
  const { data: session } = useSession()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()

    if (!session) {
      router.push('/auth/login')
      return
    }

    setError('')
    setLoading(true)

    const form = new FormData(e.currentTarget)
    const datos: Record<string, string> = {}
    config.campos.forEach((campo) => {
      datos[campo.nombre] = form.get(campo.nombre) as string
    })

    const res = await fetch('/api/solicitudes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tipo: config.tipo, datos }),
    })

    setLoading(false)

    if (!res.ok) {
      const data = await res.json()
      setError(data.error || 'Error al enviar la solicitud.')
    } else {
      router.push('/dashboard?solicitado=1')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {config.campos.map((campo) => (
        <div key={campo.nombre}>
          <label htmlFor={campo.nombre} className="label">
            {campo.label}
            {campo.requerido && <span className="text-red-500 ml-1">*</span>}
          </label>

          {campo.tipo === 'textarea' ? (
            <textarea
              id={campo.nombre}
              name={campo.nombre}
              required={campo.requerido}
              placeholder={campo.placeholder}
              rows={4}
              className="input resize-none"
            />
          ) : campo.tipo === 'select' ? (
            <select id={campo.nombre} name={campo.nombre} required={campo.requerido} className="input">
              <option value="">Selecciona una opción</option>
              {campo.opciones?.map((op) => (
                <option key={op} value={op}>{op}</option>
              ))}
            </select>
          ) : (
            <input
              id={campo.nombre}
              name={campo.nombre}
              type={campo.tipo}
              required={campo.requerido}
              placeholder={campo.placeholder}
              className="input"
            />
          )}
        </div>
      ))}

      {!session && (
        <p className="text-sm text-amber-700 bg-amber-50 px-4 py-3 rounded-lg">
          Necesitas una cuenta para continuar. Al enviar serás redirigido al login.
        </p>
      )}

      {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}

      <div className="pt-2">
        <button type="submit" disabled={loading} className="btn-primary w-full text-base py-3">
          {loading ? 'Enviando solicitud...' : `Solicitar por ${config.precio.toFixed(2)} €`}
        </button>
      </div>
    </form>
  )
}
