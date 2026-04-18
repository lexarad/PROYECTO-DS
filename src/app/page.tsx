import Link from 'next/link'
import { ThemeToggle } from '@/components/ui/ThemeToggle'
import { CERTIFICADOS } from '@/lib/certificados'
import { PLANES } from '@/lib/planes'
import { prisma } from '@/lib/prisma'
import { JsonLd } from '@/components/ui/JsonLd'
import type { Metadata } from 'next'

export const revalidate = 3600

export const metadata: Metadata = {
  title: 'CertiDocs — Certificados legales online en España',
  description: 'Tramitamos tus certificados del Registro Civil, Seguridad Social y Ministerio de Justicia de forma rápida y segura. Sin desplazamientos ni colas.',
  openGraph: {
    title: 'CertiDocs — Certificados legales online en España',
    description: 'Nacimiento, matrimonio, antecedentes penales, vida laboral y más. Desde 14,90 €. Entrega en 24-72h.',
    url: 'https://certidocs-xi.vercel.app',
    siteName: 'CertiDocs',
    locale: 'es_ES',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'CertiDocs — Certificados legales online en España',
    description: 'Tramitamos tus certificados sin colas ni desplazamientos. Desde 14,90 €.',
  },
}

const PASOS = [
  { n: '01', titulo: 'Elige el certificado', desc: 'Selecciona el documento que necesitas entre los disponibles.' },
  { n: '02', titulo: 'Rellena los datos', desc: 'Formulario guiado, sin tecnicismos ni papeleo complicado.' },
  { n: '03', titulo: 'Paga de forma segura', desc: 'Pago con tarjeta vía Stripe. Puedes pagar sin registrarte.' },
  { n: '04', titulo: 'Recibe tu certificado', desc: 'Lo tramitamos y te lo enviamos por email en el menor tiempo posible.' },
]

const GARANTIAS = [
  { icono: '🔒', titulo: 'Pago seguro', desc: 'SSL + Stripe. Tus datos bancarios nunca los tocamos nosotros.' },
  { icono: '📧', titulo: 'Sin registro obligatorio', desc: 'Puedes solicitar y pagar como invitado con solo tu email.' },
  { icono: '📍', titulo: 'Seguimiento en tiempo real', desc: 'Consulta el estado de tu solicitud en cualquier momento con tu referencia.' },
  { icono: '🇪🇸', titulo: 'Tramitación en España', desc: 'Especialistas en documentación de organismos oficiales españoles.' },
]

const TESTIMONIOS = [
  {
    texto: 'En menos de 48 horas tenía el certificado de antecedentes penales en el correo. Increíble comparado con ir en persona al Ministerio.',
    autor: 'María G.',
    cargo: 'Enfermera, Madrid',
    stars: 5,
  },
  {
    texto: 'Necesitaba el certificado de últimas voluntades para una herencia y no sabía ni por dónde empezar. El proceso en CertiDocs fue clarísimo y muy rápido.',
    autor: 'Carlos F.',
    cargo: 'Abogado, Barcelona',
    stars: 5,
  },
  {
    texto: 'Lo usé para tramitar el certificado de nacimiento de mi hijo desde el extranjero. Perfecto, sin complicaciones y con seguimiento en tiempo real.',
    autor: 'Lucía M.',
    cargo: 'Residente en Alemania',
    stars: 5,
  },
]

