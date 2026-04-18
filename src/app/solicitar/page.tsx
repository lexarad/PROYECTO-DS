import Link from 'next/link'
import { CERTIFICADOS } from '@/lib/certificados'
import { CatalogoBusqueda } from '@/components/ui/CatalogoBusqueda'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Solicitar certificado online',
  description: 'Elige el certificado que necesitas. Registro Civil, Antecedentes Penales, Vida Laboral, Empadronamiento. Sin desplazamientos.',
}

export default function SolicitarPage() {
  const certs = CERTIFICADOS.map((c) => ({
    tipo: c.tipo,
    label: c.label,
    descripcion: c.descripcion,
    precio: c.precio,
  }))

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="text-xl font-bold text-brand-700">CertiDocs</Link>
          <Link href="/auth/login" className="text-sm text-gray-600 hover:text-gray-900">Mi área</Link>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">¿Qué certificado necesitas?</h1>
          <p className="text-gray-500">Selecciona el documento y te lo tramitamos. Puedes pagar sin crear cuenta.</p>
        </div>

        <CatalogoBusqueda certificados={certs} />

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
