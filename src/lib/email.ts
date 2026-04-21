import { EstadoSolicitud } from '@prisma/client'

const BREVO_API_KEY = process.env.BREVO_API_KEY ?? ''
const FROM_RAW = process.env.EMAIL_FROM ?? 'CertiDocs <victorhh888@gmail.com>'

// Parse "Name <email>" → { name, email }
function parseSender(from: string): { name: string; email: string } {
  const m = from.match(/^(.+?)\s*<(.+?)>$/)
  return m ? { name: m[1].trim(), email: m[2].trim() } : { name: 'CertiDocs', email: from.trim() }
}

const PRE = '<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body>'

async function sendEmail({ to, subject, html }: { to: string; subject: string; html: string }) {
  const sender = parseSender(FROM_RAW)
  const res = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: { 'api-key': BREVO_API_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      sender,
      to: [{ email: to }],
      subject,
      htmlContent: PRE + html + '</body></html>',
    }),
  })
  if (!res.ok) {
    const err = await res.text().catch(() => res.status.toString())
    throw new Error(`Brevo error ${res.status}: ${err}`)
  }
  return res.json()
}

const ESTADO_INFO: Record<EstadoSolicitud, { label: string; color: string; mensaje: string }> = {
  PENDIENTE:  { label: 'Pendiente',             color: '#d97706', mensaje: 'Tu solicitud está pendiente de pago.' },
  EN_PROCESO: { label: 'En proceso',            color: '#2563eb', mensaje: 'Hemos recibido tu pago y estamos tramitando tu certificado.' },
  TRAMITADO:  { label: 'Enviado al organismo',  color: '#ea580c', mensaje: 'Hemos enviado tu solicitud al organismo oficial. Te avisaremos cuando tengamos respuesta.' },
  COMPLETADA: { label: 'Completada',            color: '#16a34a', mensaje: 'Tu certificado está listo. Puedes descargarlo desde tu área de cliente.' },
  RECHAZADA:  { label: 'Rechazada',             color: '#dc2626', mensaje: 'Tu solicitud ha sido rechazada. Contacta con nosotros si tienes dudas.' },
}

export async function sendConfirmacionPago({
  to,
  nombre,
  tipoCertificado,
  referencia,
  precio,
  esInvitado = false,
  facturaId,
  entrega,
}: {
  to: string
  nombre: string
  tipoCertificado: string
  referencia: string
  precio: number
  esInvitado?: boolean
  facturaId?: string
  entrega?: { metodo: 'email' | 'postal'; nombre?: string; direccion?: string; cp?: string; ciudad?: string; pais?: string }
}) {
  const baseUrl = process.env.NEXTAUTH_URL ?? 'https://certidocs-xi.vercel.app'
  const seguimientoUrl = `${baseUrl}/seguimiento/${referencia}`
  const facturaUrl = facturaId ? `${baseUrl}/api/facturas/${facturaId}/pdf` : null

  await sendEmail({
    to,
    subject: `Pago confirmado – ${referencia}`,
    html: `
      <div style="font-family:sans-serif;max-width:560px;margin:0 auto">
        <div style="background:#1d4ed8;padding:20px 24px;border-radius:8px 8px 0 0">
          <h2 style="color:#fff;margin:0;font-size:18px">CertiDocs</h2>
        </div>
        <div style="padding:24px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 8px 8px">
          <p style="margin:0 0 16px">Hola ${nombre},</p>
          <p style="margin:0 0 20px;color:#374151">Tu pago ha sido confirmado. Estamos tramitando tu solicitud.</p>

          <table style="width:100%;border-collapse:collapse;margin:0 0 24px;background:#f9fafb;border-radius:6px;padding:16px">
            <tr>
              <td style="padding:8px 16px;color:#6b7280;font-size:14px">Certificado</td>
              <td style="padding:8px 16px;font-weight:600;font-size:14px">${tipoCertificado.replace(/_/g, ' ')}</td>
            </tr>
            <tr style="background:#fff">
              <td style="padding:8px 16px;color:#6b7280;font-size:14px">Referencia</td>
              <td style="padding:8px 16px;font-weight:700;font-family:monospace;font-size:15px">${referencia}</td>
            </tr>
            <tr>
              <td style="padding:8px 16px;color:#6b7280;font-size:14px">Importe</td>
              <td style="padding:8px 16px;font-weight:600;font-size:14px">${precio.toFixed(2)} €</td>
            </tr>
            <tr style="background:#fff">
              <td style="padding:8px 16px;color:#6b7280;font-size:14px">Entrega</td>
              <td style="padding:8px 16px;font-weight:600;font-size:14px">${entrega?.metodo === 'postal' ? '📬 Correo postal' : '📧 Por email (PDF)'}</td>
            </tr>
          </table>

          ${entrega?.metodo === 'postal' ? `
          <div style="background:#fffbeb;border:1px solid #fde68a;border-radius:6px;padding:12px 16px;margin-bottom:20px;font-size:13px;color:#92400e">
            <strong>Dirección de envío:</strong><br/>
            ${entrega.nombre ?? ''}<br/>
            ${entrega.direccion ?? ''}, ${entrega.cp ?? ''} ${entrega.ciudad ?? ''}<br/>
            ${entrega.pais ?? 'España'}
          </div>` : ''}

          <p style="font-size:14px;color:#374151;margin:0 0 16px">
            Guarda tu número de referencia: <strong style="font-family:monospace">${referencia}</strong>. Te lo pediremos si contactas con nosotros.
          </p>

          <a href="${seguimientoUrl}"
             style="display:block;background:#2563eb;color:#fff;padding:12px 20px;border-radius:6px;text-decoration:none;font-size:14px;font-weight:600;text-align:center;margin-bottom:12px">
            Ver estado de mi solicitud →
          </a>

          ${facturaUrl ? `<a href="${facturaUrl}" style="display:block;background:#f0fdf4;border:1px solid #bbf7d0;color:#16a34a;padding:10px 20px;border-radius:6px;text-decoration:none;font-size:13px;font-weight:600;text-align:center;margin-bottom:8px">
            📄 Descargar factura PDF
          </a>` : ''}

          ${!esInvitado ? `<a href="${baseUrl}/dashboard" style="display:block;background:#f1f5f9;color:#374151;padding:10px 20px;border-radius:6px;text-decoration:none;font-size:13px;text-align:center">
            Ir a mi área de cliente
          </a>` : `<p style="font-size:12px;color:#9ca3af;text-align:center;margin:8px 0 0">
            ¿Quieres gestionar tus solicitudes fácilmente? <a href="${baseUrl}/auth/registro" style="color:#2563eb">Crea una cuenta gratis</a>
          </p>`}

          <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0"/>
          <p style="font-size:12px;color:#9ca3af;margin:0">CertiDocs · Via Laietana 59, 4.º 1.ª, 08003 Barcelona · <a href="mailto:soporte@certidocs.es" style="color:#9ca3af">soporte@certidocs.es</a></p>
        </div>
      </div>
    `,
  })
}

