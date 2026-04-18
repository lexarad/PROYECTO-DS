'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

export function CookieBanner() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const consent = localStorage.getItem('cookie-consent')
    if (!consent) setVisible(true)
  }, [])

  const accept = () => {
    localStorage.setItem('cookie-consent', 'accepted')
    setVisible(false)
  }

  const reject = () => {
    localStorage.setItem('cookie-consent', 'rejected')
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4">
      <div className="max-w-3xl mx-auto bg-white border border-gray-200 rounded-xl shadow-lg px-6 py-4 flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <p className="text-sm text-gray-600 flex-1">
          Usamos cookies técnicas necesarias para el funcionamiento del servicio.{' '}
          <Link href="/privacidad" className="underline text-brand-600 hover:text-brand-700">
            Política de privacidad
          </Link>
        </p>
        <div className="flex gap-2 flex-shrink-0">
          <button
            onClick={reject}
            className="text-sm text-gray-500 border border-gray-200 px-4 py-1.5 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Rechazar
          </button>
          <button
            onClick={accept}
            className="text-sm font-medium bg-brand-600 text-white px-4 py-1.5 rounded-lg hover:bg-brand-700 transition-colors"
          >
            Aceptar
          </button>
        </div>
      </div>
    </div>
  )
}
