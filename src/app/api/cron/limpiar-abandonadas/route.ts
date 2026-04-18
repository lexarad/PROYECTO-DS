import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 30

const DIAS_EXPIRAR = 7

export async function GET(req: NextRequest) {
  const auth = req.headers.get('authorization')
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const hace7d = new Date(Date.now() - DIAS_EXPIRAR * 24 * 60 * 60 * 1000)

  // Solicitudes pendientes de pago creadas hace más de 7 días
  const resultado = await prisma.solicitud.updateMany({
    where: {
      pagado: false,
      estado: 'PENDIENTE',
      createdAt: { lte: hace7d },
    },
    data: {
      estado: 'RECHAZADA',
    },
  })

  // Crear entrada de historial para las canceladas
  const canceladas = await prisma.solicitud.findMany({
    where: {
      pagado: false,
      estado: 'RECHAZADA',
      createdAt: { lte: hace7d },
      historial: { none: { nota: { contains: 'Cancelada automáticamente' } } },
    },
    select: { id: true },
    take: 200,
  })

  if (canceladas.length > 0) {
    await prisma.historialEstado.createMany({
      data: canceladas.map(s => ({
        solicitudId: s.id,
        estado: 'RECHAZADA' as const,
        nota: `Cancelada automáticamente — sin pago en ${DIAS_EXPIRAR} días.`,
      })),
      skipDuplicates: true,
    })
  }

  return NextResponse.json({
    ok: true,
    canceladas: resultado.count,
    timestamp: new Date().toISOString(),
  })
}