export async function sendBienvenida({ to, nombre }: { to: string; nombre: string }) {
  const baseUrl = process.env.NEXTAUTH_URL ?? 'https://certidocs-xi.vercel.app'

  await sendEmail({
    to,
    subject: `¡Bienvenido a CertiDocs, ${nombre.split(' ')[0]}!`,
    html: `
      <div style="font-family:sans-serif;max-width:560px;margin:0 auto">
        <div style="background:#1d4ed8;padding:20px 24px;border-radius:8px 8px 0 0">
          <h2 style="color:#fff;margin:0;font-size:18px">CertiDocs</h2>
        </div>
        <div style="padding:24px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 8px 8px">
          <p style="margin:0 0 12px;font-size:16px;font-weight:600">Hola ${nombre.split(' ')[0]}, ¡ya estás dentro!</p>
          <p style="margin:0 0 20px;color:#374151;font-size:14px">
            CertiDocs te permite tramitar tus certificados legales en España sin colas ni desplazamientos.
            Te encargamos de todo en menos de 72h hábiles.
          </p>

          <div style="background:#f0f7ff;border-radius:8px;padding:16px 20px;margin-bottom:24px">
            <p style="font-size:13px;font-weight:700;color:#1d4ed8;margin:0 0 10px">Cómo funciona:</p>
            <ol style="margin:0;padding-left:18px;color:#374151;font-size:13px;line-height:1.8">
              <li>Elige el certificado que necesitas</li>
              <li>Rellena el formulario con los datos requeridos</li>
              <li>Paga de forma segura (Stripe)</li>
              <li>Nosotros tramitamos y te enviamos el certificado por email</li>
            </ol>
          </div>

          <a href="${baseUrl}/solicitar"
             style="display:block;background:#1d4ed8;color:#fff;padding:14px 20px;border-radius:6px;text-decoration:none;font-size:15px;font-weight:700;text-align:center;margin-bottom:12px">
            Solicitar mi primer certificado →
          </a>

          <a href="${baseUrl}/dashboard"
             style="display:block;background:#f1f5f9;color:#374151;padding:10px 20px;border-radius:6px;text-decoration:none;font-size:13px;text-align:center">
            Ir a mi área de cliente
          </a>

          <div style="margin-top:24px;padding:16px;background:#fafafa;border-radius:8px;border:1px solid #e5e7eb">
            <p style="font-size:12px;color:#6b7280;margin:0 0 8px;font-weight:600">Certificados disponibles:</p>
            <p style="font-size:12px;color:#9ca3af;margin:0;line-height:1.7">
              Nacimiento · Matrimonio · Defunción · Empadronamiento · Antecedentes Penales · Vida Laboral · Últimas Voluntades · Seguros de Fallecimiento
            </p>
          </div>

          <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0"/>
          <p style="font-size:12px;color:#9ca3af;margin:0">
            CertiDocs · Via Laietana 59, 4.º 1.ª, 08003 Barcelona ·
            <a href="mailto:soporte@certidocs.es" style="color:#9ca3af">soporte@certidocs.es</a>
          </p>
        </div>
      </div>
    `,
  })
}

