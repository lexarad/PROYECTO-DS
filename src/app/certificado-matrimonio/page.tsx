import type { Metadata } from 'next'
import Link from 'next/link'
import { JsonLd } from '@/components/ui/JsonLd'

export const metadata: Metadata = {
  title: 'Certificado de Matrimonio online — CertiDocs',
  description: 'Solicita tu certificado de matrimonio del Registro Civil online. Literal, extracto o plurilingüe. Sin desplazamientos, desde 9,90 €. Entrega en 5-10 días hábiles.',
  keywords: ['certificado de matrimonio', 'registro civil matrimonio', 'certificado matrimonio online', 'solicitar certificado matrimonio'],
  openGraph: {
    title: 'Certificado de Matrimonio online — Sin colas, desde 9,90 €',
    description: 'Tramitamos tu certificado de matrimonio del Registro Civil. Literal, extracto o plurilingüe. Sin certificado digital.',
    url: 'https://certidocs-xi.vercel.app/certificado-matrimonio',
    siteName: 'CertiDocs',
    locale: 'es_ES',
    type: 'website',
  },
}

const USOS = [
  { icono: '💔', titulo: 'Divorcio o separación', desc: 'Necesario para iniciar cualquier procedimiento de separación o divorcio ante el juzgado o notaría.' },
  { icono: '🏠', titulo: 'Compra o herencia de inmuebles', desc: 'Los notarios lo exigen para acreditar el régimen económico matrimonial.' },
  { icono: '🌍', titulo: 'Trámites en el extranjero', desc: 'Reagrupación familiar, residencia o trabajar en otro país.' },
  { icono: '📑', titulo: 'Modificación del régimen económico', desc: 'Cambiar de separación de bienes a gananciales o viceversa.' },
  { icono: '💰', titulo: 'Herencias y pensiones', desc: 'Para acreditar el vínculo conyugal ante bancos, notarías y administraciones.' },
  { icono: '🏛️', titulo: 'Trámites administrativos', desc: 'Seguridad Social, prestaciones, cambio de apellidos, etc.' },
]

const TIPOS = [
  { tipo: 'Literal', desc: 'Copia íntegra del acta de matrimonio. Incluye todos los datos de la inscripción.', cuando: 'Divorcio, herencias, notarías.' },
  { tipo: 'Extracto', desc: 'Resumen con los datos esenciales del matrimonio. Válido para la mayoría de trámites.', cuando: 'Trámites administrativos generales.' },
  { tipo: 'Plurilingüe', desc: 'Versión multilingüe reconocida en la UE. Evita apostillado y traducciones en países del Convenio de Viena.', cuando: 'Trámites en el extranjero, dentro de la UE.' },
]

const FAQS = [
  { q: '¿Cuánto tarda en llegar el certificado de matrimonio?', a: 'El plazo habitual es de 5 a 10 días hábiles desde que tramitamos la solicitud ante el Registro Civil.' },
  { q: '¿Necesito saber en qué Registro Civil está inscrito?', a: 'No. Con el municipio y la fecha del matrimonio podemos localizar el Registro Civil competente.' },
  { q: '¿Puedo solicitar el certificado de mi matrimonio estando en el extranjero?', a: 'Sí. Puedes solicitarlo desde cualquier país del mundo. Solo necesitas los datos y un email.' },
  { q: '¿Qué tipo de certificado necesito para el divorcio?', a: 'Por lo general el literal es el requerido en procedimientos judiciales. Consúltalo con tu abogado.' },
  { q: '¿El certificado tiene fecha de caducidad?', a: 'No caduca, pero muchas administraciones exigen que tenga menos de 3 o 6 meses de antigüedad para ciertos trámites.' },
]

export default function CertificadoMatrimonioPage() {
  const productLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: 'Certificado de Matrimonio online',
    description: 'Tramitación online del certificado de matrimonio del Registro Civil español.',
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
            <Link href="/solicitar/matrimonio" className="btn-primary text-sm py-2 px-4">Solicitar ahora</Link>
          </div>
        </div>
      </header>

      <section className="max-w-5xl mx-auto px-4 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <span className="inline-block text-xs font-semibold text-brand-600 bg-brand-50 dark:bg-brand-950 px-3 py-1 rounded-full mb-4">Registro Civil · Desde 9,90 €</span>
            <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-4 leading-tight">
              Certificado de Matrimonio <span className="text-brand-600">online</span>
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-300 mb-6">
              Tramitamos tu certificado de matrimonio del Registro Civil sin desplazamientos ni certificado digital. Literal, extracto o plurilingüe.
            </p>
            <div className="flex gap-3 mb-8">
              <Link href="/solicitar/matrimonio" className="btn-primary text-base px-8 py-3">Solicitar certificado →</Link>
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
            <Link href="/solicitar/matrimonio" className="btn-primary w-full text-center text-sm py-2.5">Solicitar ahora →</Link>
          </div>
        </div>
      </section>

      <section className="bg-gray-50 dark:bg-gray-900 py-16">
        <div className="max-w-5xl mx-auto px-4">
          <h2 className="text-2xl font-bold mb-2 dark:text-gray-100">Tipos de certificado de matrimonio</h2>
          <p className="text-gray-500 mb-8">Selecciona el tipo en el formulario de solicitud.</p>
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
        <h2 className="text-2xl font-bold mb-2 dark:text-gray-100">¿Para qué necesitas el certificado de matrimonio?</h2>
        <p className="text-gray-500 mb-8">Uno de los documentos más solicitados en trámites legales y administrativos.</p>
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
          <h2 className="text-2xl font-bold mb-3">¿Necesitas el certificado de matrimonio?</h2>
          <p className="text-brand-100 mb-6">Rellena el formulario en 3 minutos. Nosotros hacemos el trámite.</p>
          <Link href="/solicitar/matrimonio" className="bg-white text-brand-700 font-semibold px-8 py-3 rounded-lg hover:bg-brand-50 transition-colors inline-block">
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
