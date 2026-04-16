import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)
const FROM = process.env.EMAIL_FROM ?? 'CertiDocs <noreply@certidocs.es>'

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
        <p>Puedes seguir el estado de tu solicitud en tu <a href="${process.env.NEXTAUTH_URL}/dashboard" style="color:#2563eb">área de cliente</a>.</p>
        <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0"/>
        <p style="font-size:12px;color:#9ca3af">CertiDocs · Tramitación de documentos legales online</p>
      </div>
    `,
  })
}