export async function sendFacturaEmail({
  to,
  nombre,
  facturaId,
  numero,
}: {
  to: string
  nombre: string
  facturaId: string
  numero: string
}) {
  const baseUrl = process.env.NEXTAUTH_URL ?? 'https://certidocs-xi.vercel.app'
  const pdfUrl = `${baseUrl}/api/facturas/${facturaId}/pdf`

  await sendEmail({
    to,
    subject: `Tu factura ${numero} – CertiDocs`,
    html: `
      <div style="font-family:sans-serif;max-width:560px;margin:0 auto">
        <div style="background:#1d4ed8;padding:20px 24px;border-radius:8px 8px 0 0">
          <h2 style="color:#fff;margin:0;font-size:18px">CertiDocs</h2>
        </div>
        <div style="padding:24px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 8px 8px">
          <p style="margin:0 0 16px">Hola ${nombre},</p>
          <p style="margin:0 0 20px;color:#374151">Adjuntamos tu factura <strong>${numero}</strong> correspondiente al pago procesado.</p>

          <a href="${pdfUrl}"
             style="display:block;background:#16a34a;color:#fff;padding:14px 20px;border-radius:6px;text-decoration:none;font-size:15px;font-weight:700;text-align:center;margin-bottom:16px">
            📄 Descargar factura ${numero}
          </a>

          <p style="font-size:12px;color:#9ca3af;margin:16px 0 0;text-align:center">
            También puedes acceder a todas tus facturas desde <a href="${baseUrl}/dashboard/facturas" style="color:#2563eb">Mi área de cliente → Facturas</a>
          </p>

          <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0"/>
          <p style="font-size:12px;color:#9ca3af;margin:0">CertiDocs · Via Laietana 59, 4.º 1.ª, 08003 Barcelona · <a href="mailto:soporte@certidocs.es" style="color:#9ca3af">soporte@certidocs.es</a></p>
        </div>
      </div>
    `,
  })
}

export async function sendCambioEstado({
  to,
  nombre,
  tipoCertificado,
  referencia,
  estado,
  nota,
  documentos = [],
}: {
  to: string
  nombre: string
  tipoCertificado: string
  referencia: string
  estado: EstadoSolicitud
  nota?: string | null
  documentos?: { nombre: string; url: string }[]
}) {
  const info = ESTADO_INFO[estado]
  const baseUrl = process.env.NEXTAUTH_URL ?? 'https://certidocs-xi.vercel.app'
  const seguimientoUrl = `${baseUrl}/seguimiento/${referencia}`

  const docsHtml = documentos.length > 0
    ? `<div style="margin:24px 0">
        <p style="font-weight:600;font-size:15px;margin:0 0 12px">Tu certificado está disponible:</p>
        ${documentos.map((d) => `
          <a href="${d.url}" target="_blank"
             style="display:flex;align-items:center;gap:10px;background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:12px 16px;text-decoration:none;color:#15803d;font-weight:600;font-size:14px;margin-bottom:8px">
            📄 ${d.nombre}
          </a>`).join('')}
      </div>`
    : ''

  const isCompletada = estado === 'COMPLETADA'

  await sendEmail({
    to,
    subject: isCompletada
      ? `Tu certificado está listo — ${referencia}`
      : `Actualización de tu solicitud ${referencia} — ${info.label}`,
    html: `
      <div style="font-family:sans-serif;max-width:560px;margin:0 auto">
        <div style="background:${isCompletada ? '#16a34a' : '#1d4ed8'};padding:20px 24px;border-radius:8px 8px 0 0">
          <h2 style="color:#fff;margin:0;font-size:18px">CertiDocs</h2>
        </div>
        <div style="padding:24px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 8px 8px">
          <p style="margin:0 0 8px">Hola ${nombre},</p>

          <div style="border-left:4px solid ${info.color};padding:12px 16px;background:#f9fafb;border-radius:4px;margin:20px 0">
            <p style="margin:0;font-weight:600;color:${info.color}">${info.label}</p>
            <p style="margin:4px 0 0;font-size:14px;color:#374151">${info.mensaje}</p>
            ${nota ? `<p style="margin:8px 0 0;font-size:13px;color:#6b7280;font-style:italic">"${nota}"</p>` : ''}
          </div>

          <p style="font-size:13px;color:#6b7280">Certificado: <strong style="color:#111">${tipoCertificado.replace(/_/g, ' ')}</strong> · Ref: <span style="font-family:monospace">${referencia}</span></p>

          ${docsHtml}

          <a href="${seguimientoUrl}"
             style="display:block;background:${isCompletada ? '#16a34a' : '#2563eb'};color:#fff;padding:12px 20px;border-radius:6px;text-decoration:none;font-size:14px;font-weight:600;text-align:center;margin-top:${docsHtml ? '8' : '20'}px">
            ${isCompletada ? 'Ver y descargar mi certificado →' : 'Ver estado de mi solicitud →'}
          </a>

          <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0"/>
          <p style="font-size:12px;color:#9ca3af;margin:0">CertiDocs · Via Laietana 59, 4.º 1.ª, 08003 Barcelona · <a href="mailto:soporte@certidocs.es" style="color:#9ca3af">soporte@certidocs.es</a></p>
        </div>
      </div>
    `,
  })
}

