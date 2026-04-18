'use client'

import { useState } from 'react'

interface PromoResult {
  valido: boolean
  codigo?: string
  descuento?: number
  precioOriginal?: number
  precioFinal?: number
  ahorro?: number
  usosRestantes?: number | null
  error?: string
}

interface Props {
  solicitudId: string
  precio: number
}

export function BotonPago({ solicitudId, precio }: Props) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [promoAbierto, setPromoAbierto] = useState(false)
  const [codigoInput, setCodigoInput] = useState('')
  const [validandoPromo, setValidandoPromo] = useState(false)
  const [promoAplicada, setPromoAplicada] = useState<PromoResult | null>(null)
  const [promoError, setPromoError] = useState('')

  const precioFinal = promoAplicada?.precioFinal ?? precio

  async function validarPromo() {
    if (!codigoInput.trim()) return
    setValidandoPromo(true)
    setPromoError('')
    setPromoAplicada(null)

    const res = await fetch(
      `/api/promos/validar?codigo=${encodeURIComponent(codigoInput.trim())}&solicitudId=${solicitudId}`
    )
    const data: PromoResult = await res.json()
    setValidandoPromo(false)

    if (data.valido) {
      setPromoAplicada(data)
    } else {
      setPromoError(data.error ?? 'Código no válido')
    }
  }

  function quitarPromo() {
    setPromoAplicada(null)
    setCodigoInput('')
    setPromoError('')
  }

  async function handlePago() {
    setLoading(true)
    setError('')

    const res = await fetch('/api/pagos/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        solicitudId,
        codigoPromo: promoAplicada?.codigo ?? null,
      }),
    })

    const data = await res.json()
    setLoading(false)

    if (!res.ok) {
      setError(data.error || 'Error al iniciar el pago.')
      return
    }

    window.location.href = data.url
  }

  return (
    <div className="space-y-3">
      {/* Promo code section */}
      {!promoAplicada ? (
        <div>
          <button
            type="button"
            onClick={() => setPromoAbierto(v => !v)}
            className="text-sm text-purple-600 hover:underline"
          >
            {promoAbierto ? '▾ Ocultar código promocional' : '▸ ¿Tienes un código promocional?'}
          </button>

          {promoAbierto && (
            <div className="mt-2 flex gap-2">
              <input
                type="text"
                value={codigoInput}
                onChange={e => setCodigoInput(e.target.value.toUpperCase())}
                onKeyDown={e => e.key === 'Enter' && validarPromo()}
                placeholder="Código promo"
                className="flex-1 border border-gray-300 rounded px-3 py-2 text-sm uppercase tracking-wider focus:outline-none focus:border-purple-500"
                disabled={validandoPromo}
              />
              <button
                type="button"
                onClick={validarPromo}
                disabled={validandoPromo || !codigoInput.trim()}
                className="px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded border border-gray-300 disabled:opacity-50"
              >
                {validandoPromo ? '...' : 'Aplicar'}
              </button>
            </div>
          )}

          {promoError && (
            <p className="text-sm text-red-600 mt-1">{promoError}</p>
          )}
        </div>
      ) : (
        <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded px-3 py-2 text-sm">
          <span className="text-green-700 font-medium">
            🏷️ {promoAplicada.codigo} — {promoAplicada.descuento}% dto. · ahorras {promoAplicada.ahorro?.toFixed(2)} €
          </span>
          <button
            type="button"
            onClick={quitarPromo}
            className="text-gray-400 hover:text-red-500 ml-3 text-xs"
          >
            ✕ Quitar
          </button>
        </div>
      )}

      {/* Price display */}
      {promoAplicada && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-500 line-through">{precio.toFixed(2)} €</span>
          <span className="text-lg font-bold text-green-700">{precioFinal.toFixed(2)} €</span>
        </div>
      )}

      <button
        onClick={handlePago}
        disabled={loading}
        className="btn-primary w-full text-base py-3"
      >
        {loading
          ? 'Redirigiendo a pago...'
          : `Pagar ${precioFinal.toFixed(2)} € con tarjeta`}
      </button>

      {error && <p className="text-sm text-red-600 mt-2">{error}</p>}
      <p className="text-xs text-gray-400 mt-2 text-center">Pago seguro procesado por Stripe</p>
    </div>
  )
}
