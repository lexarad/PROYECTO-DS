import Link from 'next/link'
import { CERTIFICADOS } from '@/lib/certificados'

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

export default function HomePage() {
  return (
    <div className="min-h-screen">
      {/* Nav */}
      <header className="border-b border-gray-100 bg-white sticky top-0 z-10">
        <nav className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <span className="text-xl font-bold text-brand-700">CertiDocs</span>
          <div className="flex items-center gap-3">
            <Link href="/seguimiento" className="text-sm text-gray-500 hover:text-gray-800 hidden sm:block">
              Seguir solicitud
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
        <p className="mt-5 text-sm text-gray-400">
          Puedes pagar sin crear cuenta · Pago seguro con Stripe
        </p>
      </section>

      {/* Trust bar */}
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
                <h3 className="font-semibold text-gray-900 group-hover:text-brand-600 transition-colors mb-2">
                  {cert.label}
                </h3>
                <p className="text-sm text-gray-500 mb-5">{cert.descripcion}</p>
                <div className="flex items-center justify-between">
                  <span className="text-brand-600 font-bold text-lg">{cert.precio.toFixed(2)} €</span>
                  <span className="text-xs font-medium text-brand-600 bg-brand-50 px-3 py-1 rounded-full group-hover:bg-brand-100 transition-colors">
                    Solicitar →
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
            <Link href="/privacidad" className="hover:text-gray-600 hover:underline">Privacidad</Link>
            <Link href="/terminos" className="hover:text-gray-600 hover:underline">Términos</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
