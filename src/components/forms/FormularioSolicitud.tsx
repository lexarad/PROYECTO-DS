'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { CertificadoConfig } from '@/types'

interface Props {
  config: CertificadoConfig
}

interface Step {
  titulo: string | undefined
  campos: CertificadoConfig['campos']
}

function buildSteps(config: CertificadoConfig): Step[] {
  const secciones: Step[] = []
  for (const campo of config.campos) {
    const last = secciones[secciones.length - 1]
    if (!last || last.titulo !== campo.seccion) {
      secciones.push({ titulo: campo.seccion, campos: [campo] })
    } else {
      last.campos.push(campo)
    }
  }
  return secciones
}

function ProgressBar({ current, total }: { current: number; total: number }) {
  if (total <= 1) return null
  const pct = Math.round(((current + 1) / (total + 1)) * 100)
  return (
    <div className="mb-6 space-y-1.5">
      <div className="flex justify-between text-xs text-gray-400">
        <span>Paso {current + 1} de {total + 1}</span>
        <span>{pct}%</span>
      </div>
      <div className="w-full bg-gray-100 rounded-full h-1.5">
        <div
          className="bg-brand-600 h-1.5 rounded-full transition-all duration-300"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}

export function FormularioSolicitud({ config }: Props) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const formRef = useRef<HTMLFormElement>(null)

  const [stepIndex, setStepIndex] = useState(0)
  const [values, setValues] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [promoInput, setPromoInput] = useState('')
  const [promoAplicado, setPromoAplicado] = useState<{ codigo: string; descuento: number } | null>(null)
  const [promoError, setPromoError] = useState('')
  const [promoLoading, setPromoLoading] = useState(false)
  const [showPromo, setShowPromo] = useState(false)
  const [precioActual, setPrecioActual] = useState(config.precio)
  const [descuentoPlan, setDescuentoPlan] = useState(0)

  const steps = buildSteps(config)
  // Last "step" = resumen/pago
  const totalSteps = steps.length // data steps; +1 for the pay step rendered separately
  const isLastDataStep = stepIndex === totalSteps - 1
  const isPayStep = stepIndex === totalSteps

  useEffect(() => {
    if (status === 'loading') return
    fetch(`/api/precios/${config.tipo}`)
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data) {
          setPrecioActual(data.precio)
          setDescuentoPlan(data.descuento ?? 0)
        }
      })
      .catch(() => {})
  }, [config.tipo, status])

  const precioFinal = promoAplicado
    ? +(precioActual * (1 - promoAplicado.descuento / 100)).toFixed(2)
    : precioActual

  async function aplicarPromo() {
    setPromoLoading(true)
    setPromoError('')
    const res = await fetch('/api/promo/validar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ codigo: promoInput }),
    })
    const data = await res.json()
    if (res.ok) {
      setPromoAplicado({ codigo: data.codigo, descuento: data.descuento })
    } else {
      setPromoError(data.error ?? 'Código no válido')
    }
    setPromoLoading(false)
  }

  function handleFieldChange(name: string, value: string) {
    setValues(v => ({ ...v, [name]: value }))
  }

  function validateCurrentStep(): boolean {
    if (!formRef.current) return true
    const step = steps[stepIndex]
    if (!step) return true
    for (const campo of step.campos) {
      if (!campo.requerido) continue
      const val = (values[campo.nombre] ?? '').trim()
      if (!val) {
        const el = formRef.current.elements.namedItem(campo.nombre) as HTMLInputElement | null
        el?.focus()
        el?.reportValidity()
        return false
      }
    }
    return true
  }

  function nextStep() {
    if (!validateCurrentStep()) return
    setError('')
    setStepIndex(i => i + 1)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function prevStep() {
    setError('')
    setStepIndex(i => Math.max(0, i - 1))
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    setLoading(true)

    // Merge form values with collected state
    const form = new FormData(e.currentTarget)
    const datos: Record<string, string> = { ...values }
    config.campos.forEach(campo => {
      const v = form.get(campo.nombre) as string | null
      if (v) datos[campo.nombre] = v
    })

    try {
      if (session) {
        const res = await fetch('/api/solicitudes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tipo: config.tipo, datos, codigoPromo: promoAplicado?.codigo }),
        })
        if (!res.ok) {
          const data = await res.json()
          setError(data.error || 'Error al enviar la solicitud.')
        } else {
          router.push('/dashboard?solicitado=1')
        }
      } else {
        const email = (form.get('email_invitado') as string) || values['email_invitado']
        if (!email) {
          setError('Introduce tu email para continuar.')
          setLoading(false)
          return
        }
        const res = await fetch('/api/invitado/checkout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tipo: config.tipo, datos, email, codigoPromo: promoAplicado?.codigo }),
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

  const currentStep = steps[stepIndex]

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="space-y-6" noValidate>
      <ProgressBar current={stepIndex} total={totalSteps} />

      {/* Data steps */}
      {!isPayStep && currentStep && (
        <div className="space-y-4">
          {currentStep.titulo && (
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide border-b border-gray-100 pb-1.5">
              {currentStep.titulo}
            </h3>
          )}
          {currentStep.campos.map(campo => (
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
                  value={values[campo.nombre] ?? ''}
                  onChange={e => handleFieldChange(campo.nombre, e.target.value)}
                  className="input resize-none"
                />
              ) : campo.tipo === 'select' ? (
                <select
                  id={campo.nombre}
                  name={campo.nombre}
                  required={campo.requerido}
                  value={values[campo.nombre] ?? ''}
                  onChange={e => handleFieldChange(campo.nombre, e.target.value)}
                  className="input"
                >
                  <option value="">Selecciona una opción</option>
                  {campo.opciones?.map(op => (
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
                  value={values[campo.nombre] ?? ''}
                  onChange={e => handleFieldChange(campo.nombre, e.target.value)}
                  className="input"
                />
              )}
            </div>
          ))}
        </div>
      )}

      {/* Pay / summary step */}
      {isPayStep && (
        <div className="space-y-5">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide border-b border-gray-100 pb-1.5">
            Confirmar y pagar
          </h3>

          {/* Resumen campos */}
          <div className="bg-gray-50 rounded-lg px-4 py-3 space-y-2 text-sm">
            {config.campos.map(campo => {
              const val = values[campo.nombre]
              if (!val) return null
              return (
                <div key={campo.nombre} className="flex justify-between gap-4">
                  <span className="text-gray-500 flex-shrink-0">{campo.label}</span>
                  <span className="text-gray-800 font-medium text-right">{val}</span>
                </div>
              )
            })}
          </div>

          {!session && (
            <div className="space-y-3">
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
                  value={values['email_invitado'] ?? ''}
                  onChange={e => handleFieldChange('email_invitado', e.target.value)}
                  className="input"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Recibirás la confirmación del pedido y el seguimiento de tu solicitud.
                </p>
              </div>
              <div className="bg-blue-50 border border-blue-100 rounded-lg px-4 py-3 text-sm text-blue-800">
                ¿Ya tienes cuenta?{' '}
                <Link href="/auth/login" className="font-semibold underline">
                  Inicia sesión
                </Link>{' '}
                para gestionar todas tus solicitudes.
              </div>
            </div>
          )}

          {/* Código promocional */}
          <div className="border-t pt-4">
            {!showPromo && !promoAplicado && (
              <button
                type="button"
                onClick={() => setShowPromo(true)}
                className="text-sm text-brand-600 hover:underline"
              >
                ¿Tienes un código de descuento?
              </button>
            )}

            {showPromo && !promoAplicado && (
              <div>
                <label className="label text-sm">Código de descuento</label>
                <div className="flex gap-2">
                  <input
                    value={promoInput}
                    onChange={e => setPromoInput(e.target.value.toUpperCase())}
                    onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), aplicarPromo())}
                    placeholder="BIENVENIDA10"
                    className="input flex-1 font-mono"
                  />
                  <button
                    type="button"
                    onClick={aplicarPromo}
                    disabled={promoLoading || !promoInput}
                    className="btn-secondary text-sm px-4 disabled:opacity-50"
                  >
                    {promoLoading ? '...' : 'Aplicar'}
                  </button>
                </div>
                {promoError && <p className="text-xs text-red-600 mt-1">{promoError}</p>}
              </div>
            )}

            {promoAplicado && (
              <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-lg px-3 py-2">
                <p className="text-sm text-green-800 font-semibold">
                  Código <span className="font-mono">{promoAplicado.codigo}</span> — {promoAplicado.descuento}% de descuento
                </p>
                <button
                  type="button"
                  onClick={() => { setPromoAplicado(null); setPromoInput(''); setShowPromo(false) }}
                  className="text-xs text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>
            )}
          </div>

          {/* Precio final */}
          <div className="border-t pt-4 flex items-center justify-between">
            <span className="text-gray-600 font-medium">Total</span>
            <div className="text-right">
              {(promoAplicado || descuentoPlan > 0) && (
                <p className="text-sm text-gray-400 line-through">{config.precio.toFixed(2)} €</p>
              )}
              <p className="text-2xl font-bold text-brand-700">{precioFinal.toFixed(2)} €</p>
            </div>
          </div>
        </div>
      )}

      {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}

      {/* Navigation */}
      <div className={`flex gap-3 pt-2 ${stepIndex > 0 ? 'justify-between' : 'justify-end'}`}>
        {stepIndex > 0 && (
          <button type="button" onClick={prevStep} className="btn-secondary px-5">
            ← Anterior
          </button>
        )}

        {!isPayStep ? (
          <button
            type="button"
            onClick={nextStep}
            className="btn-primary px-6 ml-auto"
          >
            {isLastDataStep ? 'Revisar y pagar →' : 'Siguiente →'}
          </button>
        ) : (
          <button type="submit" disabled={loading} className="btn-primary flex-1 text-base py-3">
            {loading
              ? 'Procesando...'
              : session
                ? `Solicitar por ${precioFinal.toFixed(2)} €`
                : `Pagar ${precioFinal.toFixed(2)} € y solicitar`}
          </button>
        )}
      </div>
    </form>
  )
}
