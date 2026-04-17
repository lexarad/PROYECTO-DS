import Link from 'next/link'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Términos y Condiciones',
  description: 'Términos y condiciones del servicio de tramitación de certificados legales CertiDocs.',
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

      <main className="max-w-3xl mx-auto px-4 py-12 prose prose-gray max-w-none">
        <h1>Términos y Condiciones del Servicio</h1>
        <p className="text-gray-500 text-sm">Última actualización: {fecha}</p>

        <h2>1. Identificación del prestador</h2>
        <p>
          En cumplimiento de la Ley 34/2002, de 11 de julio, de Servicios de la Sociedad de la
          Información y del Comercio Electrónico (LSSI-CE), se facilitan los siguientes datos:
        </p>
        <ul>
          <li><strong>Titular:</strong> Víctor Heredia Hernández</li>
          <li><strong>Domicilio:</strong> Via Laietana 59, 4.º 1.ª, 08003 Barcelona</li>
          <li><strong>Correo electrónico:</strong> <a href="mailto:info@certidocs.es">info@certidocs.es</a></li>
          <li><strong>Plataforma:</strong> CertiDocs</li>
        </ul>

        <h2>2. Objeto y naturaleza del servicio</h2>
        <p>
          CertiDocs es una plataforma de gestión y tramitación de solicitudes de certificados y
          documentos legales ante organismos públicos españoles (Ministerio de Justicia, Registro
          Civil, Seguridad Social, Ayuntamientos, etc.).
        </p>
        <p>
          CertiDocs actúa exclusivamente como <strong>intermediario gestor</strong>, de manera análoga
          a una gestoría o asesoría tradicional, sin ser organismo público ni tener capacidad de
          emitir directamente certificados oficiales. Los certificados son emitidos únicamente por los
          organismos públicos competentes.
        </p>
        <p>
          La aceptación de estos términos implica que el usuario reconoce y acepta este carácter
          intermediario del servicio.
        </p>

        <h2>3. Condiciones de acceso y uso</h2>
        <p>
          Para utilizar el servicio el usuario debe ser mayor de 18 años o contar con autorización
          parental. El usuario se compromete a:
        </p>
        <ul>
          <li>Facilitar datos verídicos, exactos y completos.</li>
          <li>No utilizar el servicio en nombre de terceros sin autorización expresa y acreditada.</li>
          <li>No hacer un uso fraudulento, ilícito o contrario a la buena fe del servicio.</li>
          <li>Mantener la confidencialidad de sus credenciales de acceso.</li>
        </ul>
        <p>
          CertiDocs se reserva el derecho a suspender o cancelar el acceso al usuario que incumpla
          estas condiciones, sin perjuicio de las acciones legales que pudieran corresponder.
        </p>

        <h2>4. Proceso de contratación</h2>
        <p>
          El proceso de contratación se realiza íntegramente en español y sigue los siguientes pasos:
        </p>
        <ol>
          <li>Selección del certificado y cumplimentación del formulario con los datos necesarios.</li>
          <li>Revisión del resumen del pedido (tipo de certificado, precio y datos introducidos).</li>
          <li>Pago seguro mediante tarjeta bancaria a través de Stripe.</li>
          <li>Confirmación automática por correo electrónico con número de referencia.</li>
          <li>Tramitación por CertiDocs ante el organismo competente.</li>
          <li>Entrega del certificado por correo electrónico al cliente.</li>
        </ol>
        <p>
          El contrato se perfecciona en el momento en que CertiDocs confirma la recepción del pago.
          CertiDocs remitirá al usuario un justificante de pago por correo electrónico.
        </p>

        <h2>5. Precios, impuestos y facturación</h2>
        <p>
          Los precios mostrados en la plataforma incluyen el servicio de gestión y tramitación de
          CertiDocs. <strong>No incluyen</strong> tasas administrativas que pudieran exigir los
          organismos públicos; en tal caso, se informará al usuario antes de confirmar el pedido.
        </p>
        <p>
          Los precios se expresan en euros (€). De conformidad con la Ley 37/1992 del IVA, el
          servicio puede estar sujeto a IVA según el tipo aplicable en cada momento. El usuario
          puede solicitar factura a <a href="mailto:facturacion@certidocs.es">facturacion@certidocs.es</a>.
        </p>

        <h2>6. Derecho de desistimiento</h2>
        <p>
          De conformidad con el Real Decreto Legislativo 1/2007 (TRLGDCU) y la Directiva 2011/83/UE
          sobre derechos de los consumidores, el usuario dispone de un plazo de <strong>14 días
          naturales</strong> para desistir del contrato sin necesidad de justificación.
        </p>
        <p>
          No obstante, <strong>el derecho de desistimiento no será aplicable</strong> una vez que
          CertiDocs haya iniciado la tramitación ante el organismo público, dado que se trata de
          un servicio cuya ejecución ha comenzado con el consentimiento expreso del consumidor
          (Art. 103.a TRLGDCU).
        </p>
        <p>
          Para ejercer el desistimiento antes del inicio de la tramitación, el usuario debe
          comunicarlo a <a href="mailto:info@certidocs.es">info@certidocs.es</a> indicando su
          número de referencia.
        </p>

        <h2>7. Política de reembolsos</h2>
        <ul>
          <li>
            Si la solicitud no puede tramitarse por causas exclusivamente imputables a CertiDocs,
            se realizará un <strong>reembolso íntegro</strong> en el plazo máximo de 14 días hábiles.
          </li>
          <li>
            Si el organismo público deniega o no puede emitir el certificado por causas ajenas a
            CertiDocs (datos incorrectos proporcionados por el usuario, documentación insuficiente,
            resolución administrativa denegatoria), no procederá reembolso de la tarifa de gestión.
          </li>
          <li>
            Las solicitudes canceladas antes de su envío al organismo serán reembolsadas íntegramente
            descontando los costes de transacción bancaria no recuperables.
          </li>
        </ul>

        <h2>8. Plazos de tramitación</h2>
        <p>
          Los plazos indicados en la plataforma son estimados y dependen de los tiempos de respuesta
          de los organismos públicos competentes, que CertiDocs no puede controlar. CertiDocs
          iniciará la tramitación en el menor tiempo posible tras la confirmación del pago, en
          todo caso en un plazo no superior a 2 días hábiles.
        </p>

        <h2>9. Limitación de responsabilidad</h2>
        <p>CertiDocs no será responsable de:</p>
        <ul>
          <li>Retrasos, denegaciones o errores producidos por los organismos públicos competentes.</li>
          <li>La inexactitud de los datos facilitados por el usuario que impida la tramitación.</li>
          <li>Interrupciones del servicio por causas de fuerza mayor o ajenas a CertiDocs.</li>
          <li>Decisiones administrativas de organismos públicos.</li>
        </ul>
        <p>
          La responsabilidad máxima de CertiDocs frente al usuario quedará limitada al importe
          abonado por el servicio contratado.
        </p>

        <h2>10. Propiedad intelectual</h2>
        <p>
          Todos los contenidos de la plataforma (diseño, textos, logotipos, código) son titularidad
          de Víctor Heredia Hernández o sus licenciantes, protegidos por la legislación española e
          internacional sobre propiedad intelectual e industrial. Queda prohibida su reproducción
          total o parcial sin autorización expresa.
        </p>

        <h2>11. Protección de datos</h2>
        <p>
          El tratamiento de datos personales se rige por nuestra{' '}
          <Link href="/privacidad">Política de Privacidad</Link>, que forma parte integrante de
          estos términos y condiciones.
        </p>

        <h2>12. Modificaciones del servicio</h2>
        <p>
          CertiDocs se reserva el derecho a modificar, suspender o interrumpir el servicio en
          cualquier momento, notificándolo con antelación razonable salvo causa de fuerza mayor.
          Las modificaciones de precios se comunicarán con al menos 30 días de antelación.
        </p>

        <h2>13. Legislación aplicable y jurisdicción</h2>
        <p>
          Estos términos se rigen por la legislación española, en particular la LSSI-CE, el
          TRLGDCU y el Código Civil. Para la resolución de controversias, las partes se someten,
          con renuncia expresa a cualquier otro fuero, a los Juzgados y Tribunales de
          <strong> Barcelona</strong>, sin perjuicio del fuero imperativo que pudiera corresponder
          al consumidor en virtud del Art. 90.2 TRLGDCU.
        </p>
        <p>
          Para la resolución alternativa de litigios de consumo en línea, puede acceder a la
          plataforma europea ODR:{' '}
          <a href="https://ec.europa.eu/consumers/odr" target="_blank" rel="noreferrer">
            ec.europa.eu/consumers/odr
          </a>.
        </p>
      </main>

      <footer className="border-t border-gray-100 py-6 text-center text-sm text-gray-400 mt-12">
        <Link href="/" className="hover:underline">Inicio</Link>
        {' · '}
        <Link href="/privacidad" className="hover:underline">Privacidad</Link>
      </footer>
    </div>
  )
}
