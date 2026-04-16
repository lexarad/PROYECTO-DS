import Link from 'next/link'
import { CERTIFICADOS } from '@/lib/certificados'

export default function SolicitarPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="text-xl font-bold text-brand-700">CertiDocs</Link>
          <Link href="/dashboard" className="text-sm text-gray-600 hover:text-gray-900">Mi área</Link>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold mb-2">Solicitar certificado</h1>
        <p className="text-gray-500 mb-10">Selecciona el documento que necesitas.</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {CERTIFICADOS.map((cert) => (
            <Link
              key={cert.tipo}
              href={`/solicitar/${cert.tipo.toLowerCase()}`}
              className="card p-6 hover:shadow-md transition-shadow group"
            >
              <h2 className="font-semibold text-gray-900 group-hover:text-brand-600 transition-colors mb-2">
                {cert.label}
              </h2>
              <p className="text-sm text-gray-500 mb-4">{cert.descripcion}</p>
              <div className="flex items-center justify-between">
                <span className="text-brand-600 font-bold">{cert.precio.toFixed(2)} €</span>
                <span className="text-xs text-gray-400">→ Solicitar</span>
              </div>
            </Link>
          ))}
        </div>
      </main>
    </div>
  )
}