export async function sendPedidoRecibido({
  to,
  tipoCertificado,
  referencia,
  precio,
  checkoutUrl,
}: {
  to: string
  tipoCertificado: string
  referencia: string
  precio: number
  checkoutUrl?: string
}) {
  const baseUrl = process.env.NEXTAUTH_URL ?? 'https://certidocs-xi.vercel.app'
  const seguimientoUrl = `${baseUrl}/seguimiento/${referencia}`

  await sendEmail({
    to,
    subject: `Tu solicitud ha sido recibida — ${referencia}`,
    html: `
      <div style="font-family:sans-serif;max-width:560px;margin:0 auto">
        <div style="background:#1d4ed8;padding:20px 24px;border-radius:8px 8px 0 0">
          <h2 style="color:#fff;margin:0;font-size:18px">CertiDocs</h2>
        </div>
        <div style="padding:24px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 8px 8px">
          <p style="margin:0 0 16px;font-size:16px;font-weight:600">Tu solicitud ha sido recibida</p>
          <p style="margin:0 0 20px;color:#374151;font-size:14px">
            Hemos registrado tu solicitud. Para que podamos tramitarla, completa el pago a continuación.
          </p>
          <table style="width:100%;border-collapse:collapse;margin:0 0 24px;background:#f9fafb;border-radius:6px;padding:16px">
            <tr>
              <td style="padding:8px 16px;color:#6b7280;font-size:14px">Certificado</td>
              <td style="padding:8px 16px;font-weight:600;font-size:14px">${tipoCertificado.replace(/_/g, ' ')}</td>
            </tr>
            <tr style="background:#fff">
              <td style="padding:8px 16px;color:#6b7280;font-size:14px">Referencia</td>
              <td style="padding:8px 16px;font-weight:700;font-family:monospace;font-size:15px">${referencia}</td>
            </tr>
            <tr>
              <td style="padding:8px 16px;color:#6b7280;font-size:14px">Importe</td>
              <td style="padding:8px 16px;font-weight:600;font-size:14px">${precio.toFixed(2)}&nbsp;€</td>
            </tr>
          </table>
          ${checkoutUrl ? `<a href="${checkoutUrl}" style="display:block;background:#2563eb;color:#fff;padding:14px 20px;border-radius:6px;text-decoration:none;font-size:15px;font-weight:700;text-align:center;margin-bottom:12px">Completar pago →</a>` : ''}
          <a href="${seguimientoUrl}" style="display:block;background:#f1f5f9;color:#374151;padding:10px 20px;border-radius:6px;text-decoration:none;font-size:13px;text-align:center">Ver estado de mi solicitud</a>
          <p style="font-size:12px;color:#9ca3af;margin:20px 0 0;text-align:center">¿Tienes dudas? Escríbenos a <a href="mailto:soporte@certidocs.es" style="color:#2563eb">soporte@certidocs.es</a></p>
          <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0"/>
          <p style="font-size:12px;color:#9ca3af;margin:0">CertiDocs · Via Laietana 59, 4.&ordm;&nbsp;1.&ordf;, 08003 Barcelona</p>
        </div>
      </div>
    `,
  })
}

export async function sendAlertaMJ({ caidas }: { caidas: string[] }) {
  const adminEmail = process.env.ADMIN_EMAIL ?? 'info@certidocs.es'
  const baseUrl = process.env.NEXTAUTH_URL ?? 'https://certidocs-xi.vercel.app'
  const healthUrl = `${baseUrl}/api/admin/automatizacion/health`

  await sendEmail({
    to: adminEmail,
    subject: `🔴 Sede MJ no responde — automatización pausada`,
    html: `
      <div style="font-family:sans-serif;max-width:560px;margin:0 auto;color:#111">
        <div style="background:#dc2626;padding:20px 24px;border-radius:8px 8px 0 0">
          <h2 style="color:#fff;margin:0;font-size:18px">🔴 Sede del Ministerio de Justicia caída</h2>
          <p style="color:#fecaca;margin:4px 0 0;font-size:13px">El health check no ha podido contactar con la sede electrónica</p>
        </div>
        <div style="background:#fef2f2;padding:20px 24px;border:1px solid #fecaca;border-top:none;border-radius:0 0 8px 8px">
          <p style="font-size:14px;color:#7f1d1d;margin:0 0 12px">Las siguientes URLs no responden:</p>
          <ul style="margin:0 0 20px;padding-left:20px">
            ${caidas.map(url => `<li style="font-size:13px;font-family:monospace;color:#991b1b;margin-bottom:4px">${url}</li>`).join('')}
          </ul>
          <p style="font-size:13px;color:#7f1d1d;margin:0 0 16px">
            Los jobs pendientes se reintentarán automáticamente. Si la caída persiste más de 1 hora, considera pausar el cron manualmente.
          </p>
          <a href="${healthUrl}" style="display:inline-block;background:#dc2626;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none;font-size:13px;font-weight:600">
            Ver health check →
          </a>
        </div>
      </div>
    `,
  })
}

