'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Suspense } from 'react'

function ResetForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token')

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')

    const form = new FormData(e.currentTarget)
    const password = form.get('password') as string
    const confirm = form.get('confirm') as string

    if (password !== confirm) {
      setError('Las contraseñas no coinciden.')
      return
    }

    setLoading(true)
    const res = await fetch('/api/auth/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, password }),
    })
    const data = await res.json()
    setLoading(false)

    if (!res.ok) {
      setError(data.error || 'Error al restablecer la contraseña.')
    } else {
      router.push('/auth/login?reset=1')
    }
  }

  if (!token) {
    return (
      <p className="text-red-600 text-sm text-center">
        Enlace inválido.{' '}
        <Link href="/auth/forgot-password" className="underline">Solicita uno nuevo</Link>.
      </p>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="password" className="label">Nueva contraseña</label>
        <input id="password" name="password" type="password" required minLength={8} className="input" placeholder="Mínimo 8 caracteres" />
      </div>
      <div>
        <label htmlFor="confirm" className="label">Confirmar contraseña</label>
        <input id="confirm" name="confirm" type="password" required className="input" placeholder="Repite la contraseña" />
      </div>
      {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
      <button type="submit" disabled={loading} className="btn-primary w-full">
        {loading ? 'Guardando...' : 'Guardar nueva contraseña'}
      </button>
    </form>
  )
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="card w-full max-w-md p-8">
        <Link href="/" className="text-xl font-bold text-brand-700 block mb-8 text-center">CertiDocs</Link>
        <h1 className="text-2xl font-bold mb-6 text-center">Nueva contraseña</h1>
        <Suspense fallback={<p className="text-center text-gray-400 text-sm">Cargando...</p>}>
          <ResetForm />
        </Suspense>
      </div>
    </div>
  )
}
