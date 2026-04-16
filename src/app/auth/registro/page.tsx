'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function RegistroPage() {
  const router = useRouter()
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const form = new FormData(e.currentTarget)
    const password = form.get('password') as string
    const confirm = form.get('confirm') as string

    if (password !== confirm) {
      setError('Las contraseñas no coinciden.')
      setLoading(false)
      return
    }

    const res = await fetch('/api/auth/registro', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: form.get('name'),
        email: form.get('email'),
        password,
      }),
    })

    const data = await res.json()
    setLoading(false)

    if (!res.ok) {
      setError(data.error || 'Error al crear la cuenta.')
    } else {
      router.push('/auth/login?registered=1')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="card w-full max-w-md p-8">
        <Link href="/" className="text-xl font-bold text-brand-700 block mb-8 text-center">
          CertiDocs
        </Link>
        <h1 className="text-2xl font-bold mb-6 text-center">Crear cuenta</h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="name" className="label">Nombre completo</label>
            <input id="name" name="name" type="text" required className="input" placeholder="Tu nombre" />
          </div>
          <div>
            <label htmlFor="email" className="label">Email</label>
            <input id="email" name="email" type="email" required className="input" placeholder="tu@email.com" />
          </div>
          <div>
            <label htmlFor="password" className="label">Contraseña</label>
            <input id="password" name="password" type="password" required minLength={8} className="input" placeholder="Mínimo 8 caracteres" />
          </div>
          <div>
            <label htmlFor="confirm" className="label">Confirmar contraseña</label>
            <input id="confirm" name="confirm" type="password" required className="input" placeholder="Repite la contraseña" />
          </div>

          {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}

          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? 'Creando cuenta...' : 'Crear cuenta'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-6">
          ¿Ya tienes cuenta?{' '}
          <Link href="/auth/login" className="text-brand-600 hover:underline font-medium">
            Inicia sesión
          </Link>
        </p>
      </div>
    </div>
  )
}
