'use client'

import { useState, useRef } from 'react'

export default function OCRPage() {
  const [email, setEmail] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [resultado, setResultado] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [checkoutUrl, setCheckoutUrl] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file || !email) return

    setLoading(true)
    setError('')
    setResultado('')

    const formData = new FormData()
    formData.append('file', file)
    formData.append('email', email)

    const res = await fetch('/api/ocr', { method: 'POST', body: formData })
    const data = await res.json()

    setLoading(false)

    if (!res.ok) {
      setError(data.error ?? 'Error al procesar')
      return
    }

    setResultado(data.texto)
    setCheckoutUrl(data.checkoutUrl)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const f = e.dataTransfer.files[0]
    if (f) setFile(f)
  }

  return (
    <div className="max-w-2xl mx-auto py-12 px-4">
      <h1 className="text-2xl font-bold mb-2">Extracción de datos por OCR</h1>
      <p className="text-gray-600 mb-1">Sube un documento escaneado y extraemos automáticamente todos sus datos.</p>
      <p className="text-sm text-gray-500 mb-6">Formatos: JPG, PNG, PDF · Precio: <strong>4,90 €</strong></p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Tu email</label>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            className="w-full border rounded px-3 py-2 text-sm"
            placeholder="nombre@ejemplo.com"
          />
        </div>

        <div
          onDrop={handleDrop}
          onDragOver={e => e.preventDefault()}
          onClick={() => inputRef.current?.click()}
          className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:border-blue-400 transition"
        >
          {file ? (
            <p className="text-sm font-medium text-blue-600">{file.name}</p>
          ) : (
            <>
              <p className="text-gray-500 text-sm">Arrastra el documento aquí o haz clic para seleccionar</p>
              <p className="text-xs text-gray-400 mt-1">JPG, PNG o PDF (máx. 10 MB)</p>
            </>
          )}
          <input
            ref={inputRef}
            type="file"
            accept=".jpg,.jpeg,.png,.pdf"
            className="hidden"
            onChange={e => setFile(e.target.files?.[0] ?? null)}
          />
        </div>

        {error && <p className="text-red-600 text-sm">{error}</p>}

        <button
          type="submit"
          disabled={loading || !file || !email}
          className="w-full bg-blue-600 text-white py-2 rounded font-medium disabled:opacity-50 hover:bg-blue-700 transition"
        >
          {loading ? 'Procesando...' : 'Extraer datos — 4,90 €'}
        </button>
      </form>

      {resultado && (
        <div className="mt-8 space-y-4">
          <h2 className="font-semibold">Datos extraídos</h2>
          <pre className="bg-gray-50 border rounded p-4 text-sm whitespace-pre-wrap">{resultado}</pre>
          {checkoutUrl && (
            <a
              href={checkoutUrl}
              className="block w-full text-center bg-green-600 text-white py-2 rounded font-medium hover:bg-green-700 transition"
            >
              Pagar 4,90 € y descargar resultado
            </a>
          )}
        </div>
      )}
    </div>
  )
}
