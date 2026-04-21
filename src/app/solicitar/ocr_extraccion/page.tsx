'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'

const TIPO_LABELS: Record<string, string> = {
  NACIMIENTO: 'Certificado de Nacimiento',
  MATRIMONIO: 'Certificado de Matrimonio',
  DEFUNCION: 'Certificado de Defunción',
  EMPADRONAMIENTO: 'Certificado de Empadronamiento',
  ANTECEDENTES_PENALES: 'Certificado de Antecedentes Penales',
  VIDA_LABORAL: 'Informe de Vida Laboral',
}

export default function OCRPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [resultado, setResultado] = useState('')
  const [tipoCertificado, setTipoCertificado] = useState('')
  const [campos, setCampos] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file || !email) return

    setLoading(true)
    setError('')
    setResultado('')
    setTipoCertificado('')
    setCampos({})

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
    setTipoCertificado(data.tipoCertificado ?? '')
    setCampos(data.campos ?? {})
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const f = e.dataTransfer.files[0]
    if (f) setFile(f)
  }

  function solicitarConDatos(tipo?: string) {
    const t = tipo ?? tipoCertificado
    if (!t) return
    sessionStorage.setItem('ocr_prefill', JSON.stringify({ campos, email }))
    router.push(`/solicitar/${t.toLowerCase()}`)
  }

  const tipoLabel = TIPO_LABELS[tipoCertificado] ?? tipoCertificado
  const tiposDisponibles = Object.entries(TIPO_LABELS)

  return (
    <div className="max-w-2xl mx-auto py-12 px-4">
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-2">Escanear documento</h1>
        <p className="text-gray-600 mb-1">
          Sube un certificado existente y extraemos los datos automáticamente para pre-rellenar tu solicitud.
        </p>
        <p className="text-sm text-gray-500">Formatos: JPG, PNG, PDF · Gratis</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="label">Tu email</label>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            className="input"
            placeholder="nombre@ejemplo.com"
          />
        </div>

        <div
          onDrop={handleDrop}
          onDragOver={e => e.preventDefault()}
          onClick={() => inputRef.current?.click()}
          className="border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl p-8 text-center cursor-pointer hover:border-brand-400 transition-colors"
        >
          {file ? (
            <div>
              <p className="text-sm font-semibold text-brand-600">📄 {file.name}</p>
              <p className="text-xs text-gray-400 mt-1">{(file.size / 1024).toFixed(0)} KB</p>
            </div>
          ) : (
            <>
              <p className="text-2xl mb-2">📂</p>
              <p className="text-gray-500 text-sm font-medium">Arrastra el documento aquí o haz clic para seleccionar</p>
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

        {error && <p className="text-red-600 text-sm bg-red-50 px-3 py-2 rounded-lg">{error}</p>}

        <button
          type="submit"
          disabled={loading || !file || !email}
          className="btn-primary w-full py-3 text-base disabled:opacity-50"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
              </svg>
              Extrayendo datos...
            </span>
          ) : 'Extraer datos del documento'}
        </button>
      </form>

      {resultado && (
        <div className="mt-8 space-y-5">
          {/* Detected type + CTA */}
          {tipoCertificado && (
            <div className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-xl p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold text-green-700 dark:text-green-400 uppercase tracking-wide mb-1">
                    Documento detectado
                  </p>
                  <p className="font-bold text-green-900 dark:text-green-100 text-lg">{tipoLabel}</p>
                  {Object.keys(campos).length > 0 && (
                    <p className="text-sm text-green-700 dark:text-green-400 mt-1">
                      {Object.keys(campos).length} campos extraídos y listos para pre-rellenar
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => solicitarConDatos()}
                  className="flex-shrink-0 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold px-4 py-2.5 rounded-lg transition-colors whitespace-nowrap"
                >
                  Solicitar con estos datos →
                </button>
              </div>

              {/* Preview of extracted campos */}
              {Object.keys(campos).length > 0 && (
                <div className="mt-4 grid grid-cols-2 gap-2">
                  {Object.entries(campos).map(([k, v]) => (
                    <div key={k} className="text-xs bg-white dark:bg-green-900 rounded-lg px-3 py-2">
                      <span className="text-green-600 dark:text-green-400 block capitalize">{k.replace(/([A-Z])/g, ' $1').toLowerCase()}</span>
                      <span className="font-semibold text-gray-800 dark:text-gray-100">{v}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Unknown type selector */}
          {!tipoCertificado && resultado && (
            <div className="bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-xl p-5">
              <p className="font-semibold text-amber-900 dark:text-amber-100 mb-1">No hemos podido detectar el tipo de certificado automáticamente.</p>
              <p className="text-sm text-amber-700 dark:text-amber-400 mb-4">¿A qué tipo de servicio deseas acceder?</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {tiposDisponibles.map(([tipo, label]) => (
                  <button
                    key={tipo}
                    type="button"
                    onClick={() => solicitarConDatos(tipo as string)}
                    className="text-left text-sm font-medium bg-white dark:bg-amber-900 border border-amber-200 dark:border-amber-700 rounded-lg px-4 py-3 hover:border-brand-500 hover:bg-brand-50 dark:hover:bg-brand-950 transition-colors"
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Full extracted text */}
          <div>
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">Texto completo extraído</h2>
            <pre className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-4 text-xs whitespace-pre-wrap font-mono text-gray-700 dark:text-gray-300 max-h-80 overflow-y-auto">
              {resultado}
            </pre>
          </div>
        </div>
      )}
    </div>
  )
}
