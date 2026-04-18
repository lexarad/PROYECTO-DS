import { Resend } from 'resend'

let resendInstance: Resend | null = null

function getResend() {
  if (!resendInstance) {
    resendInstance = new Resend(process.env.RESEND_API_KEY || 're_placeholder_for_build')
  }
  return resendInstance
}

const FROM = process.env.EMAIL_FROM ?? 'CertiDocs <noreply@certidocs.es>'

export async function sendRecordatorioPago({
  to,
  nombre,
  tipoCertificado,
  referencia,
  precio,
  checkoutUrl,
  segundo = false,
}: {
  to: string
  nombre: string
  tipoCertificado: string
  referencia: string
  precio: number
  checkoutUrl: string
  segundo?: boolean
}) {
  const subject = segundo
    ? `Último recordatorio — tu solicitud expira pronto (${referencia})`
    : `Tu solicitud está esperando — ${referencia}`

  const cuerpo = segundo
    ? `Tu solicitud de <strong>${tipoCertificado.replace(/_/g, ' ')}</strong> lleva 3 días sin completarse.
       En <strong>4 días</strong> la cancelaremos automáticamente para liberar el hueco.`
    : `Has iniciado una solicitud de <strong>${tipoCertificado.replace(/_/g, ' ')}</strong> pero aún no hemos recibido el pago.
       Tu solicitud te está esperando.`

  const bannerColor = segundo ? '#dc2626' : '#1d4ed8'
  const btnLabel = segundo ? '¡Completar ahora antes de que expire! →' : 'Completar mi solicitud →'

  await getResend().emails.send({
    from: FROM,
    to,
    subject,
    html: `
      <div style="font-family:sans-serif;max-width:560px;margin:0 auto">
        <div style="background:${bannerColor};padding:20px 24px;border-radius:8px 8px 0 0">
          <h2 style="color:#fff;margin:0;font-size:18px">CertiDocs</h2>
          ${segundo ? '<p style="color:#fecaca;margin:4px 0 0;font-size:13px">Último recordatorio antes de cancelar</p>' : ''}
        </div>
        <div style="padding:24px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 8px 8px">
          <p style="margin:0 0 12px">Hola ${nombre},</p>
          <p style="margin:0 0 20px;color:#374151;font-size:14px">${cuerpo}</p>

          <div style="background:${segundo ? '#fef2f2' : '#fef9c3'};border:1px solid ${segundo ? '#fecaca' : '#fde047'};border-radius:8px;padding:16px;margin:0 0 24px">
            <p style="margin:0;font-size:13px;color:${segundo ? '#7f1d1d' : '#713f12'}">
              <strong>Referencia:</strong> <span style="font-family:monospace">${referencia}</span> ·
              <strong>Importe:</strong> ${precio.toFixed(2)} €
            </p>
          </div>

          <a href="${checkoutUrl}"
             style="display:block;background:${bannerColor};color:#fff;padding:14px 20px;border-radius:6px;text-decoration:none;font-size:15px;font-weight:700;text-align:center;margin-bottom:16px">
            ${btnLabel}
          </a>

          <p style="font-size:12px;color:#9ca3af;text-align:center;margin:0">
            ${segundo
              ? 'Si ya no necesitas este certificado, puedes ignorar este email.'
              : 'Si ya no necesitas este certificado, puedes ignorar este email. La solicitud se cancela automáticamente en 7 días.'}
          </p>

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
