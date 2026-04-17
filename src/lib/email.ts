import { Resend } from 'resend'
import { EstadoSolicitud } from '@prisma/client'

const resend = new Resend(process.env.RESEND_API_KEY)
const FROM = process.env.EMAIL_FROM ?? 'CertiDocs <noreply@certidocs.es>'

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
}: {
  to: string
  nombre: string
  tipoCertificado: string
  referencia: string
  precio: number
  esInvitado?: boolean
}) {
  const baseUrl = process.env.NEXTAUTH_URL ?? 'https://certidocs-xi.vercel.app'
  const seguimientoUrl = `${baseUrl}/seguimiento/${referencia}`

  await resend.emails.send({
    from: FROM,
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
          </table>

          <p style="font-size:14px;color:#374151;margin:0 0 16px">
            Guarda tu número de referencia: <strong style="font-family:monospace">${referencia}</strong>. Te lo pediremos si contactas con nosotros.
          </p>

          <a href="${seguimientoUrl}"
             style="display:block;background:#2563eb;color:#fff;padding:12px 20px;border-radius:6px;text-decoration:none;font-size:14px;font-weight:600;text-align:center;margin-bottom:12px">
            Ver estado de mi solicitud →
          </a>

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

  await resend.emails.send({
    from: FROM,
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
