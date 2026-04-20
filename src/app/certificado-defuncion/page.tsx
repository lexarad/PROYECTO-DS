import type { Metadata } from 'next'
import Link from 'next/link'
import { JsonLd } from '@/components/ui/JsonLd'

export const metadata: Metadata = {
  title: 'Certificado de Defunción online — CertiDocs',
  description: 'Solicita el certificado de defunción del Registro Civil online sin desplazamientos. Imprescindible para herencias y trámites tras el fallecimiento. Desde 9,90 €.',
  keywords: ['certificado de defuncion', 'registro civil defuncion', 'certificado defuncion online', 'solicitar certificado defuncion'],
  openGraph: {
    title: 'Certificado de Defunción online — Sin colas, desde 9,90 €',
    description: 'Tramitamos el certificado de defunción del Registro Civil. Imprescindible para herencias, seguros y últimas voluntades.',
    url: 'https://certidocs-xi.vercel.app/certificado-defuncion',
    siteName: 'CertiDocs',
    locale: 'es_ES',
    type: 'website',
  },
}

const USOS = [
  { icono: '⚖️', titulo: 'Tramitar la herencia', desc: 'Primer paso imprescindible para iniciar cualquier proceso sucesorio ante notaría.' },
  { icono: '📋', titulo: 'Certificado de Últimas Voluntades', desc: 'Es requisito previo para obtener el certificado de testamento del Ministerio de Justicia.' },
  { icono: '🛡️', titulo: 'Reclamar seguros de vida', desc: 'Las aseguradoras lo exigen junto al certificado de seguros de fallecimiento.' },
  { icono: '🏦', titulo: 'Cancelar cuentas bancarias', desc: 'Los bancos lo requieren para la gestión de cuentas y fondos del fallecido.' },
  { icono: '🏠', titulo: 'Transmisión de inmuebles', desc: 'Notarías y Registro de la Propiedad lo solicitan para formalizar la herencia.' },
  { icono: '💰', titulo: 'Pensión de viudedad', desc: 'La Seguridad Social lo exige para tramitar la pensión de viudedad u orfandad.' },
]

const TIPOS = [
  { tipo: 'Literal', desc: 'Copia íntegra del acta de defunción. Es el más completo e incluye todos los datos de la inscripción.', cuando: 'Herencias, notarías, seguros.' },
  { tipo: 'Extracto', desc: 'Resumen con los datos esenciales del fallecimiento. Válido para trámites administrativos.', cuando: 'Seguridad Social, trámites generales.' },
  { tipo: 'Plurilingüe', desc: 'Versión multilingüe reconocida en la UE. Evita apostillado para trámites internacionales.', cuando: 'Trámites en el extranjero.' },
]

const FAQS = [
  { q: '¿Cuánto tarda en llegar el certificado de defunción?', a: 'El plazo habitual es de 5 a 10 días hábiles desde la tramitación ante el Registro Civil.' },
  { q: '¿Puedo solicitarlo siendo familiar del fallecido?', a: 'Sí. Cualquier persona con interés legítimo (familiar, heredero, representante legal) puede solicitarlo.' },
  { q: '¿Necesito saber en qué Registro Civil está inscrito?', a: 'No. Con el municipio y la fecha del fallecimiento podemos localizar el Registro Civil correspondiente.' },
  { q: '¿El certificado de defunción es diferente del de últimas voluntades?', a: 'Sí. El certificado de defunción acredita el fallecimiento. El de últimas voluntades indica si otorgó testamento. Para una herencia, normalmente necesitas ambos.' },
  { q: '¿Puedo solicitarlo desde el extranjero?', a: 'Sí. Puedes tramitarlo desde cualquier país. Solo necesitas los datos del fallecido y un email de contacto.' },
  { q: '¿Qué pasa si el fallecimiento fue en el extranjero?', a: 'En ese caso habría que gestionarlo ante el consulado español o el registro local. Contáctanos para casos especiales.' },
]