const FAQS = [
  {
    q: '¿Necesito registrarme para solicitar un certificado?',
    a: 'No. Puedes solicitar y pagar como invitado introduciendo solo tu email. Si quieres gestionar varias solicitudes cómodamente, puedes crear una cuenta gratis.',
  },
  {
    q: '¿Cuánto tarda en llegar el certificado?',
    a: 'Depende del organismo. Antecedentes Penales y Vida Laboral: 24-48 horas. Empadronamiento: 3-5 días. Registro Civil: 5-10 días hábiles. Últimas Voluntades y Seguros de Fallecimiento: 10-15 días hábiles.',
  },
  {
    q: '¿Qué necesito para tramitar el Certificado de Últimas Voluntades?',
    a: 'Solo el nombre completo del fallecido, la fecha de defunción y el municipio. No necesitas el DNI del fallecido. Nosotros gestionamos el trámite ante el Ministerio de Justicia.',
  },
  {
    q: '¿Cómo sé que mi solicitud está siendo tramitada?',
    a: 'Recibirás un email de confirmación al pagar. Puedes consultar el estado en tiempo real en la página de seguimiento con tu número de referencia (CD-XXXXXX).',
  },
  {
    q: '¿Qué pasa si mi solicitud no puede completarse?',
    a: 'En caso de que no podamos tramitar tu solicitud te informamos de inmediato y gestionamos el reembolso completo.',
  },
  {
    q: '¿Es legal este servicio?',
    a: 'Sí. Actuamos como gestores intermediarios, igual que una gestoría tradicional, pero de forma 100% online. Los certificados son oficiales y provienen directamente de los organismos públicos.',
  },
]

async function getStats() {
  try {
    const [tramitados, usuarios] = await Promise.all([
      prisma.solicitud.count({ where: { pagado: true } }),
      prisma.user.count(),
    ])
    return { tramitados, usuarios }
  } catch {
    return { tramitados: 0, usuarios: 0 }
  }
}

