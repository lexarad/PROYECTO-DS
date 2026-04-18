import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { PLANES } from '@/lib/planes'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (session?.user?.role !== 'ADMIN') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  const ahora = new Date()
  const hace30 = new Date(ahora.getTime() - 30 * 24 * 60 * 60 * 1000)
  const hace6Meses = new Date(ahora.getFullYear(), ahora.getMonth() - 5, 1)

  const [
    totalUsuarios,
    usuariosPorPlan,
    totalSolicitudes,
    solicitudesPagadas,
    ingresosTotales,
    ingresosMes,
    solicitudesPorTipo,
    solicitudesUltimos30,
    usuariosUltimos6Meses,
    totalFacturas,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.groupBy({ by: ['plan'], _count: { plan: true } }),
    prisma.solicitud.count(),
    prisma.solicitud.count({ where: { pagado: true } }),
    prisma.solicitud.aggregate({ where: { pagado: true }, _sum: { precio: true } }),
    prisma.solicitud.aggregate({
      where: { pagado: true, createdAt: { gte: new Date(ahora.getFullYear(), ahora.getMonth(), 1) } },
      _sum: { precio: true },
    }),
    prisma.solicitud.groupBy({
      by: ['tipo'],
      where: { pagado: true },
      _count: { tipo: true },
      _sum: { precio: true },
      orderBy: { _count: { tipo: 'desc' } },
    }),
    prisma.solicitud.findMany({
      where: { pagado: true, createdAt: { gte: hace30 } },
      select: { createdAt: true, precio: true },
      orderBy: { createdAt: 'asc' },
    }),
    prisma.user.findMany({
      where: { createdAt: { gte: hace6Meses } },
      select: { createdAt: true },
    }),
    prisma.factura.count(),
  ])

  // MRR desde suscripciones activas
  const mrr = usuariosPorPlan.reduce((acc, grupo) => {
    const planCfg = PLANES.find((p) => p.plan === grupo.plan)
    if (!planCfg || planCfg.precio === 0) return acc
    return acc + planCfg.precio * grupo._count.plan
  }, 0)

  // Ingresos por día (últimos 30 días)
  const ingresosPorDia: Record<string, number> = {}
  for (let i = 0; i < 30; i++) {
    const d = new Date(hace30.getTime() + i * 24 * 60 * 60 * 1000)
    const key = d.toISOString().slice(0, 10)
    ingresosPorDia[key] = 0
  }
  for (const s of solicitudesUltimos30) {
    const key = new Date(s.createdAt).toISOString().slice(0, 10)
    if (key in ingresosPorDia) ingresosPorDia[key] += s.precio
  }
  const ingresosDiarios = Object.entries(ingresosPorDia).map(([fecha, total]) => ({
    fecha: fecha.slice(5), // MM-DD
    total: parseFloat(total.toFixed(2)),
  }))

  // Usuarios nuevos por mes (últimos 6 meses)
  const usuariosPorMes: Record<string, number> = {}
  for (let i = 0; i < 6; i++) {
    const d = new Date(ahora.getFullYear(), ahora.getMonth() - 5 + i, 1)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    usuariosPorMes[key] = 0
  }
  for (const u of usuariosUltimos6Meses) {
    const d = new Date(u.createdAt)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    if (key in usuariosPorMes) usuariosPorMes[key]++
  }
  const usuariosMensuales = Object.entries(usuariosPorMes).map(([mes, count]) => ({
    mes: mes.slice(5) + '/' + mes.slice(0, 4).slice(2), // MM/YY
    count,
  }))

  // Tasa de conversión
  const tasaConversion = totalSolicitudes > 0
    ? parseFloat(((solicitudesPagadas / totalSolicitudes) * 100).toFixed(1))
    : 0

  return NextResponse.json({
    kpis: {
      totalUsuarios,
      totalSolicitudes,
      solicitudesPagadas,
      tasaConversion,
      ingresosTotales: parseFloat((ingresosTotales._sum.precio ?? 0).toFixed(2)),
      ingresosMes: parseFloat((ingresosMes._sum.precio ?? 0).toFixed(2)),
      mrr,
      totalFacturas,
    },
    usuariosPorPlan: usuariosPorPlan.map((g) => ({
      plan: g.plan,
      count: g._count.plan,
    })),
    solicitudesPorTipo: solicitudesPorTipo.map((g) => ({
      tipo: g.tipo.replace(/_/g, ' '),
      count: g._count.tipo,
      ingresos: parseFloat((g._sum.precio ?? 0).toFixed(2)),
    })),
    ingresosDiarios,
    usuariosMensuales,
  })
}