export async function sendAlertaManual({
  jobId,
  solicitudId,
  referencia,
  tipo,
  motivo,
  intentos,
}: {
  jobId: string
  solicitudId: string
  referencia: string
  tipo: string
  motivo: string
  intentos: number
}) {
  const adminEmail = process.env.ADMIN_EMAIL ?? 'info@certidocs.es'
  const baseUrl = process.env.NEXTAUTH_URL ?? 'https://certidocs-xi.vercel.app'
  const jobUrl = `${baseUrl}/admin/automatizacion/${jobId}`
  const solicitudUrl = `${baseUrl}/admin/solicitudes/${solicitudId}`

  await sendEmail({
    to: adminEmail,
    subject: `⚠️ Job requiere intervención manual — ${referencia}`,
    html: `
      <div style="font-family:sans-serif;max-width:580px;margin:0 auto;color:#111">
        <div style="background:#b45309;padding:20px 24px;border-radius:8px 8px 0 0">
          <h2 style="color:#fff;margin:0;font-size:18px">⚠️ Intervención manual requerida</h2>
          <p style="color:#fde68a;margin:4px 0 0;font-size:13px">El bot de automatización no ha podido completar este encargo</p>
        </div>
        <div style="background:#fffbeb;padding:20px 24px;border:1px solid #fde68a;border-top:none;border-radius:0 0 8px 8px">
          <table style="width:100%;border-collapse:collapse;margin-bottom:20px">
            <tr>
              <td style="padding:6px 12px 6px 0;color:#92400e;font-size:13px;width:120px">Referencia</td>
              <td style="padding:6px 0;font-weight:700;font-family:monospace;font-size:14px">${referencia}</td>
            </tr>
            <tr>
              <td style="padding:6px 12px 6px 0;color:#92400e;font-size:13px">Tipo</td>
              <td style="padding:6px 0;font-size:13px;font-weight:600">${tipo.replace(/_/g, ' ')}</td>
            </tr>
            <tr>
              <td style="padding:6px 12px 6px 0;color:#92400e;font-size:13px">Intentos</td>
              <td style="padding:6px 0;font-size:13px">${intentos} (máximo alcanzado)</td>
            </tr>
            <tr>
              <td style="padding:6px 12px 6px 0;color:#92400e;font-size:13px;vertical-align:top">Motivo</td>
              <td style="padding:6px 0;font-size:13px;color:#7c2d12">${motivo}</td>
            </tr>
          </table>
          <div style="display:flex;gap:8px">
            <a href="${jobUrl}" style="display:inline-block;background:#b45309;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none;font-size:13px;font-weight:600;margin-right:8px">
              Ver logs del job →
            </a>
            <a href="${solicitudUrl}" style="display:inline-block;background:#f3f4f6;color:#374151;padding:10px 20px;border-radius:6px;text-decoration:none;font-size:13px;font-weight:600">
              Ver solicitud
            </a>
          </div>
          <p style="font-size:12px;color:#92400e;margin:16px 0 0">
            Accede al panel de tramitación y tramita este certificado manualmente en el organismo correspondiente.
          </p>
        </div>
      </div>
    `,
  })
}

// ── Reembolsos ────────────────────────────────────────────────────────────────

