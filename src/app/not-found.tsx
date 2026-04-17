import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4 text-center">
      <p className="text-8xl font-bold text-brand-100 select-none">404</p>
      <h1 className="text-2xl font-bold text-gray-900 mt-2 mb-2">Página no encontrada</h1>
      <p className="text-gray-500 mb-8 max-w-sm">
        La página que buscas no existe. Si tenías una referencia de seguimiento, usa el buscador de abajo.
      </p>
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <Link href="/" className="btn-primary">Ir al inicio</Link>
        <Link href="/seguimiento" className="btn-secondary">Buscar mi solicitud</Link>
      </div>
    </div>
  )
}
