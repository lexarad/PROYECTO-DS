import Link from 'next/link'
import { CERTIFICADOS } from '@/lib/certificados'

const PASOS = [
  { n: '01', titulo: 'Selecciona el certificado', desc: 'Elige el documento que necesitas de nuestro catálogo.' },
  { n: '02', titulo: 'Rellena el formulario', desc: 'Introduce los datos necesarios de forma guiada.' },
  { n: '03', titulo: 'Paga de forma segura', desc: 'Pago online con tarjeta o Bizum. Sin sorpresas.' },
  { n: '04', titulo: 'Recibe tu certificado', desc: 'Lo gestionamos y te lo enviamos al correo.' },
]

export default function HomePage() {
  return (
    <div className="min-h-screen">
      {/* Nav */}
      <header className="border-b border-gray-100">
        <nav className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <span className="text-xl font-bold text-brand-700">CertiDocs</span>
          <div className="flex items-center gap-4">
            <Link href="/auth/login" className="text-sm text-gray-600 hover:text-gray-900">
              Iniciar sesión
            </Link>
            <Link href="/auth/registro" className="btn-primary text-sm py-2 px-4">
              Registrarse
            </Link>
          </div>
        </nav>
      </header>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-4 py-20 text-center">
        <span className="inline-block bg-brand-50 text-brand-700 text-sm font-medium px-3 py-1 rounded-full mb-6">
          100% online · Sin desplazamientos · Sin colas
        </span>
        <h1 className="text-5xl font-bold text-gray-900 mb-6 leading-tight">
          Tus certificados legales,<br />sin salir de casa
        </h1>
        <p className="text-xl text-gray-500 max-w-2xl mx-auto mb-10">
          Solicita certificados del Registro Civil, Seguridad Social y Ministerio de Justicia de forma rápida y segura.
        </p>
        <div className="flex items-center justify-center gap-4">
          <Link href="/solicitar" className="btn-primary">
            Solicitar certificado
          </Link>
          <Link href="#como-funciona" className="btn-secondary">
            Cómo funciona
          </Link>
        </div>
      </section>

      {/* Certificados */}
      <section className="bg-gray-50 py-20">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Certificados disponibles</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {CERTIFICADOS.map((cert) => (
              <Link
                key={cert.tipo}
                href={`/solicitar/${cert.tipo.toLowerCase()}`}
                className="card p-6 hover:shadow-md transition-shadow group"
              >
                <h3 className="font-semibold text-gray-900 group-hover:text-brand-600 transition-colors mb-2">
                  {cert.label}
                </h3>
                <p className="text-sm text-gray-500 mb-4">{cert.descripcion}</p>
                <span className="text-brand-600 font-bold text-lg">{cert.precio.toFixed(2)} €</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Cómo funciona */}
      <section id="como-funciona" className="py-20 max-w-6xl mx-auto px-4">
        <h2 className="text-3xl font-bold text-center mb-12">Cómo funciona</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {PASOS.map((paso) => (
            <div key={paso.n} className="text-center">
              <div className="w-12 h-12 rounded-full bg-brand-600 text-white font-bold text-lg flex items-center justify-center mx-auto mb-4">
                {paso.n}
              </div>
              <h3 className="font-semibold mb-2">{paso.titulo}</h3>
              <p className="text-sm text-gray-500">{paso.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100 py-8 text-center text-sm text-gray-400">
        © {new Date().getFullYear()} CertiDocs · Todos los derechos reservados ·{' '}
        <Link href="/privacidad" className="hover:underline">Privacidad</Link>
        {' · '}
        <Link href="/terminos" className="hover:underline">Términos</Link>
      </footer>
    </div>
  )
}
