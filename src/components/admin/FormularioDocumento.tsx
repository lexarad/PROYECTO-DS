'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'

interface Props {
  solicitudId: string
}

export function FormularioDocumento({ solicitudId }: Props) {
  const router = useRouter()
  const fileRef = useRef<HTMLInputElement>(null)
  const [open, setOpen] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState<'idle' | 'uploading' | 'saving' | 'done'>('idle')
  const [error, setError] = useState('')

  function reset() {
    setFile(null)
    setProgress('idle')
    setError('')
    if (fileRef.current) fileRef.current.value = ''
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!file) return
    setError('')
    setUploading(true)
    setProgress('uploading')

    // 1. Upload file to Vercel Blob
    const formData = new FormData()
    formData.append('file', file)

    const uploadRes = await fetch('/api/admin/upload', { method: 'POST', body: formData })
    if (!uploadRes.ok) {
      const data = await uploadRes.json()
      setError(data.error ?? 'Error al subir el archivo')
      setUploading(false)
      setProgress('idle')
      return
    }
    const { url, nombre } = await uploadRes.json()

    setProgress('saving')

    // 2. Register document in DB
    const saveRes = await fetch(`/api/admin/solicitudes/${solicitudId}/documentos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nombre, url, tipo: file.type === 'application/pdf' ? 'PDF' : 'IMAGEN' }),
    })

    setUploading(false)

    if (!saveRes.ok) {
      setError('Archivo subido pero error al guardar. Contacta con soporte.')
      setProgress('idle')
      return
    }

    setProgress('done')
    setTimeout(() => {
      setOpen(false)
      reset()
      router.refresh()
    }, 1200)
  }

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="btn-secondary text-sm py-2 px-4">
        + Adjuntar certificado
      </button>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 border-t border-gray-100 pt-4">
      <p className="text-sm font-medium text-gray-700">Adjuntar certificado</p>

      <div
        className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
          file ? 'border-brand-400 bg-brand-50' : 'border-gray-300 hover:border-gray-400'
        }`}
        onClick={() => fileRef.current?.click()}
      >
        <input
          ref={fileRef}
          type="file"
          accept=".pdf,.jpg,.jpeg,.png"
          className="hidden"
          onChange={(e) => { setFile(e.target.files?.[0] ?? null); setError('') }}
        />
        {file ? (
          <div>
            <p className="text-sm font-medium text-brand-700">{file.name}</p>
            <p className="text-xs text-gray-400 mt-1">{(file.size / 1024).toFixed(0)} KB</p>
          </div>
        ) : (
          <div>
            <p className="text-sm text-gray-500">Haz clic para seleccionar el archivo</p>
            <p className="text-xs text-gray-400 mt-1">PDF, JPG o PNG · máx. 20 MB</p>
          </div>
        )}
      </div>

      {progress === 'uploading' && (
        <p className="text-xs text-blue-600 font-medium">Subiendo archivo...</p>
      )}
      {progress === 'saving' && (
        <p className="text-xs text-blue-600 font-medium">Guardando...</p>
      )}
      {progress === 'done' && (
        <p className="text-xs text-green-600 font-medium">Documento añadido correctamente.</p>
      )}
      {error && <p className="text-xs text-red-600">{error}</p>}

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={!file || uploading}
          className="btn-primary text-sm py-2 px-4 disabled:opacity-50"
        >
          {uploading ? 'Subiendo...' : 'Subir certificado'}
        </button>
        <button
          type="button"
          onClick={() => { setOpen(false); reset() }}
          className="btn-secondary text-sm py-2 px-4"
        >
          Cancelar
        </button>
      </div>
    </form>
  )
}