export default async function HomePage() {
  const stats = await getStats()

  const organizationLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'CertiDocs',
    url: 'https://certidocs-xi.vercel.app',
    description: 'Plataforma online para tramitar certificados legales en España',
    address: {
      '@type': 'PostalAddress',
      streetAddress: 'Via Laietana 59, 4.º 1.ª',
      addressLocality: 'Barcelona',
      postalCode: '08003',
      addressCountry: 'ES',
    },
  }

  const serviceLd = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: 'Tramitación de certificados legales online',
    provider: { '@type': 'Organization', name: 'CertiDocs' },
    areaServed: { '@type': 'Country', name: 'España' },
    serviceType: 'Gestión documental',
    offers: CERTIFICADOS.map((c) => ({
      '@type': 'Offer',
      name: c.label,
      price: c.precio.toFixed(2),
      priceCurrency: 'EUR',
    })),
  }

  return (
    <div className="min-h-screen">
      <JsonLd data={organizationLd} />
      <JsonLd data={serviceLd} />
      {/* Nav */}
      <header className="border-b border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-950 sticky top-0 z-10">
        <nav className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <span className="text-xl font-bold text-brand-700">CertiDocs</span>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Link href="#precios" className="text-sm text-gray-500 hover:text-gray-800 hidden sm:block">
              Precios
            </Link>
            <Link href="/seguimiento" className="text-sm text-gray-500 hover:text-gray-800 hidden sm:block">
              Seguir solicitud
            </Link>
            <Link href="/solicitar/ocr_extraccion" className="text-sm text-gray-500 hover:text-gray-800 hidden sm:block">
              OCR / Escanear doc
            </Link>
            <Link href="/auth/login" className="text-sm text-gray-600 hover:text-gray-900">
              Iniciar sesión
            </Link>
            <Link href="/solicitar" className="btn-primary text-sm py-2 px-4">
              Solicitar ahora
            </Link>
          </div>
        </nav>
      </header>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-4 py-20 text-center">
        <div className="inline-flex items-center gap-2 bg-green-50 text-green-700 text-sm font-medium px-3 py-1 rounded-full mb-6">
          <span className="w-2 h-2 rounded-full bg-green-500 inline-block"></span>
          Sin registro · Sin desplazamientos · Sin colas
        </div>
        <h1 className="text-5xl font-bold text-gray-900 mb-6 leading-tight">
          Tus certificados legales,<br />
          <span className="text-brand-600">en casa y sin esperas</span>
        </h1>
        <p className="text-xl text-gray-500 max-w-2xl mx-auto mb-10">
          Solicita certificados del Registro Civil, Seguridad Social y Ministerio de Justicia de forma rápida y segura. Gestión profesional desde 14,90 €.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link href="/solicitar" className="btn-primary text-base px-8 py-3">
            Ver certificados disponibles
          </Link>
          <Link href="#como-funciona" className="btn-secondary text-base px-8 py-3">
            Cómo funciona
          </Link>
        </div>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-4 text-xs text-gray-400">
          <span className="flex items-center gap-1.5">
            <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            Pago seguro SSL
          </span>
          <span className="text-gray-200">|</span>
          <span className="flex items-center gap-1.5">
            <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
            </svg>
            Stripe · Sin guardar datos bancarios
          </span>
          <span className="text-gray-200">|</span>
          <span className="flex items-center gap-1.5">
            <svg className="w-4 h-4 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Reembolso garantizado
          </span>
          <span className="text-gray-200">|</span>
          <span className="flex items-center gap-1.5">
            <svg className="w-4 h-4 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            Sin cuenta obligatoria
          </span>
        </div>
      </section>

      {/* Social proof + Trust bar */}
      {stats.tramitados > 0 && (
        <section className="border-y border-brand-100 bg-brand-50 py-4">
          <div className="max-w-5xl mx-auto px-4 flex flex-wrap items-center justify-center gap-6 sm:gap-12 text-center">
            <div>
              <p className="text-2xl font-bold text-brand-700">{stats.tramitados}+</p>
              <p className="text-xs text-brand-500 font-medium">certificados tramitados</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-brand-700">{stats.usuarios}+</p>
              <p className="text-xs text-brand-500 font-medium">usuarios registrados</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-brand-700">8</p>
              <p className="text-xs text-brand-500 font-medium">tipos de certificado</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-brand-700">72h</p>
              <p className="text-xs text-brand-500 font-medium">tiempo medio de gestión</p>
            </div>
          </div>
        </section>
      )}

      <section className="border-y border-gray-100 bg-gray-50 py-6">
        <div className="max-w-5xl mx-auto px-4 grid grid-cols-2 sm:grid-cols-4 gap-6 text-center">
          {GARANTIAS.map((g) => (
            <div key={g.titulo} className="space-y-1">
              <div className="text-2xl">{g.icono}</div>
              <p className="font-semibold text-sm text-gray-800">{g.titulo}</p>
              <p className="text-xs text-gray-500">{g.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Certificados */}
      <section className="py-20">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-3">Certificados disponibles</h2>
            <p className="text-gray-500">Selecciona el que necesitas y lo tramitamos por ti</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {CERTIFICADOS.map((cert) => (
              <Link
                key={cert.tipo}
                href={`/solicitar/${cert.tipo.toLowerCase()}`}
                className="card p-6 hover:shadow-md hover:border-brand-200 border border-transparent transition-all group"
              >
                {cert.tipo === 'OCR_EXTRACCION' as any && (
                  <span className="inline-block text-xs font-semibold text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full mb-2">Nuevo · IA</span>
                )}
                {cert.requiresTasa && (
                  <span className="inline-block text-xs font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full mb-2">Incluye tasa gobierno</span>
                )}
                <h3 className="font-semibold text-gray-900 group-hover:text-brand-600 transition-colors mb-2">
                  {cert.label}
                </h3>
                <p className="text-sm text-gray-500 mb-5">{cert.descripcion}</p>
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-brand-600 font-bold text-lg">
                      {cert.requiresTasa
                        ? (cert.precio + (cert.tasaImporte ?? 0)).toFixed(2)
                        : cert.precio.toFixed(2)} €
                    </span>
                    {cert.requiresTasa && (
                      <p className="text-xs text-gray-400">incl. {cert.tasaImporte?.toFixed(2)} € tasa</p>
                    )}
                  </div>
                  <span className="text-xs font-medium text-brand-600 bg-brand-50 px-3 py-1 rounded-full group-hover:bg-brand-100 transition-colors">
                    {cert.tipo === 'OCR_EXTRACCION' as any ? 'Escanear →' : 'Solicitar →'}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Bloque herencia */}
      <section className="max-w-6xl mx-auto px-4 pb-10">
        <div className="rounded-2xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 p-8 flex flex-col sm:flex-row items-start sm:items-center gap-6">
          <div className="flex-1">
            <span className="inline-block text-xs font-semibold text-indigo-600 bg-indigo-100 px-2 py-0.5 rounded-full mb-2">Tramitación de herencias</span>
            <h2 className="text-xl font-bold text-gray-900 mb-2">¿Tienes que tramitar una herencia?</h2>
            <p className="text-sm text-gray-600">
              Normalmente necesitarás el <strong>Certificado de Defunción</strong>, el <strong>Certificado de Últimas Voluntades</strong> y el <strong>Certificado de Seguros de Fallecimiento</strong>.
              Puedes solicitarlos por separado o de uno en uno en cualquier momento.
            </p>
          </div>
          <div className="flex flex-col gap-2 flex-shrink-0">
            <Link href="/solicitar/ultimas_voluntades" className="btn-primary text-sm text-center px-6">
              Últimas Voluntades
            </Link>
            <Link href="/solicitar/seguros_fallecimiento" className="btn-secondary text-sm text-center px-6">
              Seguros de Fallecimiento
            </Link>
          </div>
        </div>
      </section>

      {/* Testimonios */}
      <section className="py-20 max-w-6xl mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-3">Lo que dicen nuestros clientes</h2>
          <div className="flex items-center justify-center gap-1">
            {[1,2,3,4,5].map(i => (
              <svg key={i} className="w-5 h-5 text-amber-400 fill-current" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            ))}
            <span className="ml-2 text-sm text-gray-500">Valoración media 4,9/5</span>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {TESTIMONIOS.map(t => (
            <div key={t.autor} className="card p-6 flex flex-col gap-4">
              <div className="flex gap-0.5">
                {Array.from({ length: t.stars }).map((_, i) => (
                  <svg key={i} className="w-4 h-4 text-amber-400 fill-current" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <p className="text-gray-600 text-sm leading-relaxed flex-1">&ldquo;{t.texto}&rdquo;</p>
              <div>
                <p className="font-semibold text-sm text-gray-800">{t.autor}</p>
                <p className="text-xs text-gray-400">{t.cargo}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Cómo funciona */}
      <section id="como-funciona" className="bg-gray-50 py-20">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Cómo funciona</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {PASOS.map((paso, i) => (
              <div key={paso.n} className="relative text-center">
                {i < PASOS.length - 1 && (
                  <div className="hidden lg:block absolute top-6 left-[60%] w-full border-t-2 border-dashed border-brand-200" />
                )}
                <div className="relative w-12 h-12 rounded-full bg-brand-600 text-white font-bold text-lg flex items-center justify-center mx-auto mb-4 z-10">
                  {paso.n}
                </div>
                <h3 className="font-semibold mb-2">{paso.titulo}</h3>
                <p className="text-sm text-gray-500">{paso.desc}</p>
              </div>
            ))}
          </div>
          <div className="text-center mt-12">
            <Link href="/solicitar" className="btn-primary text-base px-8 py-3">
              Empezar ahora
            </Link>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="precios" className="py-20 bg-gray-50">
        <div className="max-w-5xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-3">Para particulares y profesionales</h2>
            <p className="text-gray-500">Cualquiera puede solicitar certificados. Los profesionales tienen planes con descuentos y acceso a API.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {PLANES.map((plan) => (
              <div key={plan.plan} className={`card p-6 flex flex-col ${plan.plan === 'PRO' ? 'ring-2 ring-brand-500 relative' : ''}`}>
                {plan.plan === 'PRO' && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-xs font-bold bg-brand-600 text-white px-3 py-0.5 rounded-full">
                    Más popular
                  </span>
                )}
                <h3 className="text-lg font-bold mb-1">{plan.label}</h3>
                <p className="text-3xl font-bold mb-1 text-brand-700">
                  {plan.precio === 0 ? 'Gratis' : `${plan.precio} €`}
                  {plan.precio > 0 && <span className="text-sm font-normal text-gray-400">/mes</span>}
                </p>
                <p className="text-sm text-gray-500 mb-5">{plan.descripcion}</p>
                <ul className="space-y-2 text-sm text-gray-600 mb-6 flex-1">
                  <li className="flex gap-2">
                    <span className="text-green-500 flex-shrink-0">✓</span>
                    {plan.maxSolicitudesMes === null ? 'Solicitudes ilimitadas' : `Hasta ${plan.maxSolicitudesMes} solicitudes/mes`}
                  </li>
                  {plan.descuento > 0 && (
                    <li className="flex gap-2">
                      <span className="text-green-500 flex-shrink-0">✓</span>
                      {plan.descuento}% de descuento en cada trámite
                    </li>
                  )}
                  <li className="flex gap-2">
                    {plan.apiAccess
                      ? <><span className="text-green-500 flex-shrink-0">✓</span>Acceso a API REST</>
                      : <><span className="text-gray-300 flex-shrink-0">✗</span><span className="text-gray-400">Sin API REST</span></>
                    }
                  </li>
                  <li className="flex gap-2">
                    <span className="text-green-500 flex-shrink-0">✓</span>Factura PDF automática
                  </li>
                </ul>
                {plan.precio === 0 ? (
                  <Link href="/solicitar" className="btn-secondary text-sm text-center py-2">
                    Empezar gratis
                  </Link>
                ) : (
                  <Link href="/auth/registro" className="btn-primary text-sm text-center py-2">
                    Empezar con {plan.label}
                  </Link>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 max-w-3xl mx-auto px-4">
        <h2 className="text-3xl font-bold text-center mb-12">Preguntas frecuentes</h2>
        <div className="space-y-4">
          {FAQS.map((faq) => (
            <details key={faq.q} className="card p-6 group cursor-pointer">
              <summary className="font-semibold text-gray-900 list-none flex items-center justify-between gap-4">
                {faq.q}
                <span className="text-brand-600 text-xl flex-shrink-0 group-open:rotate-45 transition-transform">+</span>
              </summary>
              <p className="mt-4 text-sm text-gray-600 leading-relaxed">{faq.a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* CTA final */}
      <section className="bg-brand-600 py-16 text-center text-white">
        <div className="max-w-2xl mx-auto px-4">
          <h2 className="text-3xl font-bold mb-4">¿Listo para empezar?</h2>
          <p className="text-brand-100 mb-8">Sin registro, sin esperas en oficinas. Solo rellena el formulario y paga.</p>
          <Link href="/solicitar" className="bg-white text-brand-700 font-semibold px-8 py-3 rounded-lg hover:bg-brand-50 transition-colors inline-block">
            Solicitar mi certificado
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100 py-8 px-4">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-gray-400">
          <span>© {new Date().getFullYear()} CertiDocs · Tramitación de documentos legales online</span>
          <div className="flex gap-4">
            <Link href="/seguimiento" className="hover:text-gray-600 hover:underline">Seguir solicitud</Link>
            <Link href="/contacto" className="hover:text-gray-600 hover:underline">Contacto</Link>
            <Link href="/privacidad" className="hover:text-gray-600 hover:underline">Privacidad</Link>
            <Link href="/terminos" className="hover:text-gray-600 hover:underline">Términos</Link>
            <Link href="/estado" className="hover:text-gray-600 hover:underline">Estado</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
