import type { Metadata } from 'next'
import './globals.css'
import { Providers } from './providers'

export const metadata: Metadata = {
  title: 'CertiDocs – Certificados y documentos legales online',
  description: 'Solicita tus certificados del Registro Civil, Seguridad Social y Ministerio de Justicia desde casa. Rápido, seguro y sin colas.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
