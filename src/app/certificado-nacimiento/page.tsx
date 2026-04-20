import type { Metadata } from 'next'
import Link from 'next/link'
import { JsonLd } from '@/components/ui/JsonLd'

export const metadata: Metadata = {
  title: 'Certificado de Nacimiento online — CertiDocs',
  description: 'Solicita tu certificado de nacimiento del Registro Civil online sin desplazamientos. Literal, extracto o plurilingüe. Entrega en 5-10 días hábiles desde 9,90 €.',
  keywords: ['certificado de nacimiento', 'registro civil nacimiento', 'certificado nacimiento online', 'solicitar certificado nacimiento'],
  openGraph: {
    title: 'Certificado de Nacimiento online — Sin colas, desde 9,90 €',
    description: 'Tramitamos tu certificado de nacimiento del Registro Civil. Literal, extracto o plurilingüe. Sin certificado digital ni Cl@ve.',
    url: 'https://certidocs-xi.vercel.app/certificado-nacimiento',
    siteName: 'CertiDocs',
    locale: 'es_ES',
    type: 'website',
  },
}

const USOS = [
  { icono: '🪪', titulo: 'Renovación de DNI o pasaporte', desc: 'El Registro Civil te lo exige como documento acreditativo de identidad.' },
  { icono: '💍', titulo: 'Matrimonio civil o canónico', desc: 'Necesario para contraer matrimonio en España o en el extranjero.' },
  { icono: '🌍', titulo: 'Trámites en el extranjero', desc: 'Visados, residencia, trabajo o estudios fuera de España.' },
  { icono: '⚖️', titulo: 'Herencias y sucesiones', desc: 'Acredita parentesco y filiación ante notarías y bancos.' },
  { icono: '🎓', titulo: 'Homologación de títulos', desc: 'Requerido por universidades y entidades educativas extranjeras.' },
  { icono: '🏛️', titulo: 'Solicitud de nacionalidad', desc: 'Imprescindible para trámites de recuperación o adquisición de la nacionalidad española.' },
]

const TIPOS = [
  {
    tipo: 'Literal',
    desc: 'Copia íntegra de la inscripción tal como consta en el Registro Civil. Es el más completo e incluye todos los datos del acta.',
    cuando: 'Herencias, matrimonios, trámites notariales.',
  },
  {
    tipo: 'Extracto',
    desc: 'Resumen con los datos esenciales de la inscripción. Es el más solicitado para trámites administrativos ordinarios.',
    cuando: 'DNI, pasaporte, trámites generales.',
  },
  {
    tipo: 'Plurilingüe',
    desc: 'Versión multilingüe del extracto, reconocida en todos los países firmantes del Convenio de Viena. Evita apostillado en la UE.',
    cuando: 'Trámites en el extranjero, dentro de la UE.',
  },
]

const FAQS = [
  { q: '¿Cuánto tarda en llegar el certificado de nacimiento?', a: 'El plazo habitual es de 5 a 10 días hábiles desde que tramitamos la solicitud ante el Registro Civil correspondiente.' },
  { q: '¿Necesito saber en qué Registro Civil está inscrito?', a: 'No. Con el municipio y la fecha de nacimiento podemos localizar el Registro Civil competente.' },
  { q: '¿El certificado que recibiré es oficial?', a: 'Sí. Es el documento oficial expedido directamente por el Registro Civil, con todos los efectos legales.' },
  { q: '¿Puedo solicitarlo siendo extranjero o estando fuera de España?', a: 'Sí. Puedes solicitarlo desde cualquier país. Solo necesitas los datos de la persona inscrita y un email.' },
  { q: '¿Qué diferencia hay entre literal y extracto?', a: 'El literal es la copia íntegra del acta; el extracto contiene únicamente los datos esenciales. Para la mayoría de trámites, el extracto es suficiente.' },
  { q: '¿Puedo pedir el certificado de otra persona?', a: 'Sí, siempre que tengas interés legítimo (familiar directo, representación legal, herencias, etc.).' },
]

export default function CertificadoNacimientoPage() {
  const productLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: 'Certificado de Nacimiento online',
    description: 'Tramitación online del certificado de nacimiento del Registro Civil español.',
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

      {/* Nav */}
      <header className="border-b border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-950 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="text-xl font-bold text-brand-700">CertiDocs</Link>
          <div className="flex items-center gap-4">
            <Link href="/" className="text-sm text-gray-500 hover:text-gray-700 hidden sm:block">← Inicio</Link>
            <Link href="/solicitar/nacimiento" className="btn-primary text-sm py-2 px-4">Solicitar ahora</Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-5xl mx-auto px-4 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <span className="inline-block text-xs font-semibold text-brand-600 bg-brand-50 dark:bg-brand-950 px-3 py-1 rounded-full mb-4">Registro Civil · Desde 9,90 €</span>
            <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-4 leading-tight">
              Certificado de Nacimiento <span className="text-brand-600">online</span>
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-300 mb-6">
              Tramitamos tu certificado de nacimiento del Registro Civil sin que tengas que desplazarte ni usar el certificado digital. Literal, extracto o plurilingüe.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 mb-8">
              <Link href="/solicitar/nacimiento" className="btn-primary text-base px-8 py-3">Solicitar certificado →</Link>
            </div>
            <div className="flex flex-wrap gap-4 text-xs text-gray-500">
              <span className="flex items-center gap-1">✓ Sin certificado digital</span>
              <span className="flex items-center gap-1">✓ Válido en toda España</span>
              <span className="flex items-center gap-1">✓ Reembolso garantizado</span>
            </div>
          </div>

          {/* Info card */}
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
            <Link href="/solicitar/nacimiento" className="btn-primary w-full text-center text-sm py-2.5">
              Solicitar ahora →
            </Link>
          </div>
        </div>
      </section>

      {/* Tipos de certificado */}
      <section className="bg-gray-50 dark:bg-gray-900 py-16">
        <div className="max-w-5xl mx-auto px-4">
          <h2 className="text-2xl font-bold mb-2 dark:text-gray-100">Tipos de certificado de nacimiento</h2>
          <p className="text-gray-500 mb-8">Elige el que necesites en el formulario de solicitud.</p>
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

      {/* Para qué sirve */}
      <section className="py-16 max-w-5xl mx-auto px-4">
        <h2 className="text-2xl font-bold mb-2 dark:text-gray-100">¿Para qué necesitas el certificado de nacimiento?</h2>
        <p className="text-gray-500 mb-8">Es uno de los documentos más solicitados en trámites oficiales.</p>
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

      {/* FAQ */}
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

      {/* CTA */}
      <section className="bg-brand-600 py-14 text-center text-white">
        <div className="max-w-2xl mx-auto px-4">
          <h2 className="text-2xl font-bold mb-3">¿Listo para solicitar tu certificado de nacimiento?</h2>
          <p className="text-brand-100 mb-6">Rellena el formulario en 3 minutos y nosotros nos encargamos de todo.</p>
          <Link href="/solicitar/nacimiento" className="bg-white text-brand-700 font-semibold px-8 py-3 rounded-lg hover:bg-brand-50 transition-colors inline-block">
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
