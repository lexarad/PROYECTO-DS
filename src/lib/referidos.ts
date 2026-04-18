import { prisma } from './prisma'

const CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // sin 0/O/1/I para evitar confusiones
const CODE_LEN = 8
const DESCUENTO_REFERIDO = 15 // % de descuento para el referidor
const DIAS_VALIDEZ = 90

export function generarReferralCode(): string {
  let code = ''
  for (let i = 0; i < CODE_LEN; i++) {
    code += CHARS[Math.floor(Math.random() * CHARS.length)]
  }
  return code
}

export async function obtenerOCrearReferralCode(userId: string): Promise<string> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { referralCode: true },
  })
  if (user?.referralCode) return user.referralCode

  // Generar código único con reintentos
  for (let i = 0; i < 5; i++) {
    const code = generarReferralCode()
    try {
      const updated = await prisma.user.update({
        where: { id: userId },
        data: { referralCode: code },
        select: { referralCode: true },
      })
      return updated.referralCode!
    } catch {
      // Conflicto único — reintentar
    }
  }
  throw new Error('No se pudo generar un código de referido único')
}

export async function getStatsReferidos(userId: string) {
  const [referidos, creditos, user] = await Promise.all([
    prisma.user.findMany({
      where: { referidoPorId: userId },
      select: { id: true, name: true, email: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
    }),
    (prisma as any).creditoReferido.findMany({
      where: { userId },
      select: { id: true, referidoId: true, codigoPromo: true, cantidad: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.user.findUnique({
      where: { id: userId },
      select: { referralCode: true },
    }),
  ])

  return {
    referralCode: user?.referralCode ?? null,
    totalReferidos: referidos.length,
    referidos,
    totalCreditos: creditos.reduce((s: number, c: { cantidad: number }) => s + c.cantidad, 0),
    creditos,
  }
}

type CreditoCreado = { userId: string; codigoPromo: string } | null

export async function procesarCreditoReferido(referidoId: string): Promise<CreditoCreado> {
  const referido = await prisma.user.findUnique({
    where: { id: referidoId },
    select: { referidoPorId: true },
  })
  if (!referido?.referidoPorId) return null

  // Comprobar que no se ha generado ya un crédito para este referido
  const existente = await (prisma as any).creditoReferido.findUnique({
    where: { referidoId },
  })
  if (existente) return null

  // Generar código promo único para el referidor
  const sufijo = Math.random().toString(36).slice(2, 6).toUpperCase()
  const codigoPromo = `REF-${sufijo}`

  const expira = new Date()
  expira.setDate(expira.getDate() + DIAS_VALIDEZ)

  await (prisma as any).codigoPromo.create({
    data: {
      codigo: codigoPromo,
      descuento: DESCUENTO_REFERIDO,
      maxUsos: 1,
      expira,
    },
  })

  await (prisma as any).creditoReferido.create({
    data: {
      userId: referido.referidoPorId,
      referidoId,
      codigoPromo,
      cantidad: 5,
    },
  })

  return { userId: referido.referidoPorId, codigoPromo }
}