export async function sendConfirmacionReembolso({
  to,
  nombre,
  tipoCertificado,
  referencia,
  importe,
}: {
  to: string
  nombre: string
  tipoCertificado: string
  referencia: string
  importe: number
}) {
  await sendEmail({
    to,
    subject: `Reembolso procesado — ${referencia}`,
    html: `
      <div style="font-family:sans-serif;max-width:560px;margin:0 auto;color:#111">
        <div style="background:#16a34a;padding:20px 24px;border-radius:8px 8px 0 0">
          <h2 style="color:#fff;margin:0;font-size:18px">CertiDocs</h2>
          <p style="color:#bbf7d0;margin:4px 0 0;font-size:13px">Reembolso procesado correctamente</p>
        </div>
        <div style="padding:24px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 8px 8px">
          <p style="margin:0 0 12px">Hola ${nombre},</p>
          <p style="margin:0 0 20px;color:#374151;font-size:14px">
            Hemos procesado el reembolso de tu solicitud de
            <strong>${tipoCertificado.replace(/_/g, ' ')}</strong>.
            El importe aparecerá en tu cuenta en un plazo de <strong>5–10 días hábiles</strong>,
            dependiendo de tu entidad bancaria.
          </p>
          <div style="background:#f0fdf4;border:1px solid #86efac;border-radius:8px;padding:16px;margin:0 0 20px">
            <table style="width:100%;border-collapse:collapse">
              <tr>
                <td style="font-size:13px;color:#166534;padding:4px 0">Referencia</td>
                <td style="font-size:13px;font-weight:700;font-family:monospace;text-align:right">${referencia}</td>
              </tr>
              <tr>
                <td style="font-size:13px;color:#166534;padding:4px 0">Importe reembolsado</td>
                <td style="font-size:15px;font-weight:700;color:#166534;text-align:right">${importe.toFixed(2)} €</td>
              </tr>
            </table>
          </div>
          <p style="font-size:12px;color:#9ca3af;margin:0">
            ¿Tienes alguna duda? Escríbenos a
            <a href="mailto:${process.env.EMPRESA_EMAIL ?? 'soporte@certidocs.es'}" style="color:#16a34a">soporte</a>.
          </p>
        </div>
      </div>
    `,
  })
}

// ── Seguimiento de tramitados ─────────────────────────────────────────────────

export async function sendActualizacionEspera({
  to,
  nombre,
  tipoCertificado,
  referencia,
  diasEspera,
}: {
  to: string
  nombre: string
  tipoCertificado: string
  referencia: string
  diasEspera: number
}) {
  const baseUrl = process.env.NEXTAUTH_URL ?? 'https://certidocs-xi.vercel.app'
  const seguimientoUrl = `${baseUrl}/seguimiento/${referencia}`

  await sendEmail({
    to,
    subject: `Actualización de tu solicitud — ${referencia}`,
    html: `
      <div style="font-family:sans-serif;max-width:560px;margin:0 auto;color:#111">
        <div style="background:#ea580c;padding:20px 24px;border-radius:8px 8px 0 0">
          <h2 style="color:#fff;margin:0;font-size:18px">CertiDocs</h2>
          <p style="color:#fed7aa;margin:4px 0 0;font-size:13px">Actualización sobre tu certificado</p>
        </div>
        <div style="padding:24px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 8px 8px">
          <p style="margin:0 0 12px">Hola ${nombre},</p>
          <p style="margin:0 0 16px;color:#374151;font-size:14px">
            Tu solicitud de <strong>${tipoCertificado.replace(/_/g, ' ')}</strong> está siendo tramitada ante el organismo oficial.
            Ya han pasado <strong>${diasEspera} días</strong> desde que enviamos tu solicitud.
          </p>
          <p style="margin:0 0 20px;color:#374151;font-size:14px">
            Los plazos habituales del Ministerio de Justicia son de <strong>15–25 días hábiles</strong>.
            En cuanto recibamos tu certificado te avisaremos de inmediato.
          </p>
          <a href="${seguimientoUrl}" style="display:inline-block;background:#ea580c;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;font-size:14px;font-weight:600;margin-bottom:16px">
            Ver estado de mi solicitud →
          </a>
          <p style="font-size:12px;color:#9ca3af;margin:12px 0 0">
            ¿Tienes alguna duda? Escríbenos a <a href="mailto:${process.env.EMPRESA_EMAIL ?? 'soporte@certidocs.es'}" style="color:#ea580c">soporte</a> con tu referencia <strong>${referencia}</strong>.
          </p>
        </div>
      </div>
    `,
  })
}

