import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { Resend } from 'resend'
import crypto from 'crypto'

const resend = new Resend(process.env.RESEND_API_KEY)
const FROM = process.env.EMAIL_FROM ?? 'CertiDocs <noreply@certidocs.es>'

export async function POST(req: NextRequest) {
  const { email } = await req.json()
  if (!email) return NextResponse.json({ error: 'Email requerido' }, { status: 400 })

  // Respuesta siempre OK para no revelar si el email existe
  const user = await prisma.user.findUnique({ where: { email } })
  if (!user) return NextResponse.json({ ok: true })

  // Invalidar tokens previos
  await prisma.passwordResetToken.updateMany({
    where: { email, used: false },
    data: { used: true },
  })

  const token = crypto.randomBytes(32).toString('hex')
  const expires = new Date(Date.now() + 1000 * 60 * 60) // 1 hora

  await prisma.passwordResetToken.create({ data: { email, token, expires } })

  const url = `${process.env.NEXTAUTH_URL}/auth/reset-password?token=${token}`

  await resend.emails.send({
    from: FROM,
    to: email,
    subject: 'Restablecer contraseña – CertiDocs',
    html: `
      <div style="font-family:sans-serif;max-width:560px;margin:0 auto">
        <h2 style="color:#1d4ed8">CertiDocs</h2>
        <p>Hemos recibido una solicitud para restablecer tu contraseña.</p>
        <p>Este enlace expira en <strong>1 hora</strong>.</p>
        <a href="${url}" style="display:inline-block;margin:20px 0;background:#2563eb;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;font-size:14px">
          Restablecer contraseña
        </a>
        <p style="font-size:13px;color:#6b7280">Si no solicitaste este cambio, ignora este correo.</p>
        <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0"/>
        <p style="font-size:12px;color:#9ca3af">CertiDocs · Tramitación de documentos legales online</p>
      </div>
    `,
  })

  return NextResponse.json({ ok: true })
}
