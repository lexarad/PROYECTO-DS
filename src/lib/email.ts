import { Resend } from 'resend'
import { EstadoSolicitud } from '@prisma/client'

const resend = new Resend(process.env.RESEND_API_KEY)
const FROM = process.env.EMAIL_FROM ?? 'CertiDocs <noreply@certidocs.es>'

const ESTADO_INFO: Record<EstadoSolicitud, { label: string; color: string; mensaje: string }> = {
  PENDIENTE:  { label: 'Pendiente',   color: '#d97706', mensaje: 'Tu solicitud está pendiente de pago.' },
  EN_PROCESO: { label: 'En proceso',  color: '#2563eb', mensaje: 'Hemos recibido tu pago y estamos tramitando tu certificado.' },
  COMPLETADA: { label: 'Completada',  color: '#16a34a', mensaje: 'Tu certificado está listo. Puedes descargarlo desde tu área de cliente.' },
  RECHAZADA:  { label: 'Rechazada',   color: '#dc2626', mensaje: 'Tu solicitud ha sido rechazada. Contacta con nosotros si tienes dudas.' },
}

export async function sendConfirmacionPago({
  to,
  nombre,
  tipoCertificado,
  referencia,
  precio,
}: {
  to: string
  nombre: string
  tipoCertificado: string
  referencia: string
  precio: number
}) {
  await resend.emails.send({
    from: FROM,
    to,
    subject: `Pago confirmado – ${referencia}`,
    html: `
      <div style="font-family:sans-serif;max-width:560px;margin:0 auto">
        <h2 style="color:#1d4ed8">CertiDocs</h2>
        <p>Hola ${nombre},</p>
        <p>Tu pago ha sido confirmado. Estamos tramitando tu solicitud.</p>
        <table style="width:100%;border-collapse:collapse;margin:24px 0">
          <tr>
            <td style="padding:8px 0;color:#6b7280;font-size:14px">Certificado</td>
            <td style="padding:8px 0;font-weight:600">${tipoCertificado.replace(/_/g, ' ')}</td>
          </tr>
          <tr>
            <td style="padding:8px 0;color:#6b7280;font-size:14px">Referencia</td>
            <td style="padding:8px 0;font-weight:600">${referencia}</td>
          </tr>
          <tr>
            <td style="padding:8px 0;color:#6b7280;font-size:14px">Importe</td>
            <td style="padding:8px 0;font-weight:600">${precio.toFixed(2)} €</td>
          </tr>
        </table>
        <p>Puedes seguir el estado de tu solicitud en tu <a href="${process.env.NEXTAUTH_URL}/dashboard" style="color:#2563eb">área de cliente</a> o en la <a href="${process.env.NEXTAUTH_URL}/seguimiento/${referencia}" style="color:#2563eb">página de seguimiento</a>.</p>
        <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0"/>
        <p style="font-size:12px;color:#9ca3af">CertiDocs · Tramitación de documentos legales online</p>
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
}: {
  to: string
  nombre: string
  tipoCertificado: string
  referencia: string
  estado: EstadoSolicitud
  nota?: string | null
}) {
  const info = ESTADO_INFO[estado]
  const baseUrl = process.env.NEXTAUTH_URL ?? 'http://localhost:3000'

  await resend.emails.send({
    from: FROM,
    to,
    subject: `Actualización de tu solicitud ${referencia} — ${info.label}`,
    html: `
      <div style="font-family:sans-serif;max-width:560px;margin:0 auto">
        <h2 style="color:#1d4ed8">CertiDocs</h2>
        <p>Hola ${nombre},</p>
        <p>El estado de tu solicitud <strong>${referencia}</strong> ha cambiado.</p>

        <div style="border-left:4px solid ${info.color};padding:12px 16px;background:#f9fafb;border-radius:4px;margin:20px 0">
          <p style="margin:0;font-weight:600;color:${info.color}">${info.label}</p>
          <p style="margin:4px 0 0;font-size:14px;color:#374151">${info.mensaje}</p>
          ${nota ? `<p style="margin:8px 0 0;font-size:13px;color:#6b7280;font-style:italic">"${nota}"</p>` : ''}
        </div>

        <p style="font-size:14px">Certificado: <strong>${tipoCertificado.replace(/_/g, ' ')}</strong></p>

        <a href="${baseUrl}/seguimiento/${referencia}" style="display:inline-block;margin-top:16px;background:#2563eb;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none;font-size:14px">
          Ver estado de mi solicitud
        </a>

        <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0"/>
        <p style="font-size:12px;color:#9ca3af">CertiDocs · Tramitación de documentos legales online</p>
      </div>
    `,
  })
}
