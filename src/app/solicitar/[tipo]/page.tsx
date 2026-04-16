import { notFound } from 'next/navigation'
import { getCertificado } from '@/lib/certificados'
import { FormularioSolicitud } from '@/components/forms/FormularioSolicitud'
import Link from 'next/link'

interface Props {
  params: { tipo: string }
}

export default function SolicitarTipoPage({ params }: Props) {
  const config = getCertificado(params.tipo.toUpperCase())
  if (!config) notFound()

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-100">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="text-xl font-bold text-brand-700">CertiDocs</Link>
          <Link href="/solicitar" className="text-sm text-gray-500 hover:text-gray-700">← Volver</Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">{config.label}</h1>
          <p className="text-gray-500">{config.descripcion}</p>
          <p className="mt-3 text-brand-600 font-bold text-xl">{config.precio.toFixed(2)} €</p>
        </div>

        <div className="card p-8">
          <FormularioSolicitud config={config} />
        </div>
      </main>
    </div>
  )
}
