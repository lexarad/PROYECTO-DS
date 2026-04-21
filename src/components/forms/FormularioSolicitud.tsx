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
  const [values, setValues] = useState<Record<string, string>>(() => {
    if (typeof window === 'undefined') return {}
    try {
      const raw = sessionStorage.getItem('ocr_prefill')
      if (!raw) return {}
      const { campos } = JSON.parse(raw) as { campos: Record<string, string>; email: string }
      return campos ?? {}
    } catch { return {} }
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [promoInput, setPromoInput] = useState('')
  const [promoAplicado, setPromoAplicado] = useState<{ codigo: string; descuento: number } | null>(null)
  const [promoError, setPromoError] = useState('')
  const [promoLoading, setPromoLoading] = useState(false)
  const [showPromo, setShowPromo] = useState(false)
  const [precioActual, setPrecioActual] = useState(config.precio)
  const [descuentoPlan, setDescuentoPlan] = useState(0)
  const [metodoEntrega, setMetodoEntrega] = useState<'email' | 'postal' | null>(null)

  const steps = buildSteps(config)
  // Last "step" = resumen/pago
  const totalSteps = steps.length // data steps; +1 for the pay step rendered separately
  const isLastDataStep = stepIndex === totalSteps - 1
  const isPayStep = stepIndex === totalSteps

  // Clear OCR prefill from sessionStorage after reading (one-time use)
  useEffect(() => {
    sessionStorage.removeItem('ocr_prefill')
  }, [])

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

  // Returns { label, updates } for each copy action available in a section
  function getCopyActions(titulo: string | undefined): Array<{ label: string; updates: Record<string, string> }> {
    const actions: Array<{ label: string; updates: Record<string, string> }> = []
    const v = values

    const SECCIONES_INSCRITO = [
      'Datos del inscrito',
      'Datos del fallecido',
      'Datos del empadronado',
      'Datos personales',
    ]

    if (titulo && SECCIONES_INSCRITO.includes(titulo)) {
      // Offer to fill inscrito from solicitante
      if (v.solNombre?.trim() || v.solApellido1?.trim()) {
        const upd: Record<string, string> = {}
        if (v.solNombre) upd.nombre = v.solNombre
        if (v.solApellido1) upd.apellido1 = v.solApellido1
        if (v.solApellido2) upd.apellido2 = v.solApellido2
        if (v.solDni) upd.dni = v.solDni
        actions.push({ label: 'Soy yo — copiar mis datos', updates: upd })
      }
    }

    if (titulo === 'Tus datos (solicitante)') {
      // Offer to fill solicitante from inscrito
      if (v.nombre?.trim() || v.apellido1?.trim()) {
        const upd: Record<string, string> = {}
        if (v.nombre) upd.solNombre = v.nombre
        if (v.apellido1) upd.solApellido1 = v.apellido1
        if (v.apellido2) upd.solApellido2 = v.apellido2
        if (v.dni) upd.solDni = v.dni
        actions.push({ label: 'Copiar datos del inscrito', updates: upd })
      }
    }

    if (titulo === 'Datos del cónyuge 1' && v.solNombre?.trim()) {
      const upd: Record<string, string> = {}
      if (v.solNombre) upd.c1Nombre = v.solNombre
      if (v.solApellido1) upd.c1Apellido1 = v.solApellido1
      if (v.solApellido2) upd.c1Apellido2 = v.solApellido2
      actions.push({ label: 'Soy yo (cónyuge 1)', updates: upd })
    }

    if (titulo === 'Datos del cónyuge 2' && v.solNombre?.trim()) {
      const upd: Record<string, string> = {}
      if (v.solNombre) upd.c2Nombre = v.solNombre
      if (v.solApellido1) upd.c2Apellido1 = v.solApellido1
      if (v.solApellido2) upd.c2Apellido2 = v.solApellido2
      actions.push({ label: 'Soy yo (cónyuge 2)', updates: upd })
    }

    return actions
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

    if (!metodoEntrega) {
      setError('Selecciona el método de entrega.')
      setLoading(false)
      return
    }
    datos['metodo_entrega'] = metodoEntrega
    if (metodoEntrega === 'postal') {
      const requiredPostal = ['postal_nombre', 'postal_direccion', 'postal_cp', 'postal_ciudad']
      for (const k of requiredPostal) {
        const v = (form.get(k) as string | null)?.trim() ?? values[k]?.trim() ?? ''
        if (!v) {
          setError('Completa todos los campos de dirección postal.')
          setLoading(false)
          return
        }
        datos[k] = v
      }
      const pais = (form.get('postal_pais') as string | null)?.trim() ?? values['postal_pais']?.trim()
      datos['postal_pais'] = pais || 'España'
    }

    try {
      if (session) {
        const res = await fetch('/api/checkout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tipo: config.tipo, datos, codigoPromo: promoAplicado?.codigo }),
        })
        const data = await res.json()
        if (!res.ok) {
          setError(data.error || 'Error al procesar el pago.')
        } else {
          window.location.href = data.url
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
          {currentStep.titulo && (() => {
            const copyActions = getCopyActions(currentStep.titulo)
            return (
              <div className="flex items-center justify-between gap-3 border-b border-gray-100 pb-1.5">
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
                  {currentStep.titulo}
                </h3>
                {copyActions.map(({ label, updates }) => (
                  <button
                    key={label}
                    type="button"
                    onClick={() => setValues(v => ({ ...v, ...updates }))}
                    className="flex-shrink-0 text-xs text-brand-600 hover:text-brand-800 font-medium bg-brand-50 hover:bg-brand-100 dark:bg-brand-950 dark:hover:bg-brand-900 px-2.5 py-1 rounded-full transition-colors"
                  >
                    ↕ {label}
                  </button>
                ))}
              </div>
            )
          })()}
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

          {/* Método de entrega */}
          <div className="space-y-3">
            <p className="text-sm font-semibold text-gray-600">Método de entrega</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {([
                { value: 'email', icon: '📧', titulo: 'Por email', desc: 'PDF oficial en tu bandeja de entrada' },
                { value: 'postal', icon: '📬', titulo: 'Correo postal', desc: 'Documento físico a tu domicilio' },
              ] as const).map(({ value, icon, titulo, desc }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setMetodoEntrega(value)}
                  className={`flex items-start gap-3 p-4 rounded-xl border-2 text-left transition-colors ${
                    metodoEntrega === value
                      ? 'border-brand-600 bg-brand-50 dark:bg-brand-950'
                      : metodoEntrega === null
                        ? 'border-gray-200 dark:border-gray-700 hover:border-brand-400 hover:bg-brand-50/30'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                  }`}
                >
                  <span className="text-xl mt-0.5">{icon}</span>
                  <div>
                    <p className={`text-sm font-semibold ${metodoEntrega === value ? 'text-brand-700' : 'text-gray-800 dark:text-gray-200'}`}>{titulo}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{desc}</p>
                  </div>
                </button>
              ))}
            </div>

            {metodoEntrega === null && (
              <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                Elige cómo quieres recibir el certificado antes de continuar.
              </p>
            )}

            {metodoEntrega === 'postal' && (
              <div className="space-y-3 pt-1">
                <div>
                  <label htmlFor="postal_nombre" className="label">Nombre del destinatario <span className="text-red-500">*</span></label>
                  <input id="postal_nombre" name="postal_nombre" type="text" className="input" placeholder="Nombre completo"
                    value={values['postal_nombre'] ?? ''} onChange={e => handleFieldChange('postal_nombre', e.target.value)} />
                </div>
                <div>
                  <label htmlFor="postal_direccion" className="label">Dirección <span className="text-red-500">*</span></label>
                  <input id="postal_direccion" name="postal_direccion" type="text" className="input" placeholder="Calle, número, piso, puerta"
                    value={values['postal_direccion'] ?? ''} onChange={e => handleFieldChange('postal_direccion', e.target.value)} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="postal_cp" className="label">Código postal <span className="text-red-500">*</span></label>
                    <input id="postal_cp" name="postal_cp" type="text" className="input" placeholder="08001"
                      value={values['postal_cp'] ?? ''} onChange={e => handleFieldChange('postal_cp', e.target.value)} />
                  </div>
                  <div>
                    <label htmlFor="postal_ciudad" className="label">Ciudad <span className="text-red-500">*</span></label>
                    <input id="postal_ciudad" name="postal_ciudad" type="text" className="input" placeholder="Barcelona"
                      value={values['postal_ciudad'] ?? ''} onChange={e => handleFieldChange('postal_ciudad', e.target.value)} />
                  </div>
                </div>
                <div>
                  <label htmlFor="postal_pais" className="label">País</label>
                  <input id="postal_pais" name="postal_pais" type="text" className="input" placeholder="España"
                    value={values['postal_pais'] ?? ''} onChange={e => handleFieldChange('postal_pais', e.target.value)} />
                </div>
                <p className="text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
                  El envío postal puede añadir 3–5 días hábiles al plazo de entrega.
                </p>
              </div>
            )}
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
          <button type="submit" disabled={loading || !metodoEntrega} className="btn-primary flex-1 text-base py-3 disabled:opacity-50">
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
