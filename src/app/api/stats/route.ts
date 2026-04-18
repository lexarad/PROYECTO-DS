import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const revalidate = 3600 // revalidar cada hora
export const dynamic = 'force-dynamic'

export async function GET() {
  const [certificadosTramitados, usuariosRegistrados, tiposUnicos] = await Promise.all([
    prisma.solicitud.count({ where: { pagado: true } }),
    prisma.user.count(),
    prisma.solicitud.groupBy({ by: ['tipo'], where: { pagado: true } }),
  ])

  return NextResponse.json({
    certificadosTramitados,
    usuariosRegistrados,
    tiposDisponibles: tiposUnicos.length,
  })
}
