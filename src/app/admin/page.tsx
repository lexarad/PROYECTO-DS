import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { EstadoBadge } from '@/components/ui/EstadoBadge'
import { EstadoSolicitud, TipoCertificado } from '@prisma/client'
import { FiltrosAdmin } from '@/components/admin/FiltrosAdmin'

interface Props {
  searchParams: { estado?: string; tipo?: string; q?: string }
}

export default async function AdminPage({ searchParams }: Props) {
  const where: any = {}
  if (searchParams.estado) where.estado = searchParams.estado as EstadoSolicitud
  if (searchParams.tipo) where.tipo = searchParams.tipo as TipoCertificado
  if (searchParams.q) {
    where.OR = [
      { referencia: { contains: searchParams.q, mode: 'insensitive' } },
      { emailInvitado: { contains: searchParams.q, mode: 'insensitive' } },
      { user: { email: { contains: searchParams.q, mode: 'insensitive' } } },
      { user: { name: { contains: searchParams.q, mode: 'insensitive' } } },
    ]
  }

  const ahora = new Date()
  const inicioMes = new Date(ahora.getFullYear(), ahora.getMonth(), 1)

  const [solicitudes, totales, ingresosMes, ingresosTotales, invitadosCount] = await Promise.all([
    prisma.solicitud.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: { user: { select: { name: true, email: true } } },
      take: 100,
    }),
    prisma.solicitud.groupBy({
      by: ['estado'],
      _count: { estado: true },
    }),
    prisma.solicitud.aggregate({
      where: { pagado: true, createdAt: { gte: inicioMes } },
      _sum: { precio: true },
    }),
    prisma.solicitud.aggregate({
      where: { pagado: true },
      _sum: { precio: true },
    }),
    prisma.solicitud.count({ where: { userId: null, pagado: true } }),
  ])

  const conteos = Object.fromEntries(totales.map((t) => [t.estado, t._count.estado]))

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Solicitudes</h1>
        <span className="text-sm text-gray-500">{solicitudes.length} resultado(s)</span>
      </div>

      {/* Revenue KPIs */}
      {!searchParams.estado && !searchParams.tipo && !searchParams.q && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          <div className="card p-4">
            <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Ingresos (mes)</p>
            <p className="text-2xl font-bold text-green-600">{(ingresosMes._sum.precio ?? 0).toFixed(2)} €</p>
          </div>
          <div className="card p-4">
            <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Ingresos totales</p>
            <p className="text-2xl font-bold text-gray-900">{(ingresosTotales._sum.precio ?? 0).toFixed(2)} €</p>
          </div>
          <div className="card p-4">
            <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Pagados (mes)</p>
            <p className="text-2xl font-bold">{(conteos['EN_PROCESO'] ?? 0) + (conteos['COMPLETADA'] ?? 0)}</p>
          </div>
          <div className="card p-4">
            <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Pedidos invitado</p>
            <p className="text-2xl font-bold text-purple-600">{invitadosCount}</p>
          </div>
        </div>
      )}

      {/* Resumen por estado */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        {(['PENDIENTE', 'EN_PROCESO', 'COMPLETADA', 'RECHAZADA'] as EstadoSolicitud[]).map((e) => (
          <Link key={e} href={`/admin?estado=${e}`} className="card p-4 hover:shadow-md transition-shadow">
            <p className="text-2xl font-bold">{conteos[e] ?? 0}</p>
            <p className="text-sm text-gray-500 capitalize">{e.replace(/_/g, ' ').toLowerCase()}</p>
          </Link>
        ))}
      </div>

      {/* Filtros */}
      <FiltrosAdmin currentEstado={searchParams.estado} currentTipo={searchParams.tipo} currentQ={searchParams.q} />

      {/* Tabla */}
      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Referencia</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Tipo</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Cliente</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Fecha</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Precio</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Pago</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Estado</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {solicitudes.length === 0 && (
              <tr>
                <td colSpan={8} className="text-center py-12 text-gray-400">
                  No hay solicitudes con los filtros aplicados.
                </td>
              </tr>
            )}
            {solicitudes.map((s) => (
              <tr key={s.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3 font-mono text-xs text-gray-700">{s.referencia}</td>
                <td className="px-4 py-3">{s.tipo.replace(/_/g, ' ')}</td>
                <td className="px-4 py-3">
                  <p>{s.user?.name ?? '—'}</p>
                  <p className="text-xs text-gray-400">{s.user?.email ?? s.emailInvitado ?? '—'}</p>
                </td>
                <td className="px-4 py-3 text-gray-500">
                  {new Date(s.createdAt).toLocaleDateString('es-ES')}
                </td>
                <td className="px-4 py-3 font-semibold">{s.precio.toFixed(2)} €</td>
                <td className="px-4 py-3">
                  {s.pagado ? (
                    <span className="text-xs font-medium text-green-700 bg-green-100 px-2 py-0.5 rounded-full">Pagado</span>
                  ) : (
                    <span className="text-xs font-medium text-orange-700 bg-orange-100 px-2 py-0.5 rounded-full">Pendiente</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <EstadoBadge estado={s.estado} />
                </td>
                <td className="px-4 py-3">
                  <Link href={`/admin/solicitudes/${s.id}`} className="text-brand-600 hover:underline text-xs font-medium">
                    Gestionar →
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
