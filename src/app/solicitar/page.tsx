import Link from 'next/link'
import { CERTIFICADOS } from '@/lib/certificados'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Solicitar certificado online',
  description: 'Elige el certificado que necesitas. Registro Civil, Antecedentes Penales, Vida Laboral, Empadronamiento. Sin desplazamientos.',
}

const TIEMPOS: Record<string, string> = {
  NACIMIENTO: '5–10 días',
  MATRIMONIO: '5–10 días',
  DEFUNCION: '5–10 días',
  EMPADRONAMIENTO: '3–5 días',
  ANTECEDENTES_PENALES: '24–48 h',
  VIDA_LABORAL: '24–48 h',
  ULTIMAS_VOLUNTADES: '10–15 días',
  SEGUROS_FALLECIMIENTO: '10–15 días',
}

export default function SolicitarPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="text-xl font-bold text-brand-700">CertiDocs</Link>
          <Link href="/auth/login" className="text-sm text-gray-600 hover:text-gray-900">Mi área</Link>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-12">
        <div className="mb-10">
          <h1 className="text-3xl font-bold mb-2">¿Qué certificado necesitas?</h1>
          <p className="text-gray-500">Selecciona el documento y te lo tramitamos. Puedes pagar sin crear cuenta.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {CERTIFICADOS.map((cert) => (
            <Link
              key={cert.tipo}
              href={`/solicitar/${cert.tipo.toLowerCase()}`}
              className="card p-6 hover:shadow-md border border-transparent hover:border-brand-200 transition-all group flex flex-col"
            >
              <div className="flex-1">
                <h2 className="font-semibold text-gray-900 group-hover:text-brand-600 transition-colors mb-1.5">
                  {cert.label}
                </h2>
                <p className="text-sm text-gray-500 mb-4">{cert.descripcion}</p>
              </div>
              <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                <div>
                  <span className="text-brand-600 font-bold text-lg">{cert.precio.toFixed(2)} €</span>
                  <p className="text-xs text-gray-400 mt-0.5">Plazo: {TIEMPOS[cert.tipo]}</p>
                </div>
                <span className="text-xs font-medium text-brand-600 bg-brand-50 px-3 py-1.5 rounded-full group-hover:bg-brand-600 group-hover:text-white transition-colors">
                  Solicitar
                </span>
              </div>
            </Link>
          ))}
        </div>

        <div className="mt-10 bg-blue-50 border border-blue-100 rounded-xl p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="text-3xl">💡</div>
          <div>
            <p className="font-medium text-blue-900">No necesitas crear una cuenta</p>
            <p className="text-sm text-blue-700 mt-0.5">
              Puedes solicitar y pagar introduciendo solo tu email. Recibirás la confirmación y podrás hacer seguimiento con tu número de referencia.
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}
