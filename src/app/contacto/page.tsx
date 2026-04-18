'use client'

import { useState } from 'react'
import Link from 'next/link'

export default function ContactoPage() {
  const [form, setForm] = useState({ nombre: '', email: '', asunto: '', mensaje: '' })
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const res = await fetch('/api/contacto', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    const data = await res.json()
    if (res.ok) {
      setSent(true)
    } else {
      setError(data.error ?? 'Error al enviar. Inténtalo de nuevo.')
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="text-xl font-bold text-brand-700">CertiDocs</Link>
          <Link href="/" className="text-sm text-gray-500 hover:text-gray-700">← Inicio</Link>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Contacto</h1>
          <p className="text-gray-500">¿Tienes alguna duda? Te respondemos en menos de 48 horas hábiles.</p>
        </div>

        {sent ? (
          <div className="card p-10 text-center">
            <div className="text-5xl mb-4">✉️</div>
            <h2 className="font-bold text-xl mb-2">Mensaje enviado</h2>
            <p className="text-gray-500 text-sm mb-6 max-w-sm mx-auto">
              Hemos recibido tu consulta. Te hemos enviado una confirmación por email y te responderemos en 24-48 horas.
            </p>
            <Link href="/" className="btn-primary text-sm px-6">Volver al inicio</Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <div className="card p-6">
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="label">Nombre <span className="text-red-500">*</span></label>
                      <input
                        value={form.nombre}
                        onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                        required
                        className="input"
                        placeholder="Tu nombre"
                      />
                    </div>
                    <div>
                      <label className="label">Email <span className="text-red-500">*</span></label>
                      <input
                        type="email"
                        value={form.email}
                        onChange={(e) => setForm({ ...form, email: e.target.value })}
                        required
                        className="input"
                        placeholder="tu@email.com"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="label">Asunto</label>
                    <input
                      value={form.asunto}
                      onChange={(e) => setForm({ ...form, asunto: e.target.value })}
                      className="input"
                      placeholder="Ej: Pregunta sobre mi solicitud"
                    />
                  </div>

                  <div>
                    <label className="label">Mensaje <span className="text-red-500">*</span></label>
                    <textarea
                      value={form.mensaje}
                      onChange={(e) => setForm({ ...form, mensaje: e.target.value })}
                      required
                      rows={5}
                      className="input resize-none"
                      placeholder="Describe tu consulta..."
                    />
                    <p className="text-xs text-gray-400 mt-1">{form.mensaje.length}/2000</p>
                  </div>

                  {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}

                  <button type="submit" disabled={loading} className="btn-primary w-full">
                    {loading ? 'Enviando...' : 'Enviar mensaje'}
                  </button>
                </form>
              </div>
            </div>

            <div className="space-y-4 text-sm">
              <div className="card p-5">
                <h3 className="font-semibold mb-3">Otras opciones</h3>
                <div className="space-y-3 text-gray-600">
                  <div>
                    <p className="font-medium">Seguimiento de solicitud</p>
                    <p className="text-xs text-gray-400 mb-1">Si tienes una referencia CD-XXXX</p>
                    <Link href="/seguimiento" className="text-brand-600 hover:underline text-xs">
                      Buscar mi solicitud →
                    </Link>
                  </div>
                  <div className="border-t pt-3">
                    <p className="font-medium">Email directo</p>
                    <a href="mailto:soporte@certidocs.es" className="text-brand-600 hover:underline text-xs">
                      soporte@certidocs.es
                    </a>
                  </div>
                </div>
              </div>

              <div className="card p-5 text-xs text-gray-500 space-y-2">
                <p className="font-semibold text-gray-700">Horario de atención</p>
                <p>Lunes a viernes: 9:00 – 18:00</p>
                <p>Respuesta en &lt;48h hábiles</p>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
