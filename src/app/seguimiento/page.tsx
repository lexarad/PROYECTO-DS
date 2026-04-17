'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function SeguimientoIndexPage() {
  const router = useRouter()
  const [ref, setRef] = useState('')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const clean = ref.trim().toUpperCase()
    if (clean) router.push(`/seguimiento/${clean}`)
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white border-b border-gray-100">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="text-xl font-bold text-brand-700">CertiDocs</Link>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 py-16">
        <div className="w-full max-w-md">
          <div className="card p-8 text-center">
            <div className="w-14 h-14 bg-brand-50 rounded-full flex items-center justify-center mx-auto mb-5">
              <svg className="w-7 h-7 text-brand-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold mb-2">Seguimiento de solicitud</h1>
            <p className="text-gray-500 text-sm mb-8">
              Introduce tu número de referencia para consultar el estado de tu solicitud.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <input
                type="text"
                value={ref}
                onChange={(e) => setRef(e.target.value)}
                placeholder="CD-1234567890-ABCD"
                className="input text-center font-mono tracking-wider uppercase"
                required
              />
              <button type="submit" className="btn-primary w-full">
                Ver mi solicitud
              </button>
            </form>

            <p className="text-xs text-gray-400 mt-6">
              Puedes encontrar tu referencia en el email de confirmación de pago.
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}
