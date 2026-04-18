import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { rateLimit, getClientIp } from '@/lib/ratelimit'

let resendInstance: Resend | null = null

function getResend() {
  if (!resendInstance) {
    resendInstance = new Resend(process.env.RESEND_API_KEY || 're_placeholder_for_build')
  }
  return resendInstance
}

const FROM = process.env.EMAIL_FROM ?? 'CertiDocs <noreply@certidocs.es>'
const SOPORTE_EMAIL = process.env.SOPORTE_EMAIL ?? 'soporte@certidocs.es'

export async function POST(req: NextRequest) {
  const rl = rateLimit(`contacto:${getClientIp(req)}`, { limit: 3, windowSec: 600 })
  if (!rl.allowed) {
    return NextResponse.json({ error: 'Demasiados mensajes. Espera unos minutos.' }, { status: 429 })
  }

  const { nombre, email, asunto, mensaje } = await req.json()

  if (!nombre?.trim() || !email?.trim() || !mensaje?.trim()) {
    return NextResponse.json({ error: 'Faltan campos obligatorios.' }, { status: 400 })
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: 'Email inválido.' }, { status: 400 })
  }
  if (mensaje.length > 2000) {
    return NextResponse.json({ error: 'Mensaje demasiado largo.' }, { status: 400 })
  }

  await getResend().emails.send({
    from: FROM,
    to: SOPORTE_EMAIL,
    replyTo: email,
    subject: `[Contacto] ${asunto || 'Sin asunto'} — ${nombre}`,
    html: `
      <div style="font-family:sans-serif;max-width:560px">
        <h2 style="color:#1d4ed8">Nuevo mensaje de contacto</h2>
        <table style="width:100%;border-collapse:collapse;margin-bottom:16px">
          <tr><td style="padding:6px 0;color:#6b7280;width:100px">Nombre</td><td style="font-weight:600">${nombre}</td></tr>
          <tr><td style="padding:6px 0;color:#6b7280">Email</td><td><a href="mailto:${email}">${email}</a></td></tr>
          <tr><td style="padding:6px 0;color:#6b7280">Asunto</td><td>${asunto || '—'}</td></tr>
        </table>
        <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:6px;padding:16px;white-space:pre-wrap;font-size:14px;color:#374151">
${mensaje}
        </div>
      </div>
    `,
  })

  // Auto-reply to user
  await getResend().emails.send({
    from: FROM,
    to: email,
    subject: 'Hemos recibido tu mensaje — CertiDocs',
    html: `
      <div style="font-family:sans-serif;max-width:560px;margin:0 auto">
        <div style="background:#1d4ed8;padding:20px 24px;border-radius:8px 8px 0 0">
          <h2 style="color:#fff;margin:0;font-size:18px">CertiDocs</h2>
        </div>
        <div style="padding:24px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 8px 8px">
          <p>Hola ${nombre},</p>
          <p style="color:#374151">Hemos recibido tu mensaje y te responderemos en un plazo de 24-48 horas hábiles.</p>
          <p style="color:#374151">Para seguimiento urgente, también puedes responder directamente a este email.</p>
          <hr style="border:none;border-top:1px solid #e5e7eb;margin:20px 0"/>
          <p style="font-size:12px;color:#9ca3af">CertiDocs · soporte@certidocs.es</p>
        </div>
      </div>
    `,
  })

  return NextResponse.json({ ok: true })
}
