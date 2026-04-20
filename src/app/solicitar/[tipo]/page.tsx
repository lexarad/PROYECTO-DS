import { notFound } from 'next/navigation'
import { Metadata } from 'next'
import { getCertificado } from '@/lib/certificados'
import { FormularioSolicitud } from '@/components/forms/FormularioSolicitud'
import { JsonLd } from '@/components/ui/JsonLd'
import Link from 'next/link'

interface Props {
  params: { tipo: string }
  searchParams: { cancelado?: string }
}

const TIEMPOS: Record<string, string> = {
  NACIMIENTO: '5–10 días hábiles',
  MATRIMONIO: '5–10 días hábiles',
  DEFUNCION: '5–10 días hábiles',
  EMPADRONAMIENTO: '3–5 días hábiles',
  ANTECEDENTES_PENALES: '24–48 horas',
  VIDA_LABORAL: '24–48 horas',
  ULTIMAS_VOLUNTADES: '10–15 días hábiles',
  SEGUROS_FALLECIMIENTO: '10–15 días hábiles',
}

const ORGANISMOS: Record<string, string> = {
  NACIMIENTO: 'Registro Civil',
  MATRIMONIO: 'Registro Civil',
  DEFUNCION: 'Registro Civil',
  EMPADRONAMIENTO: 'Ayuntamiento',
  ANTECEDENTES_PENALES: 'Ministerio de Justicia',
  VIDA_LABORAL: 'Seguridad Social',
  ULTIMAS_VOLUNTADES: 'Ministerio de Justicia',
  SEGUROS_FALLECIMIENTO: 'Ministerio de Justicia',
}

export function generateMetadata({ params }: Props): Metadata {
  const config = getCertificado(params.tipo.toUpperCase())
  if (!config) return {}
  const desc = `Solicita tu ${config.label} online sin desplazamientos. ${config.descripcion} Precio: ${config.precio.toFixed(2)} €.`
  return {
    title: `${config.label} online — CertiDocs`,
    description: desc,
    openGraph: {
      title: `${config.label} online`,
      description: desc,
      url: `https://certidocs-xi.vercel.app/solicitar/${params.tipo}`,
      siteName: 'CertiDocs',
      locale: 'es_ES',
      type: 'website',
    },
  }
}

export default function SolicitarTipoPage({ params, searchParams }: Props) {
  const config = getCertificado(params.tipo.toUpperCase())
  if (!config) notFound()

  const plazo = TIEMPOS[config.tipo] ?? 'Variable'
  const organismo = ORGANISMOS[config.tipo] ?? 'Organismo oficial'

  const productLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: config.label,
    description: config.descripcion,
    offers: {
      '@type': 'Offer',
      price: config.precio.toFixed(2),
      priceCurrency: 'EUR',
      availability: 'https://schema.org/InStock',
      seller: { '@type': 'Organization', name: 'CertiDocs' },
    },
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <JsonLd data={productLd} />
      <header className="bg-white border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="text-xl font-bold text-brand-700">CertiDocs</Link>
          <Link href="/solicitar" className="text-sm text-gray-500 hover:text-gray-700">← Volver</Link>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-12">
        {searchParams.cancelado && (
          <div className="mb-6 bg-amber-50 border border-amber-200 text-amber-800 text-sm px-4 py-3 rounded-lg">
            El pago fue cancelado. Tus datos se han conservado — vuelve a enviar el formulario cuando quieras continuar.
          </div>
        )}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Formulario */}
          <div className="lg:col-span-2">
            <div className="mb-6">
              <p className="text-sm text-gray-400 mb-1">Solicitar certificado</p>
              <h1 className="text-3xl font-bold mb-2">{config.label}</h1>
              <p className="text-gray-500">{config.descripcion}</p>
            </div>

            <div className="card p-8">
              <FormularioSolicitud config={config} />
            </div>
          </div>

          {/* Panel lateral */}
          <div className="space-y-4">
            {/* Resumen */}
            <div className="card p-5">
              <h2 className="font-semibold mb-4 text-sm text-gray-500 uppercase tracking-wide">Resumen</h2>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Precio</span>
                  <span className="font-bold text-brand-600 text-base">{config.precio.toFixed(2)} €</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Plazo estimado</span>
                  <span className="font-medium">{plazo}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Organismo</span>
                  <span className="font-medium text-right">{organismo}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Entrega</span>
                  <span className="font-medium">Email o correo postal</span>
                </div>
              </div>
            </div>

            {/* Garantías */}
            <div className="card p-5 space-y-3 text-sm">
              <h2 className="font-semibold text-sm text-gray-500 uppercase tracking-wide">Incluye</h2>
              {[
                '✓ Gestión completa del trámite',
                '✓ Seguimiento en tiempo real',
                '✓ Reembolso si no podemos tramitarlo',
                '✓ Confirmación por email al pagar',
              ].map((item) => (
                <p key={item} className="text-gray-600">{item}</p>
              ))}
            </div>

            {/* Seguridad */}
            <div className="text-xs text-gray-400 text-center space-y-1 px-2">
              <p>🔒 Pago seguro con Stripe</p>
              <p>Puedes pagar sin crear cuenta</p>
            </div>
          </div>

        </div>
      </main>
    </div>
  )
}