export async function sendAlertaSeguimientoAdmin({
  solicitudId,
  referencia,
  tipoCertificado,
  diasEspera,
  urgente,
}: {
  solicitudId: string
  referencia: string
  tipoCertificado: string
  diasEspera: number
  urgente: boolean
}) {
  const adminEmail = process.env.ADMIN_EMAIL ?? 'info@certidocs.es'
  const baseUrl = process.env.NEXTAUTH_URL ?? 'https://certidocs-xi.vercel.app'
  const solicitudUrl = `${baseUrl}/admin/solicitudes/${solicitudId}`
  const color = urgente ? '#dc2626' : '#d97706'
  const icono = urgente ? '🚨' : '⏰'

  await sendEmail({
    to: adminEmail,
    subject: `${icono} Seguimiento requerido — ${referencia} (${diasEspera}d en organismo)`,
    html: `
      <div style="font-family:sans-serif;max-width:560px;margin:0 auto;color:#111">
        <div style="background:${color};padding:20px 24px;border-radius:8px 8px 0 0">
          <h2 style="color:#fff;margin:0;font-size:18px">${icono} Seguimiento requerido${urgente ? ' — URGENTE' : ''}</h2>
          <p style="color:#fef2f2;margin:4px 0 0;font-size:13px">${diasEspera} días esperando respuesta del organismo</p>
        </div>
        <div style="background:#fafafa;padding:20px 24px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 8px 8px">
          <table style="width:100%;border-collapse:collapse;margin-bottom:16px">
            <tr>
              <td style="padding:6px 12px 6px 0;color:#6b7280;font-size:13px;width:110px">Referencia</td>
              <td style="padding:6px 0;font-weight:700;font-family:monospace">${referencia}</td>
            </tr>
            <tr>
              <td style="padding:6px 12px 6px 0;color:#6b7280;font-size:13px">Tipo</td>
              <td style="padding:6px 0;font-size:13px;font-weight:600">${tipoCertificado.replace(/_/g, ' ')}</td>
            </tr>
            <tr>
              <td style="padding:6px 12px 6px 0;color:#6b7280;font-size:13px">Espera</td>
              <td style="padding:6px 0;font-size:13px;font-weight:600;color:${color}">${diasEspera} días en estado TRAMITADO</td>
            </tr>
          </table>
          <p style="font-size:13px;color:#374151;margin:0 0 16px">
            ${urgente
              ? 'Han superado los 30 días. Considera contactar directamente con el organismo o informar al cliente.'
              : 'Han superado los 15 días. Comprueba el estado en la sede del organismo.'}
          </p>
          <a href="${solicitudUrl}" style="display:inline-block;background:${color};color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none;font-size:13px;font-weight:600">
            Ver solicitud en admin →
          </a>
        </div>
      </div>
    `,
  })
}

export async function sendMensajeCliente({
  adminEmail,
  clienteNombre,
  referencia,
  solicitudId,
  extracto,
}: {
  adminEmail: string
  clienteNombre: string
  referencia: string
  solicitudId: string
  extracto: string
}) {
  const baseUrl = process.env.NEXTAUTH_URL ?? 'https://certidocs-xi.vercel.app'
  const solicitudUrl = `${baseUrl}/admin/solicitudes/${solicitudId}`

  await sendEmail({
    to: adminEmail,
    subject: `💬 Nuevo mensaje del cliente — ${referencia}`,
    html: `
      <div style="font-family:sans-serif;max-width:560px;margin:0 auto;color:#111">
        <div style="background:#1e40af;padding:20px 24px;border-radius:8px 8px 0 0">
          <h2 style="color:#fff;margin:0;font-size:18px">💬 Mensaje del cliente</h2>
          <p style="color:#bfdbfe;margin:4px 0 0;font-size:13px">Ref: ${referencia}</p>
        </div>
        <div style="padding:24px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 8px 8px">
          <p style="margin:0 0 4px;font-size:13px;color:#6b7280">De: <strong style="color:#111">${clienteNombre}</strong></p>
          <blockquote style="margin:12px 0;padding:12px 16px;background:#f8fafc;border-left:3px solid #3b82f6;font-size:14px;color:#374151">
            ${extracto}
          </blockquote>
          <a href="${solicitudUrl}" style="display:inline-block;background:#1d4ed8;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none;font-size:13px;font-weight:600;margin-top:8px">
            Responder en admin →
          </a>
        </div>
      </div>
    `,
  })
}

export async function sendRespuestaAdmin({
  clienteEmail,
  clienteNombre,
  referencia,
  solicitudId,
  extracto,
}: {
  clienteEmail: string
  clienteNombre: string
  referencia: string
  solicitudId: string
  extracto: string
}) {
  const baseUrl = process.env.NEXTAUTH_URL ?? 'https://certidocs-xi.vercel.app'
  const solicitudUrl = `${baseUrl}/dashboard/solicitudes/${solicitudId}`

  await sendEmail({
    to: clienteEmail,
    subject: `Re: tu solicitud ${referencia} — CertiDocs`,
    html: `
      <div style="font-family:sans-serif;max-width:560px;margin:0 auto;color:#111">
        <div style="background:#ea580c;padding:20px 24px;border-radius:8px 8px 0 0">
          <h2 style="color:#fff;margin:0;font-size:18px">Respuesta de CertiDocs</h2>
          <p style="color:#fed7aa;margin:4px 0 0;font-size:13px">Ref: ${referencia}</p>
        </div>
        <div style="padding:24px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 8px 8px">
          <p style="margin:0 0 12px">Hola ${clienteNombre},</p>
          <p style="margin:0 0 8px;font-size:14px;color:#374151">El equipo de CertiDocs ha respondido a tu consulta:</p>
          <blockquote style="margin:12px 0;padding:12px 16px;background:#fff7ed;border-left:3px solid #ea580c;font-size:14px;color:#374151">
            ${extracto}
          </blockquote>
          <a href="${solicitudUrl}" style="display:inline-block;background:#ea580c;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none;font-size:13px;font-weight:600;margin-top:8px">
            Ver conversación completa →
          </a>
          <p style="font-size:12px;color:#9ca3af;margin:16px 0 0">
            Puedes continuar la conversación directamente desde tu área de cliente.
          </p>
        </div>
      </div>
    `,
  })
}

