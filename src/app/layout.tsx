import type { Metadata } from 'next'
import './globals.css'
import { Providers } from './providers'
import { CookieBanner } from '@/components/ui/CookieBanner'
import { ChatBot } from '@/components/ui/ChatBot'

const BASE_URL = process.env.NEXTAUTH_URL ?? 'https://certidocs-xi.vercel.app'

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: 'CertiDocs – Certificados legales online',
    template: '%s | CertiDocs',
  },
  description: 'Solicita certificados del Registro Civil, Seguridad Social y Ministerio de Justicia desde casa. Sin desplazamientos, sin colas, 100% online.',
  keywords: ['certificado nacimiento', 'certificado matrimonio', 'antecedentes penales', 'vida laboral', 'empadronamiento online'],
  openGraph: {
    type: 'website',
    locale: 'es_ES',
    url: BASE_URL,
    siteName: 'CertiDocs',
    title: 'CertiDocs – Certificados legales online',
    description: 'Solicita tus certificados legales desde casa. Sin colas, 100% online.',
  },
  twitter: {
    card: 'summary',
    title: 'CertiDocs – Certificados legales online',
    description: 'Solicita tus certificados legales desde casa. Sin colas, 100% online.',
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: `(function(){if(localStorage.getItem('theme')==='dark')document.documentElement.classList.add('dark')})()` }} />
      </head>
      <body>
        <div className="bg-yellow-50 border-b-2 border-yellow-400 px-4 py-3 text-center">
          <p className="text-yellow-900 text-sm sm:text-base font-bold leading-snug">
            AVISO IMPORTANTE: Todos los certificados se pueden obtener gratuitamente en la web oficial del Ministerio de Justicia:{' '}
            <a
              href="https://sede.mjusticia.gob.es/"
              target="_blank"
              rel="noreferrer"
              className="underline text-yellow-800 hover:text-yellow-600 break-all"
            >
              sede.mjusticia.gob.es
            </a>
            . CertiDocs ofrece la alternativa de gestionarlo sin que tengas que navegar por plataformas administrativas.
          </p>
        </div>
        <div className="fixed left-0 top-1/2 -translate-y-1/2 z-[9999] bg-red-600 text-white font-black text-xs tracking-widest px-1 py-3 rounded-r-md shadow-lg" style={{ writingMode: 'vertical-rl', textOrientation: 'mixed', transform: 'translateY(-50%) rotate(180deg)' }}>
          ENTORNO DE PRUEBAS
        </div>
        <Providers>{children}</Providers>
        <CookieBanner />
        <ChatBot />
      </body>
    </html>
  )
}
