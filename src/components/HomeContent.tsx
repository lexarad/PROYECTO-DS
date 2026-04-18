'use client'

import Link from 'next/link'
import { ThemeToggle } from '@/components/ui/ThemeToggle'
import { LanguageSwitcher } from '@/components/ui/LanguageSwitcher'
import { useTranslations } from '@/lib/i18n/context'
import { CERTIFICADOS } from '@/lib/certificados'
import { PLANES } from '@/lib/planes'

const TESTIMONIOS = [
  { texto: 'En menos de 48 horas tenía el certificado de antecedentes penales en el correo. Increíble comparado con ir en persona al Ministerio.', autor: 'María G.', cargo: 'Enfermera, Madrid', stars: 5 },
  { texto: 'Necesitaba el certificado de últimas voluntades para una herencia y no sabía ni por dónde empezar. El proceso en CertiDocs fue clarísimo y muy rápido.', autor: 'Carlos F.', cargo: 'Abogado, Barcelona', stars: 5 },
  { texto: 'Lo usé para tramitar el certificado de nacimiento de mi hijo desde el extranjero. Perfecto, sin complicaciones y con seguimiento en tiempo real.', autor: 'Lucía M.', cargo: 'Residente en Alemania', stars: 5 },
]

const GUARANTEE_ICONS = ['🔒', '📧', '📍', '🇪🇸']

interface Props {
  stats: { tramitados: number; usuarios: number }
}

