'use client'

import { useState } from 'react'
import Link from 'next/link'

export default function ForgotPasswordPage() {
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    const form = new FormData(e.currentTarget)
    await fetch('/api/auth/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: form.get('email') }),
    })
    setLoading(false)
    setSent(true)
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="card w-full max-w-md p-8">
        <Link href="/" className="text-xl font-bold text-brand-700 block mb-8 text-center">CertiDocs</Link>
        <h1 className="text-2xl font-bold mb-2 text-center">¿Olvidaste tu contraseña?</h1>

        {sent ? (
          <div className="text-center">
            <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto my-6">
              <svg className="w-7 h-7 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <p className="text-gray-600 text-sm mb-6">
              Si ese email está registrado, recibirás un enlace para restablecer tu contraseña en los próximos minutos.
            </p>
            <Link href="/auth/login" className="text-brand-600 hover:underline text-sm">Volver al login</Link>
          </div>
        ) : (
          <>
            <p className="text-gray-500 text-sm mb-6 text-center">
              Introduce tu email y te enviaremos un enlace para restablecerla.
            </p>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="email" className="label">Email</label>
                <input id="email" name="email" type="email" required className="input" placeholder="tu@email.com" />
              </div>
              <button type="submit" disabled={loading} className="btn-primary w-full">
                {loading ? 'Enviando...' : 'Enviar enlace'}
              </button>
            </form>
            <p className="text-center text-sm text-gray-500 mt-6">
              <Link href="/auth/login" className="text-brand-600 hover:underline">← Volver al login</Link>
            </p>
          </>
        )}
      </div>
    </div>
  )
}