export async function sendPagoFallido({
  to,
  nombre,
  plan,
  proximoIntento,
}: {
  to: string
  nombre: string
  plan: string
  proximoIntento?: Date | null
}) {
  const baseUrl = process.env.NEXTAUTH_URL ?? 'https://certidocs-xi.vercel.app'
  const portalUrl = `${baseUrl}/api/suscripcion/portal`
  const fechaIntento = proximoIntento
    ? new Date(proximoIntento).toLocaleDateString('es-ES', { dateStyle: 'long' })
    : null

  await sendEmail({
    to,
    subject: 'Problema con el pago de tu suscripción — CertiDocs',
    html: `
      <div style="font-family:sans-serif;max-width:560px;margin:0 auto">
        <div style="background:#dc2626;padding:20px 24px;border-radius:8px 8px 0 0">
          <h2 style="color:#fff;margin:0;font-size:18px">CertiDocs</h2>
        </div>
        <div style="padding:24px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 8px 8px">
          <p style="margin:0 0 16px">Hola ${nombre},</p>
          <p style="margin:0 0 12px;color:#374151">
            No hemos podido cobrar el pago de tu suscripción <strong>${plan}</strong>.
          </p>
          <p style="margin:0 0 20px;color:#374151">
            ${fechaIntento
              ? `Volveremos a intentarlo el <strong>${fechaIntento}</strong>. Si el pago sigue sin completarse, tu plan pasará a <strong>Individual (gratuito)</strong> automáticamente.`
              : 'Por favor, actualiza tu método de pago para mantener tu plan activo.'}
          </p>
          <a href="${portalUrl}"
             style="display:block;background:#dc2626;color:#fff;padding:12px 20px;border-radius:6px;text-decoration:none;font-size:14px;font-weight:600;text-align:center;margin-bottom:16px">
            Actualizar método de pago →
          </a>
          <hr style="border:none;border-top:1px solid #e5e7eb;margin:20px 0"/>
          <p style="font-size:12px;color:#9ca3af;margin:0">
            CertiDocs · Si tienes dudas escríbenos a <a href="mailto:soporte@certidocs.es" style="color:#9ca3af">soporte@certidocs.es</a>
          </p>
        </div>
      </div>
    `,
  })
}

export async function sendCreditoReferido({
  to,
  codigoPromo,
  descuento,
  diasValidez,
}: {
  to: string
  codigoPromo: string
  descuento: number
  diasValidez: number
}) {
  const baseUrl = process.env.NEXTAUTH_URL ?? 'https://certidocs-xi.vercel.app'
  await sendEmail({
    to,
    subject: `¡Tu referido ha hecho su primera compra! Tienes un ${descuento}% de descuento`,
    html: `
      <div style="font-family:sans-serif;max-width:560px;margin:0 auto">
        <div style="background:#2563eb;padding:24px 32px;border-radius:8px 8px 0 0">
          <h1 style="color:#fff;margin:0;font-size:20px">¡Gracias por recomendar CertiDocs!</h1>
        </div>
        <div style="background:#fff;padding:32px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 8px 8px">
          <p style="margin:0 0 16px;color:#374151">
            Uno de tus referidos acaba de completar su primera compra. Como agradecimiento, te hemos generado un código de descuento exclusivo:
          </p>
          <div style="background:#f0f9ff;border:2px dashed #2563eb;border-radius:8px;padding:20px;text-align:center;margin:20px 0">
            <p style="margin:0 0 4px;font-size:13px;color:#6b7280;font-weight:500">TU CÓDIGO DE DESCUENTO</p>
            <p style="margin:0;font-size:28px;font-weight:700;font-family:monospace;color:#1d4ed8;letter-spacing:2px">${codigoPromo}</p>
            <p style="margin:8px 0 0;font-size:14px;color:#374151"><strong>${descuento}% de descuento</strong> en tu próxima solicitud</p>
            <p style="margin:4px 0 0;font-size:12px;color:#9ca3af">Válido durante ${diasValidez} días · Un solo uso</p>
          </div>
          <p style="margin:0 0 20px;color:#374151;font-size:14px">
            Aplica el código en el paso de pago de cualquier certificado. Cuantos más amigos refieras, más descuentos acumulas.
          </p>
          <a href="${baseUrl}/dashboard/referidos"
             style="display:inline-block;background:#2563eb;color:#fff;padding:12px 20px;border-radius:6px;text-decoration:none;font-size:14px;font-weight:600">
            Ver mis referidos →
          </a>
          <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0"/>
          <p style="font-size:12px;color:#9ca3af;margin:0">CertiDocs · soporte@certidocs.es</p>
        </div>
      </div>
    `,
  })
}

