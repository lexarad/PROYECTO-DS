import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const codigo = searchParams.get('codigo')?.toUpperCase().trim()
  const solicitudId = searchParams.get('solicitudId')

  if (!codigo) return NextResponse.json({ valido: false, error: 'Código vacío' })

  // Load code + solicitud in parallel
  const [promo, solicitud, _user] = await Promise.all([
    (prisma as any).codigoPromo.findUnique({ where: { codigo } }),
    solicitudId
      ? prisma.solicitud.findUnique({
          where: { id: solicitudId, userId: session.user.id },
          select: { precio: true, codigoPromo: true, tipo: true, pagado: true },
        })
      : Promise.resolve(null),
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: { plan: true },
    }),
  ])

  if (!promo) return NextResponse.json({ valido: false, error: 'Código no encontrado' })
  if (!promo.activo) return NextResponse.json({ valido: false, error: 'Código desactivado' })
  if (promo.expira && new Date(promo.expira) < new Date()) {
    return NextResponse.json({ valido: false, error: 'Código expirado' })
  }
  if (promo.maxUsos !== null && promo.usos >= promo.maxUsos) {
    return NextResponse.json({ valido: false, error: 'Código agotado' })
  }
  if (solicitud?.codigoPromo) {
    return NextResponse.json({ valido: false, error: 'Ya hay un código aplicado a esta solicitud' })
  }
  if (solicitud?.pagado) {
    return NextResponse.json({ valido: false, error: 'La solicitud ya está pagada' })
  }

  // Calculate final price
  const precioBase = solicitud?.precio ?? 0
  // Plan discount on top is already baked into solicitud.precio,
  // but we apply promo on top of that
  const descuento = promo.descuento
  const precioFinal = +(precioBase * (1 - descuento / 100)).toFixed(2)
  const ahorro = +(precioBase - precioFinal).toFixed(2)

  return NextResponse.json({
    valido: true,
    codigo: promo.codigo,
    descuento,
    precioOriginal: precioBase,
    precioFinal,
    ahorro,
    usosRestantes: promo.maxUsos !== null ? promo.maxUsos - promo.usos : null,
  })
}
