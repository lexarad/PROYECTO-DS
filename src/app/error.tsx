'use client'

import Link from 'next/link'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <p className="text-8xl font-bold text-red-100">500</p>
        <h1 className="text-2xl font-bold text-gray-900 mt-2 mb-3">Algo ha ido mal</h1>
        <p className="text-gray-500 mb-2">Ha ocurrido un error inesperado. Estamos trabajando para solucionarlo.</p>
        {error.digest && (
          <p className="text-xs text-gray-400 font-mono mb-6">ID: {error.digest}</p>
        )}
        <div className="flex items-center justify-center gap-4">
          <button onClick={reset} className="btn-primary">Reintentar</button>
          <Link href="/" className="btn-secondary">Ir al inicio</Link>
        </div>
      </div>
    </div>
  )
}
