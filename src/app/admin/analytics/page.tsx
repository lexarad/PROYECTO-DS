import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { PLANES } from '@/lib/planes'
import {
  GraficoIngresos,
  GraficoUsuarios,
  GraficoTipos,
} from '@/components/admin/GraficosAnalytics'

export const metadata = { title: 'Analytics – CertiDocs Admin' }
export const dynamic = 'force-dynamic'

async function getAnalytics() {
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
    }),
    prisma.user.findMany({
      where: { createdAt: { gte: hace6Meses } },
      select: { createdAt: true },
    }),
    prisma.factura.count(),
  ])

  const mrr = usuariosPorPlan.reduce((acc, g) => {
    const cfg = PLANES.find((p) => p.plan === g.plan)
    return acc + (cfg?.precio ?? 0) * g._count.plan
  }, 0)

  const ingresosPorDia: Record<string, number> = {}
  for (let i = 0; i < 30; i++) {
    const d = new Date(hace30.getTime() + i * 24 * 60 * 60 * 1000)
    ingresosPorDia[d.toISOString().slice(0, 10)] = 0
  }
  for (const s of solicitudesUltimos30) {
    const key = new Date(s.createdAt).toISOString().slice(0, 10)
    if (key in ingresosPorDia) ingresosPorDia[key] += s.precio
  }

  const usuariosPorMes: Record<string, number> = {}
  for (let i = 0; i < 6; i++) {
    const d = new Date(ahora.getFullYear(), ahora.getMonth() - 5 + i, 1)
    usuariosPorMes[`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`] = 0
  }
  for (const u of usuariosUltimos6Meses) {
    const d = new Date(u.createdAt)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    if (key in usuariosPorMes) usuariosPorMes[key]++
  }

  return {
    kpis: {
      totalUsuarios,
      totalSolicitudes,
      solicitudesPagadas,
      tasaConversion: totalSolicitudes > 0 ? +((solicitudesPagadas / totalSolicitudes) * 100).toFixed(1) : 0,
      ingresosTotales: +(ingresosTotales._sum.precio ?? 0).toFixed(2),
      ingresosMes: +(ingresosMes._sum.precio ?? 0).toFixed(2),
      mrr,
      totalFacturas,
    },
    usuariosPorPlan: usuariosPorPlan.map((g) => ({ plan: g.plan, count: g._count.plan })),
    solicitudesPorTipo: solicitudesPorTipo.map((g) => ({
      tipo: g.tipo.replace(/_/g, ' '),
      count: g._count.tipo,
      ingresos: +(g._sum.precio ?? 0).toFixed(2),
    })),
    ingresosDiarios: Object.entries(ingresosPorDia).map(([fecha, total]) => ({
      fecha: fecha.slice(5),
      total: +total.toFixed(2),
    })),
    usuariosMensuales: Object.entries(usuariosPorMes).map(([mes, count]) => ({
      mes: mes.slice(5) + '/' + mes.slice(2, 4),
      count,
    })),
  }
}

function KpiCard({ label, value, sub, color = 'gray' }: {
  label: string
  value: string | number
  sub?: string
  color?: 'gray' | 'green' | 'blue' | 'purple' | 'orange'
}) {
  const colors = {
    gray:   'text-gray-900',
    green:  'text-green-600',
    blue:   'text-blue-600',
    purple: 'text-purple-600',
    orange: 'text-orange-500',
  }
  return (
    <div className="card p-5">
      <p className="text-xs text-gray-400 uppercase tracking-wide font-medium mb-2">{label}</p>
      <p className={`text-2xl font-bold ${colors[color]}`}>{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  )
}

const PLAN_COLORS: Record<string, string> = {
  FREE: 'bg-gray-100 text-gray-600',
  PRO: 'bg-blue-100 text-blue-700',
  ENTERPRISE: 'bg-purple-100 text-purple-700',
}

export default async function AnalyticsPage() {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'ADMIN') redirect('/dashboard')

  const data = await getAnalytics()
  const { kpis, solicitudesPorTipo, ingresosDiarios, usuariosMensuales, usuariosPorPlan } = data

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Analytics</h1>
        <p className="text-gray-500 text-sm mt-0.5">Métricas en tiempo real del negocio</p>
      </div>

      {/* KPIs principales */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <KpiCard label="MRR" value={`${kpis.mrr} €`} sub="ingresos recurrentes/mes" color="green" />
        <KpiCard label="Ingresos este mes" value={`${kpis.ingresosMes.toFixed(2)} €`} color="green" />
        <KpiCard label="Ingresos totales" value={`${kpis.ingresosTotales.toFixed(2)} €`} color="gray" />
        <KpiCard label="Facturas emitidas" value={kpis.totalFacturas} color="blue" />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <KpiCard label="Usuarios totales" value={kpis.totalUsuarios} color="blue" />
        <KpiCard label="Solicitudes pagadas" value={kpis.solicitudesPagadas} sub={`de ${kpis.totalSolicitudes} totales`} color="blue" />
        <KpiCard label="Tasa de conversión" value={`${kpis.tasaConversion}%`} color={kpis.tasaConversion >= 60 ? 'green' : 'orange'} />
        <div className="card p-5">
          <p className="text-xs text-gray-400 uppercase tracking-wide font-medium mb-3">Usuarios por plan</p>
          <div className="flex flex-col gap-1.5">
            {usuariosPorPlan.map((g) => (
              <div key={g.plan} className="flex items-center justify-between">
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${PLAN_COLORS[g.plan] ?? 'bg-gray-100 text-gray-600'}`}>
                  {g.plan}
                </span>
                <span className="text-sm font-bold text-gray-900">{g.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="card p-5 lg:col-span-2">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">Ingresos diarios — últimos 30 días</h2>
          <GraficoIngresos data={ingresosDiarios} />
        </div>

        <div className="card p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">Usuarios nuevos por mes</h2>
          <GraficoUsuarios data={usuariosMensuales} />
        </div>
      </div>

      <div className="card p-5">
        <h2 className="text-sm font-semibold text-gray-700 mb-5">
          Certificados más solicitados
          <span className="font-normal text-gray-400 ml-2">(solicitudes pagadas)</span>
        </h2>
        {solicitudesPorTipo.length === 0 ? (
          <p className="text-sm text-gray-400">Sin datos aún</p>
        ) : (
          <GraficoTipos data={solicitudesPorTipo} />
        )}
      </div>
    </div>
  )
}
