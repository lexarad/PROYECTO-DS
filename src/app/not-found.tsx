import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="text-center">
        <p className="text-8xl font-bold text-brand-100">404</p>
        <h1 className="text-2xl font-bold text-gray-900 mt-2 mb-3">Página no encontrada</h1>
        <p className="text-gray-500 mb-8">La página que buscas no existe o ha sido movida.</p>
        <div className="flex items-center justify-center gap-4">
          <Link href="/" className="btn-primary">Ir al inicio</Link>
          <Link href="/solicitar" className="btn-secondary">Ver certificados</Link>
        </div>
      </div>
    </div>
  )
}
