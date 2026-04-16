import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export async function POST(req: NextRequest) {
  const { token, password } = await req.json()

  if (!token || !password || password.length < 8) {
    return NextResponse.json({ error: 'Datos inválidos.' }, { status: 400 })
  }

  const resetToken = await prisma.passwordResetToken.findUnique({ where: { token } })

  if (!resetToken || resetToken.used || resetToken.expires < new Date()) {
    return NextResponse.json(
      { error: 'El enlace ha expirado o ya fue usado. Solicita uno nuevo.' },
      { status: 400 }
    )
  }

  const hashed = await bcrypt.hash(password, 12)

  await Promise.all([
    prisma.user.update({ where: { email: resetToken.email }, data: { password: hashed } }),
    prisma.passwordResetToken.update({ where: { token }, data: { used: true } }),
  ])

  return NextResponse.json({ ok: true })
}
