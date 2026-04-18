import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { sendBienvenida } from '@/lib/email'
import { rateLimit, getClientIp } from '@/lib/ratelimit'
import { generarReferralCode } from '@/lib/referidos'

export async function POST(req: NextRequest) {
  const rl = rateLimit(`registro:${getClientIp(req)}`, { limit: 5, windowSec: 60 * 10 })
  if (!rl.allowed) {
    return NextResponse.json({ error: 'Demasiados intentos. Espera unos minutos.' }, { status: 429 })
  }

  const { name, email, password, referralCode } = await req.json()

  if (!email || !password || password.length < 8) {
    return NextResponse.json({ error: 'Datos inválidos.' }, { status: 400 })
  }

  const exists = await prisma.user.findUnique({ where: { email } })
  if (exists) {
    return NextResponse.json({ error: 'Ya existe una cuenta con ese email.' }, { status: 409 })
  }

  // Resolver referidor si se proporcionó un código
  let referidoPorId: string | undefined
  if (referralCode?.trim()) {
    const referidor = await prisma.user.findUnique({
      where: { referralCode: referralCode.trim().toUpperCase() },
      select: { id: true },
    })
    if (referidor) referidoPorId = referidor.id
  }

  const hashed = await bcrypt.hash(password, 12)

  // Generar código de referido propio (para que pueda referir a otros desde el primer momento)
  let ownReferralCode: string | undefined
  for (let i = 0; i < 5; i++) {
    const candidate = generarReferralCode()
    const taken = await prisma.user.findUnique({ where: { referralCode: candidate } })
    if (!taken) { ownReferralCode = candidate; break }
  }

  const user = await prisma.user.create({
    data: {
      name,
      email,
      password: hashed,
      referralCode: ownReferralCode,
      ...(referidoPorId ? { referidoPorId } : {}),
    },
  })

  sendBienvenida({ to: email, nombre: user.name ?? email.split('@')[0] }).catch(console.error)

  return NextResponse.json({ ok: true }, { status: 201 })
}
