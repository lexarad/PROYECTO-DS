'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function LoginPage() {
  const router = useRouter()
  const searchParams = typeof window !== 'undefined'
    ? new URLSearchParams(window.location.search) : null
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const form = new FormData(e.currentTarget)
    const result = await signIn('credentials', {
      email: form.get('email'),
      password: form.get('password'),
      redirect: false,
    })

    setLoading(false)

    if (result?.error) {
      setError('Email o contraseña incorrectos.')
    } else {
      router.push('/dashboard')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="card w-full max-w-md p-8">
        <Link href="/" className="text-xl font-bold text-brand-700 block mb-8 text-center">
          CertiDocs
        </Link>
        <h1 className="text-2xl font-bold mb-6 text-center">Iniciar sesión</h1>

        {searchParams?.get('registered') && (
          <p className="text-sm text-green-700 bg-green-50 px-3 py-2 rounded-lg mb-4 text-center">
            Cuenta creada. Ya puedes iniciar sesión.
          </p>
        )}
        {searchParams?.get('reset') && (
          <p className="text-sm text-green-700 bg-green-50 px-3 py-2 rounded-lg mb-4 text-center">
            Contraseña actualizada correctamente.
          </p>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="label">Email</label>
            <input id="email" name="email" type="email" required className="input" placeholder="tu@email.com" />
          </div>
          <div>
            <div className="flex items-center justify-between mb-1">
              <label htmlFor="password" className="label mb-0">Contraseña</label>
              <Link href="/auth/forgot-password" className="text-xs text-brand-600 hover:underline">
                ¿Olvidaste la contraseña?
              </Link>
            </div>
            <input id="password" name="password" type="password" required className="input" placeholder="••••••••" />
          </div>

          {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}

          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-6">
          ¿No tienes cuenta?{' '}
          <Link href="/auth/registro" className="text-brand-600 hover:underline font-medium">
            Regístrate gratis
          </Link>
        </p>
      </div>
    </div>
  )
}
