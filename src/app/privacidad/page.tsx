import Link from 'next/link'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Política de Privacidad',
  description: 'Política de privacidad y tratamiento de datos personales de CertiDocs conforme al RGPD y la LOPDGDD.',
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

      <main className="max-w-3xl mx-auto px-4 py-12 text-gray-800 dark:text-gray-200 space-y-6 [&_h2]:text-xl [&_h2]:font-bold [&_h2]:mt-8 [&_h2]:mb-3 [&_h2]:text-gray-900 [&_h2]:dark:text-gray-100 [&_p]:leading-relaxed [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:space-y-2 [&_li]:text-gray-700 [&_li]:dark:text-gray-300 [&_a]:text-brand-600 [&_a]:underline [&_strong]:font-semibold [&_table]:w-full [&_table]:border-collapse [&_th]:text-left [&_th]:py-2 [&_th]:px-3 [&_th]:bg-gray-100 [&_th]:dark:bg-gray-800 [&_th]:font-semibold [&_th]:text-sm [&_td]:py-2 [&_td]:px-3 [&_td]:border-b [&_td]:border-gray-200 [&_td]:dark:border-gray-700 [&_td]:text-sm">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Política de Privacidad</h1>
        <p className="text-gray-500 text-sm">Última actualización: {fecha}</p>

        <h2>1. Responsable del tratamiento</h2>
        <p>
          En cumplimiento del Reglamento (UE) 2016/679 del Parlamento Europeo y del Consejo (RGPD) y
          la Ley Orgánica 3/2018, de 5 de diciembre, de Protección de Datos Personales y garantía de
          los derechos digitales (LOPDGDD), se le informa que el responsable del tratamiento de los
          datos personales recogidos a través de esta plataforma es:
        </p>
        <ul>
          <li><strong>Titular:</strong> Víctor Heredia Hernández</li>
          <li><strong>Domicilio:</strong> Via Laietana 59, 4.º 1.ª, 08003 Barcelona</li>
          <li><strong>Correo de contacto:</strong>{' '}
            <a href="mailto:privacidad@certidocs.es">privacidad@certidocs.es</a>
          </li>
        </ul>

        <h2>2. Datos que recopilamos</h2>
        <ul>
          <li>
            <strong>Datos de identificación y cuenta:</strong> nombre, correo electrónico y contraseña
            (almacenada de forma cifrada e irreversible mediante bcrypt).
          </li>
          <li>
            <strong>Datos de solicitud:</strong> información personal necesaria para tramitar el
            certificado solicitado ante los organismos públicos correspondientes (nombre completo,
            fecha y lugar de nacimiento, DNI/NIE, domicilio, etc.).
          </li>
          <li>
            <strong>Datos de pago:</strong> el proceso de pago es gestionado íntegramente por Stripe
            Payments Europe, Ltd. CertiDocs no almacena en ningún momento datos de tarjetas bancarias.
          </li>
          <li>
            <strong>Datos técnicos:</strong> dirección IP y agente de usuario, con fines de seguridad
            y prevención del fraude.
          </li>
          <li>
            <strong>Datos de comunicación:</strong> cuando nos contactas por correo electrónico,
            conservamos el contenido de la comunicación.
          </li>
        </ul>

        <h2>3. Finalidad del tratamiento y base jurídica</h2>
        <table>
          <thead>
            <tr>
              <th>Finalidad</th>
              <th>Base jurídica</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Gestión de la cuenta de usuario</td>
              <td>Art. 6.1.b RGPD — ejecución de contrato</td>
            </tr>
            <tr>
              <td>Tramitación de certificados ante organismos públicos</td>
              <td>Art. 6.1.b RGPD — ejecución de contrato</td>
            </tr>
            <tr>
              <td>Procesamiento del pago</td>
              <td>Art. 6.1.b RGPD — ejecución de contrato</td>
            </tr>
            <tr>
              <td>Cumplimiento de obligaciones fiscales y contables</td>
              <td>Art. 6.1.c RGPD — obligación legal</td>
            </tr>
            <tr>
              <td>Prevención del fraude y seguridad del servicio</td>
              <td>Art. 6.1.f RGPD — interés legítimo</td>
            </tr>
            <tr>
              <td>Envío de comunicaciones sobre el estado de la solicitud</td>
              <td>Art. 6.1.b RGPD — ejecución de contrato</td>
            </tr>
          </tbody>
        </table>

        <h2>4. Conservación de los datos</h2>
        <p>
          Los datos de cuenta se conservan mientras la cuenta permanezca activa y durante los
          plazos legalmente exigidos tras su cancelación. Los datos de solicitud y facturación
          se conservan durante <strong>5 años</strong> en cumplimiento de la normativa fiscal
          española (Ley 58/2003 General Tributaria y Real Decreto 1619/2012 sobre facturación).
          Los datos de comunicaciones se conservan durante <strong>2 años</strong>.
        </p>

        <h2>5. Destinatarios y transferencias internacionales</h2>
        <p>Los datos podrán ser comunicados a los siguientes destinatarios:</p>
        <ul>
          <li>
            <strong>Organismos públicos españoles</strong> (Ministerio de Justicia, Registro Civil,
            Seguridad Social, Ayuntamientos): exclusivamente los datos necesarios para tramitar el
            certificado solicitado, en cumplimiento del contrato.
          </li>
          <li>
            <strong>Stripe Payments Europe, Ltd.</strong> (procesador de pagos): con sede en Irlanda
            y operaciones en la UE. Datos de pago tratados bajo el RGPD. Más información en{' '}
            <a href="https://stripe.com/es/privacy" target="_blank" rel="noreferrer">stripe.com/es/privacy</a>.
          </li>
          <li>
            <strong>Resend Inc.</strong> (envío de correos transaccionales): con sede en EE.UU.,
            bajo garantías adecuadas mediante Cláusulas Contractuales Tipo aprobadas por la Comisión
            Europea (Art. 46 RGPD).
          </li>
          <li>
            <strong>Supabase Inc.</strong> (base de datos): con sede en EE.UU., los datos se
            almacenan en servidores de la UE (Frankfurt) bajo Cláusulas Contractuales Tipo.
          </li>
        </ul>
        <p>
          No se realizan otras transferencias internacionales ni cesiones a terceros no autorizados.
        </p>

        <h2>6. Derechos del interesado</h2>
        <p>
          De conformidad con el RGPD y la LOPDGDD, puedes ejercer en cualquier momento los siguientes
          derechos dirigiendo un escrito a <a href="mailto:privacidad@certidocs.es">privacidad@certidocs.es</a>,
          indicando tu nombre completo y el derecho que deseas ejercer:
        </p>
        <ul>
          <li><strong>Acceso:</strong> conocer qué datos tratamos sobre ti.</li>
          <li><strong>Rectificación:</strong> corregir datos inexactos o incompletos.</li>
          <li><strong>Supresión («derecho al olvido»):</strong> eliminar tus datos cuando ya no sean necesarios.</li>
          <li><strong>Oposición:</strong> oponerte al tratamiento basado en interés legítimo.</li>
          <li><strong>Limitación:</strong> restringir el tratamiento en determinadas circunstancias.</li>
          <li><strong>Portabilidad:</strong> recibir tus datos en formato estructurado y legible por máquina.</li>
          <li><strong>No ser objeto de decisiones automatizadas:</strong> no tomamos decisiones únicamente automatizadas con efectos jurídicos significativos.</li>
        </ul>
        <p>
          Atenderemos tu solicitud en el plazo máximo de <strong>un mes</strong> (prorrogable dos meses
          más si la complejidad lo requiere). Si no quedas satisfecho, puedes reclamar ante la{' '}
          <a href="https://www.aepd.es" target="_blank" rel="noreferrer">
            Agencia Española de Protección de Datos (AEPD)
          </a>.
        </p>

        <h2>7. Seguridad</h2>
        <p>
          Aplicamos medidas técnicas y organizativas adecuadas para proteger tus datos: cifrado TLS
          en tránsito, cifrado de contraseñas con bcrypt, control de acceso por roles, y entornos de
          producción separados. No obstante, ningún sistema es infalible; en caso de brecha de
          seguridad que afecte a tus derechos, serás notificado en los plazos previstos por el RGPD.
        </p>

        <h2>8. Cookies</h2>
        <p>
          Utilizamos exclusivamente cookies de sesión técnicamente necesarias para el funcionamiento
          del servicio (autenticación). No usamos cookies de seguimiento, publicidad ni analítica de
          terceros. No es necesario un banner de cookies ya que las cookies utilizadas están exentas
          del requisito de consentimiento conforme al Art. 22.2 de la LSSI-CE.
        </p>

        <h2>9. Menores de edad</h2>
        <p>
          El servicio no está dirigido a menores de 14 años. Si detectamos que hemos recopilado datos
          de un menor sin consentimiento parental, procederemos a su eliminación inmediata.
        </p>

        <h2>10. Modificaciones</h2>
        <p>
          Nos reservamos el derecho a actualizar esta política. Cualquier cambio sustancial será
          comunicado por correo electrónico o mediante aviso destacado en la plataforma.
        </p>
      </main>

      <footer className="border-t border-gray-100 py-6 text-center text-sm text-gray-400 mt-12">
        <Link href="/" className="hover:underline">Inicio</Link>
        {' · '}
        <Link href="/terminos" className="hover:underline">Términos</Link>
      </footer>
    </div>
  )
}
