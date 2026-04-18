import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { rateLimit, getClientIp } from '@/lib/ratelimit'

export async function POST(req: NextRequest) {
  const rl = rateLimit(`promo:${getClientIp(req)}`, { limit: 20, windowSec: 300 })
  if (!rl.allowed) {
    return NextResponse.json({ error: 'Demasiados intentos.' }, { status: 429 })
  }

  const { codigo } = await req.json()

  if (!codigo?.trim()) {
    return NextResponse.json({ error: 'Código vacío' }, { status: 400 })
  }

  const promo = await (prisma as any).codigoPromo.findUnique({
    where: { codigo: codigo.toUpperCase().trim() },
  })

  if (!promo || !promo.activo) {
    return NextResponse.json({ error: 'Código no válido' }, { status: 404 })
  }

  if (promo.expira && new Date(promo.expira) < new Date()) {
    return NextResponse.json({ error: 'Código expirado' }, { status: 400 })
  }

  if (promo.maxUsos !== null && promo.usos >= promo.maxUsos) {
    return NextResponse.json({ error: 'Código agotado' }, { status: 400 })
  }

  return NextResponse.json({ ok: true, descuento: promo.descuento, codigo: promo.codigo })
}
