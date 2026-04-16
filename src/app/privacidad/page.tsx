import Link from 'next/link'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Política de Privacidad | CertiDocs',
  description: 'Política de privacidad y tratamiento de datos personales de CertiDocs conforme al RGPD.',
}

export default function PrivacidadPage() {
  const fecha = '16 de abril de 2026'

  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-gray-100">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <Link href="/" className="text-xl font-bold text-brand-700">CertiDocs</Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-12 prose prose-gray">
        <h1>Política de Privacidad</h1>
        <p className="text-gray-500 text-sm">Última actualización: {fecha}</p>

        <h2>1. Responsable del tratamiento</h2>
        <p>
          CertiDocs es el responsable del tratamiento de los datos personales recogidos a través de esta plataforma.
          Contacto: <a href="mailto:privacidad@certidocs.es">privacidad@certidocs.es</a>
        </p>

        <h2>2. Datos que recopilamos</h2>
        <ul>
          <li><strong>Datos de cuenta:</strong> nombre, correo electrónico y contraseña (cifrada).</li>
          <li><strong>Datos de solicitud:</strong> información personal necesaria para tramitar el certificado solicitado (nombre, fecha de nacimiento, DNI, etc.).</li>
          <li><strong>Datos de pago:</strong> procesados íntegramente por Stripe. No almacenamos datos de tarjeta.</li>
          <li><strong>Datos de uso:</strong> dirección IP, navegador y páginas visitadas con fines de seguridad y análisis.</li>
        </ul>

        <h2>3. Finalidad y base jurídica</h2>
        <ul>
          <li><strong>Prestación del servicio</strong> (Art. 6.1.b RGPD): tramitación de certificados y gestión de la cuenta.</li>
          <li><strong>Obligación legal</strong> (Art. 6.1.c RGPD): conservación de facturas y registros de transacciones.</li>
          <li><strong>Interés legítimo</strong> (Art. 6.1.f RGPD): prevención del fraude y seguridad de la plataforma.</li>
        </ul>

        <h2>4. Conservación de los datos</h2>
        <p>
          Los datos de cuenta se conservan mientras la cuenta esté activa. Los datos de solicitud se conservan durante
          5 años por obligaciones fiscales. Puedes solicitar la eliminación de tu cuenta en cualquier momento.
        </p>

        <h2>5. Tus derechos (RGPD)</h2>
        <p>Tienes derecho a acceder, rectificar, suprimir, oponerte, limitar y portar tus datos. Para ejercerlos, escribe a <a href="mailto:privacidad@certidocs.es">privacidad@certidocs.es</a> indicando tu nombre y email.</p>
        <p>Si consideras que el tratamiento no es conforme, puedes reclamar ante la <a href="https://www.aepd.es" target="_blank" rel="noreferrer">Agencia Española de Protección de Datos (AEPD)</a>.</p>

        <h2>6. Transferencias internacionales</h2>
        <p>
          Utilizamos Stripe (EEUU) y Resend (EEUU), que operan bajo las garantías adecuadas del RGPD
          (cláusulas contractuales tipo o Privacy Shield).
        </p>

        <h2>7. Cookies</h2>
        <p>Usamos únicamente cookies de sesión estrictamente necesarias para el funcionamiento del servicio. No usamos cookies de seguimiento ni publicidad.</p>
      </main>

      <footer className="border-t border-gray-100 py-6 text-center text-sm text-gray-400 mt-12">
        <Link href="/" className="hover:underline">Inicio</Link>
        {' · '}
        <Link href="/terminos" className="hover:underline">Términos</Link>
      </footer>
    </div>
  )
}
