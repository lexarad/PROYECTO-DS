import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { EstadoSolicitud, TipoCertificado } from '@prisma/client'
import { FiltrosAdmin } from '@/components/admin/FiltrosAdmin'
import { TablaAdminBulk } from '@/components/admin/TablaAdminBulk'

const PAGE_SIZE = 25

interface Props {
  searchParams: { estado?: string; tipo?: string; q?: string; page?: string }
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

  const page = Math.max(1, parseInt(searchParams.page ?? '1'))
  const skip = (page - 1) * PAGE_SIZE

  const ahora = new Date()
  const inicioMes = new Date(ahora.getFullYear(), ahora.getMonth(), 1)

  const [solicitudes, totalFiltered, totales, ingresosMes, ingresosTotales, invitadosCount] = await Promise.all([
    prisma.solicitud.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { name: true, email: true } },
        _count: { select: { mensajes: { where: { autorRol: 'USER', leido: false } } } },
      },
      take: PAGE_SIZE,
      skip,
    }),
    prisma.solicitud.count({ where }),
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
  const totalPages = Math.ceil(totalFiltered / PAGE_SIZE)

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Solicitudes</h1>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-500">{totalFiltered} resultado{totalFiltered !== 1 ? 's' : ''}</span>
          <a
            href="/api/admin/solicitudes/export"
            className="text-sm font-medium text-gray-600 bg-white border border-gray-200 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Exportar CSV
          </a>
        </div>
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



      {/* Tabla con bulk actions */}
      <TablaAdminBulk solicitudes={solicitudes} />

      {/* Paginación */}
      {totalPages > 1 && (
        <div className="mt-3 px-4 py-3 bg-white border border-gray-200 rounded-lg flex items-center justify-between">
          <span className="text-xs text-gray-500">
            Página {page} de {totalPages} · {totalFiltered} resultados
          </span>
          <div className="flex gap-2">
            {page > 1 && (
              <Link
                href={`/admin?${new URLSearchParams({ ...searchParams, page: String(page - 1) }).toString()}`}
                className="text-sm text-brand-600 hover:underline"
              >
                ← Anterior
              </Link>
            )}
            {page < totalPages && (
              <Link
                href={`/admin?${new URLSearchParams({ ...searchParams, page: String(page + 1) }).toString()}`}
                className="text-sm text-brand-600 hover:underline"
              >
                Siguiente →
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
