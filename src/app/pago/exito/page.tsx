'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'

function ExitoContent() {
  const searchParams = useSearchParams()
  const ref = searchParams.get('ref')
  const esInvitado = searchParams.get('invitado') === '1'
  const sessionId = searchParams.get('session_id')
  const [verificado, setVerificado] = useState(false)

  useEffect(() => {
    if (!sessionId) return
    fetch(`/api/pagos/verificar?session_id=${encodeURIComponent(sessionId)}`)
      .then(r => r.json())
      .then(d => { if (d.pagado) setVerificado(true) })
      .catch(() => {})
  }, [sessionId])

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="card w-full max-w-md p-10 text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>

        <h1 className="text-2xl font-bold mb-2">Pago confirmado</h1>

        {ref && (
          <p className="text-sm text-gray-500 mb-1">
            Referencia: <span className="font-mono font-semibold">{ref}</span>
          </p>
        )}

        <p className="text-gray-500 text-sm mb-8">
          Hemos recibido tu pago y estamos tramitando tu solicitud. Recibirás un email de confirmación en breve.
        </p>

        {esInvitado && ref ? (
          <div className="space-y-3">
            <Link href={`/seguimiento/${ref}`} className="btn-primary w-full block">
              Seguir mi solicitud
            </Link>
            <p className="text-xs text-gray-500">
              Guarda tu referencia <span className="font-mono font-semibold">{ref}</span> para consultar el estado en cualquier momento.
            </p>
            <div className="border-t pt-3">
              <p className="text-sm text-gray-600">
                ¿Quieres gestionar solicitudes fácilmente?{' '}
                <Link href="/auth/registro" className="text-blue-600 font-semibold underline">
                  Crea una cuenta gratis
                </Link>
              </p>
            </div>
          </div>
        ) : (
          <Link href="/dashboard" className="btn-primary w-full">
            Ver mis solicitudes
          </Link>
        )}
      </div>
    </div>
  )
}

export default function PagoExitoPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500 text-sm">Confirmando pago...</div>
      </div>
    }>
      <ExitoContent />
    </Suspense>
  )
}