export default function CertificadoDefuncionPage() {
  const productLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: 'Certificado de Defunción online',
    description: 'Tramitación online del certificado de defunción del Registro Civil español.',
    offers: {
      '@type': 'Offer',
      price: '9.90',
      priceCurrency: 'EUR',
      availability: 'https://schema.org/InStock',
      seller: { '@type': 'Organization', name: 'CertiDocs' },
    },
  }

  const faqLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: FAQS.map(({ q, a }) => ({
      '@type': 'Question',
      name: q,
      acceptedAnswer: { '@type': 'Answer', text: a },
    })),
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      <JsonLd data={productLd} />
      <JsonLd data={faqLd} />

      <header className="border-b border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-950 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="text-xl font-bold text-brand-700">CertiDocs</Link>
          <div className="flex items-center gap-4">
            <Link href="/" className="text-sm text-gray-500 hover:text-gray-700 hidden sm:block">← Inicio</Link>
            <Link href="/solicitar/defuncion" className="btn-primary text-sm py-2 px-4">Solicitar ahora</Link>
          </div>
        </div>
      </header>

      <section className="max-w-5xl mx-auto px-4 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <span className="inline-block text-xs font-semibold text-brand-600 bg-brand-50 dark:bg-brand-950 px-3 py-1 rounded-full mb-4">Registro Civil · Desde 9,90 €</span>
            <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-4 leading-tight">
              Certificado de Defunción <span className="text-brand-600">online</span>
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-300 mb-6">
              Tramitamos el certificado de defunción del Registro Civil sin que tengas que desplazarte. Imprescindible para gestionar herencias, seguros y últimas voluntades.
            </p>
            <div className="flex gap-3 mb-8">
              <Link href="/solicitar/defuncion" className="btn-primary text-base px-8 py-3">Solicitar certificado →</Link>
            </div>
            <div className="flex flex-wrap gap-4 text-xs text-gray-500">
              <span>✓ Sin certificado digital</span>
              <span>✓ Válido en toda España</span>
              <span>✓ Reembolso garantizado</span>
            </div>
          </div>

          <div className="card p-6 space-y-4">
            <h2 className="font-semibold text-gray-700 dark:text-gray-300 text-sm uppercase tracking-wide">Resumen del servicio</h2>
            {[
              { label: 'Precio', value: '9,90 €' },
              { label: 'Plazo estimado', value: '5–10 días hábiles' },
              { label: 'Organismo', value: 'Registro Civil' },
              { label: 'Tipos disponibles', value: 'Literal · Extracto · Plurilingüe' },
              { label: 'Entrega', value: 'Por email (PDF oficial)' },
              { label: 'Pago', value: 'Tarjeta · Sin cuenta obligatoria' },
            ].map(({ label, value }) => (
              <div key={label} className="flex justify-between text-sm border-b border-gray-100 dark:border-gray-800 pb-3 last:border-0 last:pb-0">
                <span className="text-gray-500">{label}</span>
                <span className="font-medium text-gray-900 dark:text-gray-100 text-right">{value}</span>
              </div>
            ))}
            <Link href="/solicitar/defuncion" className="btn-primary w-full text-center text-sm py-2.5">Solicitar ahora →</Link>
          </div>
        </div>
      </section>

      {/* Pack herencia */}
      <section className="max-w-5xl mx-auto px-4 pb-10">
        <div className="rounded-2xl bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950 border border-blue-100 dark:border-blue-900 p-7 flex flex-col sm:flex-row items-start sm:items-center gap-6">
          <div className="flex-1">
            <span className="inline-block text-xs font-semibold text-indigo-600 bg-indigo-100 dark:bg-indigo-900 px-2 py-0.5 rounded-full mb-2">Pack herencia</span>
            <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-1">¿Tramitando una herencia?</h2>
            <p className="text-sm text-gray-600 dark:text-gray-300">Además del certificado de defunción, necesitarás el de Últimas Voluntades y el de Seguros de Fallecimiento.</p>
          </div>
          <div className="flex flex-col gap-2 flex-shrink-0">
            <Link href="/solicitar/ultimas_voluntades" className="btn-primary text-sm text-center px-5">Últimas Voluntades</Link>
            <Link href="/solicitar/seguros_fallecimiento" className="btn-secondary text-sm text-center px-5">Seguros Fallecimiento</Link>
          </div>
        </div>
      </section>

      <section className="bg-gray-50 dark:bg-gray-900 py-16">
        <div className="max-w-5xl mx-auto px-4">
          <h2 className="text-2xl font-bold mb-2 dark:text-gray-100">Tipos de certificado de defunción</h2>
          <p className="text-gray-500 mb-8">Elige el tipo adecuado para tu trámite en el formulario.</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {TIPOS.map((tipo) => (
              <div key={tipo.tipo} className="card p-6">
                <h3 className="font-bold text-gray-900 dark:text-gray-100 mb-2">{tipo.tipo}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">{tipo.desc}</p>
                <p className="text-xs text-brand-600 font-medium">Usado para: {tipo.cuando}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 max-w-5xl mx-auto px-4">
        <h2 className="text-2xl font-bold mb-2 dark:text-gray-100">¿Para qué necesitas el certificado de defunción?</h2>
        <p className="text-gray-500 mb-8">Es el primer documento que se necesita en casi todos los trámites tras un fallecimiento.</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {USOS.map((uso) => (
            <div key={uso.titulo} className="flex gap-4 p-5 rounded-xl border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900">
              <span className="text-2xl flex-shrink-0">{uso.icono}</span>
              <div>
                <h3 className="font-semibold text-sm text-gray-900 dark:text-gray-100 mb-1">{uso.titulo}</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">{uso.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-gray-50 dark:bg-gray-900 py-16">
        <div className="max-w-3xl mx-auto px-4">
          <h2 className="text-2xl font-bold mb-8 dark:text-gray-100">Preguntas frecuentes</h2>
          <div className="space-y-4">
            {FAQS.map(({ q, a }) => (
              <details key={q} className="card p-5 group cursor-pointer">
                <summary className="font-semibold text-sm text-gray-900 dark:text-gray-100 list-none flex items-center justify-between gap-4">
                  {q}
                  <span className="text-brand-600 text-lg flex-shrink-0 group-open:rotate-45 transition-transform">+</span>
                </summary>
                <p className="mt-3 text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-brand-600 py-14 text-center text-white">
        <div className="max-w-2xl mx-auto px-4">
          <h2 className="text-2xl font-bold mb-3">¿Necesitas el certificado de defunción?</h2>
          <p className="text-brand-100 mb-6">Te ahorramos el trámite. Formulario en 3 minutos, entrega por email.</p>
          <Link href="/solicitar/defuncion" className="bg-white text-brand-700 font-semibold px-8 py-3 rounded-lg hover:bg-brand-50 transition-colors inline-block">
            Solicitar ahora — 9,90 €
          </Link>
        </div>
      </section>

      <footer className="border-t border-gray-100 dark:border-gray-800 py-6 px-4 text-center text-xs text-gray-400">
        <Link href="/" className="hover:text-gray-600">CertiDocs</Link> · <Link href="/privacidad" className="hover:text-gray-600">Privacidad</Link> · <Link href="/terminos" className="hover:text-gray-600">Términos</Link>
      </footer>
    </div>
  )
}