export function HomeContent({ stats }: Props) {
  const { t } = useTranslations()

  return (
    <div className="min-h-screen">
      {/* Nav */}
      <header className="border-b border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-950 sticky top-0 z-10">
        <nav className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <span className="text-xl font-bold text-brand-700">CertiDocs</span>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <LanguageSwitcher />
            <Link href="#precios" className="text-sm text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-100 hidden sm:block">
              {t.nav.precios}
            </Link>
            <Link href="/seguimiento" className="text-sm text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-100 hidden sm:block">
              {t.nav.seguimiento}
            </Link>
            <Link href="/solicitar/ocr_extraccion" className="text-sm text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-100 hidden sm:block">
              {t.nav.ocr}
            </Link>
            <Link href="/auth/login" className="text-sm text-gray-600 hover:text-gray-900 dark:text-gray-300">
              {t.nav.login}
            </Link>
            <Link href="/solicitar" className="btn-primary text-sm py-2 px-4">
              {t.nav.solicitar}
            </Link>
          </div>
        </nav>
      </header>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-4 py-20 text-center">
        <div className="inline-flex items-center gap-2 bg-green-50 text-green-700 text-sm font-medium px-3 py-1 rounded-full mb-6">
          <span className="w-2 h-2 rounded-full bg-green-500 inline-block"></span>
          {t.hero.badge}
        </div>
        <h1 className="text-5xl font-bold text-gray-900 dark:text-gray-100 mb-6 leading-tight">
          {t.hero.title.split('\n')[0]}<br />
          <span className="text-brand-600">{t.hero.title.split('\n')[1] || t.hero.titleHighlight}</span>
        </h1>
        <p className="text-xl text-gray-500 dark:text-gray-400 max-w-2xl mx-auto mb-10">{t.hero.subtitle}</p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link href="/solicitar" className="btn-primary text-base px-8 py-3">{t.hero.cta1}</Link>
          <Link href="#como-funciona" className="btn-secondary text-base px-8 py-3">{t.hero.cta2}</Link>
        </div>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-4 text-xs text-gray-400">
          <span className="flex items-center gap-1.5">
            <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            {t.trust.ssl}
          </span>
          <span className="text-gray-200">|</span>
          <span className="flex items-center gap-1.5">
            <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
            </svg>
            {t.trust.stripe}
          </span>
          <span className="text-gray-200">|</span>
          <span className="flex items-center gap-1.5">
            <svg className="w-4 h-4 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {t.trust.refund}
          </span>
          <span className="text-gray-200">|</span>
          <span className="flex items-center gap-1.5">
            <svg className="w-4 h-4 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            {t.trust.noAccount}
          </span>
        </div>
      </section>

      {/* Stats */}
      {stats.tramitados > 0 && (
        <section className="border-y border-brand-100 bg-brand-50 py-4">
          <div className="max-w-5xl mx-auto px-4 flex flex-wrap items-center justify-center gap-6 sm:gap-12 text-center">
            <div>
              <p className="text-2xl font-bold text-brand-700">{stats.tramitados}+</p>
              <p className="text-xs text-brand-500 font-medium">{t.certs.tramitados}</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-brand-700">{stats.usuarios}+</p>
              <p className="text-xs text-brand-500 font-medium">{t.certs.usuarios}</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-brand-700">8</p>
              <p className="text-xs text-brand-500 font-medium">{t.certs.tiposCert}</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-brand-700">72h</p>
              <p className="text-xs text-brand-500 font-medium">{t.certs.tiempoMedio}</p>
            </div>
          </div>
        </section>
      )}

      {/* Guarantees */}
      <section className="border-y border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 py-6">
        <div className="max-w-5xl mx-auto px-4 grid grid-cols-2 sm:grid-cols-4 gap-6 text-center">
          {t.guarantees.map((g, i) => (
            <div key={i} className="space-y-1">
              <div className="text-2xl">{GUARANTEE_ICONS[i]}</div>
              <p className="font-semibold text-sm text-gray-800 dark:text-gray-200">{g.titulo}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">{g.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Certificados */}
      <section className="py-20">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-3 dark:text-gray-100">{t.certs.title}</h2>
            <p className="text-gray-500">{t.certs.subtitle}</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {CERTIFICADOS.map((cert) => (
              <Link
                key={cert.tipo}
                href={`/solicitar/${cert.tipo.toLowerCase()}`}
                className="card p-6 hover:shadow-md hover:border-brand-200 border border-transparent transition-all group"
              >
                {cert.tipo === 'OCR_EXTRACCION' as any && (
                  <span className="inline-block text-xs font-semibold text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full mb-2">{t.certs.nuevo}</span>
                )}
                {cert.requiresTasa && (
                  <span className="inline-block text-xs font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full mb-2">{t.certs.incluyeTasa}</span>
                )}
                <h3 className="font-semibold text-gray-900 dark:text-gray-100 group-hover:text-brand-600 transition-colors mb-2">{cert.label}</h3>
                <p className="text-sm text-gray-500 mb-5">{cert.descripcion}</p>
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-brand-600 font-bold text-lg">
                      {cert.requiresTasa
                        ? (cert.precio + (cert.tasaImporte ?? 0)).toFixed(2)
                        : cert.precio.toFixed(2)} €
                    </span>
                    {cert.requiresTasa && (
                      <p className="text-xs text-gray-400">{t.certs.inclTasa.replace('{{amount}}', cert.tasaImporte?.toFixed(2) ?? '')}</p>
                    )}
                  </div>
                  <span className="text-xs font-medium text-brand-600 bg-brand-50 px-3 py-1 rounded-full group-hover:bg-brand-100 transition-colors">
                    {cert.tipo === 'OCR_EXTRACCION' as any ? t.certs.escanear : t.certs.solicitar}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Herencia block */}
      <section className="max-w-6xl mx-auto px-4 pb-10">
        <div className="rounded-2xl bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950 border border-blue-100 dark:border-blue-900 p-8 flex flex-col sm:flex-row items-start sm:items-center gap-6">
          <div className="flex-1">
            <span className="inline-block text-xs font-semibold text-indigo-600 bg-indigo-100 dark:bg-indigo-900 px-2 py-0.5 rounded-full mb-2">{t.certs.herencia}</span>
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">{t.certs.herenciaTitle}</h2>
            <p className="text-sm text-gray-600 dark:text-gray-300">{t.certs.herenciaDesc}</p>
          </div>
          <div className="flex flex-col gap-2 flex-shrink-0">
            <Link href="/solicitar/ultimas_voluntades" className="btn-primary text-sm text-center px-6">{t.certs.ultimasVoluntades}</Link>
            <Link href="/solicitar/seguros_fallecimiento" className="btn-secondary text-sm text-center px-6">{t.certs.segurosFallecimiento}</Link>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 max-w-6xl mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-3 dark:text-gray-100">{t.certs.testimonios}</h2>
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
          {TESTIMONIOS.map(testim => (
            <div key={testim.autor} className="card p-6 flex flex-col gap-4">
              <div className="flex gap-0.5">
                {Array.from({ length: testim.stars }).map((_, i) => (
                  <svg key={i} className="w-4 h-4 text-amber-400 fill-current" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed flex-1">&ldquo;{testim.texto}&rdquo;</p>
              <div>
                <p className="font-semibold text-sm text-gray-800 dark:text-gray-200">{testim.autor}</p>
                <p className="text-xs text-gray-400">{testim.cargo}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Cómo funciona */}
      <section id="como-funciona" className="bg-gray-50 dark:bg-gray-900 py-20">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12 dark:text-gray-100">{t.howItWorks.title}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {t.howItWorks.steps.map((paso, i) => (
              <div key={paso.n} className="relative text-center">
                {i < t.howItWorks.steps.length - 1 && (
                  <div className="hidden lg:block absolute top-6 left-[60%] w-full border-t-2 border-dashed border-brand-200" />
                )}
                <div className="relative w-12 h-12 rounded-full bg-brand-600 text-white font-bold text-lg flex items-center justify-center mx-auto mb-4 z-10">
                  {paso.n}
                </div>
                <h3 className="font-semibold mb-2 dark:text-gray-200">{paso.titulo}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">{paso.desc}</p>
              </div>
            ))}
          </div>
          <div className="text-center mt-12">
            <Link href="/solicitar" className="btn-primary text-base px-8 py-3">{t.howItWorks.cta}</Link>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="precios" className="py-20 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-5xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-3 dark:text-gray-100">{t.certs.pricingTitle}</h2>
            <p className="text-gray-500">{t.certs.pricingSubtitle}</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {PLANES.map((plan) => (
              <div key={plan.plan} className={`card p-6 flex flex-col ${plan.plan === 'PRO' ? 'ring-2 ring-brand-500 relative' : ''}`}>
                {plan.plan === 'PRO' && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-xs font-bold bg-brand-600 text-white px-3 py-0.5 rounded-full">
                    {t.certs.popular}
                  </span>
                )}
                <h3 className="text-lg font-bold mb-1 dark:text-gray-100">{plan.label}</h3>
                <p className="text-3xl font-bold mb-1 text-brand-700">
                  {plan.precio === 0 ? t.certs.gratis : `${plan.precio} €`}
                  {plan.precio > 0 && <span className="text-sm font-normal text-gray-400">/mes</span>}
                </p>
                <p className="text-sm text-gray-500 mb-5">{plan.descripcion}</p>
                <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400 mb-6 flex-1">
                  <li className="flex gap-2">
                    <span className="text-green-500 flex-shrink-0">✓</span>
                    {plan.maxSolicitudesMes === null ? t.certs.ilimitadas : `${t.certs.hasta} ${plan.maxSolicitudesMes} ${t.certs.solicitudesMes}`}
                  </li>
                  {plan.descuento > 0 && (
                    <li className="flex gap-2">
                      <span className="text-green-500 flex-shrink-0">✓</span>
                      {plan.descuento}{t.certs.descuento}
                    </li>
                  )}
                  <li className="flex gap-2">
                    {plan.apiAccess
                      ? <><span className="text-green-500 flex-shrink-0">✓</span>{t.certs.apiAccess}</>
                      : <><span className="text-gray-300 flex-shrink-0">✗</span><span className="text-gray-400">{t.certs.noApi}</span></>
                    }
                  </li>
                  <li className="flex gap-2">
                    <span className="text-green-500 flex-shrink-0">✓</span>{t.certs.factura}
                  </li>
                </ul>
                {plan.precio === 0 ? (
                  <Link href="/solicitar" className="btn-secondary text-sm text-center py-2">{t.certs.empezarGratis}</Link>
                ) : (
                  <Link href="/auth/registro" className="btn-primary text-sm text-center py-2">{t.certs.empezarCon} {plan.label}</Link>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 max-w-3xl mx-auto px-4">
        <h2 className="text-3xl font-bold text-center mb-12 dark:text-gray-100">{t.faq.title}</h2>
        <div className="space-y-4">
          {([
            [t.faq.q1, t.faq.a1],
            [t.faq.q2, t.faq.a2],
            [t.faq.q3, t.faq.a3],
            [t.faq.q4, t.faq.a4],
            [t.faq.q5, t.faq.a5],
            [t.faq.q6, t.faq.a6],
          ] as [string, string][]).map(([q, a]) => (
            <details key={q} className="card p-6 group cursor-pointer">
              <summary className="font-semibold text-gray-900 dark:text-gray-100 list-none flex items-center justify-between gap-4">
                {q}
                <span className="text-brand-600 text-xl flex-shrink-0 group-open:rotate-45 transition-transform">+</span>
              </summary>
              <p className="mt-4 text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* CTA final */}
      <section className="bg-brand-600 py-16 text-center text-white">
        <div className="max-w-2xl mx-auto px-4">
          <h2 className="text-3xl font-bold mb-4">{t.solicitar.ctaTitle}</h2>
          <p className="text-brand-100 mb-8">{t.solicitar.ctaSubtitle}</p>
          <Link href="/solicitar" className="bg-white text-brand-700 font-semibold px-8 py-3 rounded-lg hover:bg-brand-50 transition-colors inline-block">
            {t.solicitar.ctaBtn}
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100 dark:border-gray-800 py-8 px-4">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-gray-400">
          <span>© {new Date().getFullYear()} CertiDocs · {t.solicitar.footerDesc}</span>
          <div className="flex gap-4">
            <Link href="/seguimiento" className="hover:text-gray-600 hover:underline">{t.nav.seguimiento}</Link>
            <Link href="/contacto" className="hover:text-gray-600 hover:underline">{t.solicitar.contacto}</Link>
            <Link href="/privacidad" className="hover:text-gray-600 hover:underline">{t.solicitar.privacidad}</Link>
            <Link href="/terminos" className="hover:text-gray-600 hover:underline">{t.solicitar.terminos}</Link>
            <Link href="/estado" className="hover:text-gray-600 hover:underline">{t.solicitar.estado}</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
