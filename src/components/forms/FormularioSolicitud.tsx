'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
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
    setError('')
    setLoading(true)

    const form = new FormData(e.currentTarget)
    const datos: Record<string, string> = {}
    config.campos.forEach((campo) => {
      datos[campo.nombre] = form.get(campo.nombre) as string
    })

    try {
      if (session) {
        // Usuario autenticado — flujo normal
        const res = await fetch('/api/solicitudes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tipo: config.tipo, datos }),
        })

        if (!res.ok) {
          const data = await res.json()
          setError(data.error || 'Error al enviar la solicitud.')
        } else {
          router.push('/dashboard?solicitado=1')
        }
      } else {
        // Invitado — crear solicitud + checkout en un paso
        const email = form.get('email_invitado') as string
        if (!email) {
          setError('Introduce tu email para continuar.')
          setLoading(false)
          return
        }

        const res = await fetch('/api/invitado/checkout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tipo: config.tipo, datos, email }),
        })

        const data = await res.json()

        if (!res.ok) {
          setError(data.error || 'Error al procesar la solicitud.')
        } else {
          window.location.href = data.url
        }
      }
    } catch {
      setError('Error de red. Comprueba tu conexión e inténtalo de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  // Group fields by section to render section headers
  const secciones: { titulo: string | undefined; campos: typeof config.campos }[] = []
  for (const campo of config.campos) {
    const last = secciones[secciones.length - 1]
    if (!last || last.titulo !== campo.seccion) {
      secciones.push({ titulo: campo.seccion, campos: [campo] })
    } else {
      last.campos.push(campo)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {secciones.map((seccion, si) => (
        <div key={si} className="space-y-4">
          {seccion.titulo && (
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide border-b border-gray-100 pb-1.5">
              {seccion.titulo}
            </h3>
          )}
          {seccion.campos.map((campo) => (
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
        </div>
      ))}

      {!session && (
        <div className="border-t pt-5 space-y-4">
          <div>
            <label htmlFor="email_invitado" className="label">
              Tu email <span className="text-red-500">*</span>
            </label>
            <input
              id="email_invitado"
              name="email_invitado"
              type="email"
              required
              placeholder="nombre@ejemplo.com"
              className="input"
            />
            <p className="text-xs text-gray-500 mt-1">
              Recibirás la confirmación del pedido y podrás hacer seguimiento de tu solicitud.
            </p>
          </div>

          <div className="bg-blue-50 border border-blue-100 rounded-lg px-4 py-3 text-sm text-blue-800">
            ¿Ya tienes cuenta?{' '}
            <Link href="/auth/login" className="font-semibold underline">
              Inicia sesión
            </Link>{' '}
            para gestionar todas tus solicitudes desde el panel.
          </div>
        </div>
      )}

      {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}

      <div className="pt-2">
        <button type="submit" disabled={loading} className="btn-primary w-full text-base py-3">
          {loading
            ? 'Procesando...'
            : session
              ? `Solicitar por ${config.precio.toFixed(2)} €`
              : `Pagar ${config.precio.toFixed(2)} € y solicitar`}
        </button>
      </div>
    </form>
  )
}
