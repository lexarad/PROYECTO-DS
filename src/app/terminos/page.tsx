import Link from 'next/link'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Términos y Condiciones | CertiDocs',
}

export default function TerminosPage() {
  const fecha = '16 de abril de 2026'

  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-gray-100">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <Link href="/" className="text-xl font-bold text-brand-700">CertiDocs</Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-12 prose prose-gray">
        <h1>Términos y Condiciones</h1>
        <p className="text-gray-500 text-sm">Última actualización: {fecha}</p>

        <h2>1. Descripción del servicio</h2>
        <p>
          CertiDocs es una plataforma de intermediación que facilita la tramitación de solicitudes de
          certificados y documentos legales ante organismos públicos españoles. CertiDocs actúa como
          intermediario y no es un organismo público ni emite certificados oficiales directamente.
        </p>

        <h2>2. Registro y cuenta</h2>
        <p>Para usar el servicio debes crear una cuenta con datos verídicos. Eres responsable de mantener
        la confidencialidad de tus credenciales.</p>

        <h2>3. Precios y pagos</h2>
        <p>Los precios indicados incluyen la gestión del trámite. El pago se realiza de forma segura
        a través de Stripe. Una vez confirmado el pago, iniciaremos la tramitación.</p>
        <p>Las tarifas de tasas oficiales, si las hubiera, son adicionales y se indicarán antes de confirmar.</p>

        <h2>4. Plazo de tramitación</h2>
        <p>Los plazos dependen de los organismos públicos competentes. CertiDocs no garantiza plazos
        mínimos de resolución por parte de los organismos.</p>

        <h2>5. Política de reembolso</h2>
        <p>Si la solicitud no puede tramitarse por causas imputables a CertiDocs, se realizará un
        reembolso íntegro. No se reembolsan solicitudes ya enviadas al organismo competente.</p>

        <h2>6. Uso aceptable</h2>
        <p>Está prohibido usar el servicio para tramitar solicitudes con datos falsos, en nombre de
        terceros sin autorización, o con fines fraudulentos.</p>

        <h2>7. Limitación de responsabilidad</h2>
        <p>CertiDocs no es responsable de retrasos, denegaciones o errores producidos por los organismos
        públicos competentes.</p>

        <h2>8. Legislación aplicable</h2>
        <p>Estos términos se rigen por la legislación española. Para cualquier controversia, las partes
        se someten a los juzgados de Madrid.</p>
      </main>

      <footer className="border-t border-gray-100 py-6 text-center text-sm text-gray-400 mt-12">
        <Link href="/" className="hover:underline">Inicio</Link>
        {' · '}
        <Link href="/privacidad" className="hover:underline">Privacidad</Link>
      </footer>
    </div>
  )
}
