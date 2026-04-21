import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { AutomatizacionFiltros } from '@/components/admin/AutomatizacionFiltros'
import { AuthStatusWidget } from '@/components/admin/AuthStatusWidget'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Automatización — Admin' }

const ESTADO_STYLE: Record<string, string> = {
  PENDIENTE:       'bg-gray-100 text-gray-700',
  EN_CURSO:        'bg-blue-100 text-blue-700 animate-pulse',
  COMPLETADO:      'bg-green-100 text-green-700',
  FALLIDO:         'bg-red-100 text-red-700',
  REQUIERE_MANUAL: 'bg-orange-100 text-orange-800',
}

const ESTADO_LABEL: Record<string, string> = {
  PENDIENTE:       'Pendiente',
  EN_CURSO:        'En curso',
  COMPLETADO:      'Completado',
  FALLIDO:         'Fallido',
  REQUIERE_MANUAL: 'Manual',
}

interface PageProps {
  searchParams: { estado?: string; page?: string }
}

const PAGE_SIZE = 25

export default async function AutomatizacionPage({ searchParams }: PageProps) {
  const estado = searchParams.estado ?? ''
  const page = Math.max(1, parseInt(searchParams.page ?? '1'))
  const where = estado ? { estado } : {}

  const [jobs, total, stats] = await Promise.all([
    (prisma as any).automatizacionJob.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: {
        solicitud: { select: { referencia: true, tipo: true } },
      },
    }),
    (prisma as any).automatizacionJob.count({ where }),
    (prisma as any).automatizacionJob.groupBy({
      by: ['estado'],
      _count: { estado: true },
    }),
  ])

  const conteos = Object.fromEntries(
    (stats as any[]).map((s: any) => [s.estado, s._count.estado])
  )
  const totalPages = Math.ceil(total / PAGE_SIZE)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Automatización de pedidos</h1>
        <span className="text-sm text-gray-500">Trámites ante el Ministerio de Justicia</span>
      </div>

      {/* Auth status */}
      <AuthStatusWidget />

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {Object.entries(ESTADO_LABEL).map(([est, label]) => (
          <Link
            key={est}
            href={`/admin/automatizacion?estado=${estado === est ? '' : est}`}
            className={`card p-4 text-center transition-all hover:shadow-md ${estado === est ? 'ring-2 ring-brand-500' : ''}`}
          >
            <p className="text-2xl font-bold">{conteos[est] ?? 0}</p>
            <p className="text-xs mt-0.5">
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${ESTADO_STYLE[est]}`}>
                {label}
              </span>
            </p>
          </Link>
        ))}
      </div>

      {/* Filtros */}
      <AutomatizacionFiltros estadoActivo={estado} />

      {/* Tabla */}
      <div className="card overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
          <span className="text-sm text-gray-500">
            {total} job{total !== 1 ? 's' : ''}{estado ? ` · ${ESTADO_LABEL[estado]}` : ''}
          </span>
          {totalPages > 1 && (
            <span className="text-xs text-gray-400">Página {page}/{totalPages}</span>
          )}
        </div>
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Solicitud</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Tipo</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600 hidden md:table-cell">Creado</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Intentos</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Ref. MJ</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Estado</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {jobs.length === 0 && (
              <tr>
                <td colSpan={7} className="text-center py-12 text-gray-400">
                  No hay jobs{estado ? ` con estado ${ESTADO_LABEL[estado]}` : ''}.
                </td>
              </tr>
            )}
            {jobs.map((job: any) => (
              <tr key={job.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-mono text-xs text-gray-600">
                  {job.solicitud?.referencia ?? '—'}
                </td>
                <td className="px-4 py-3 text-gray-700">
                  {job.tipo?.replace(/_/g, ' ')}
                </td>
                <td className="px-4 py-3 text-gray-500 hidden md:table-cell">
                  {new Date(job.createdAt).toLocaleDateString('es-ES', { timeZone: 'Europe/Madrid' })}
                </td>
                <td className="px-4 py-3 text-center text-gray-600">
                  {job.intentos}/{job.maxIntentos}
                </td>
                <td className="px-4 py-3 font-mono text-xs text-green-700">
                  {job.refOrganismo ?? '—'}
                </td>
                <td className="px-4 py-3">
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${ESTADO_STYLE[job.estado]}`}>
                    {ESTADO_LABEL[job.estado]}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <Link href={`/admin/automatizacion/${job.id}`} className="text-brand-600 hover:underline text-xs">
                    Ver →
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Paginación */}
        {totalPages > 1 && (
          <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between">
            <Link
              href={`/admin/automatizacion?${estado ? `estado=${estado}&` : ''}page=${page - 1}`}
              className={`text-sm text-brand-600 hover:underline ${page <= 1 ? 'pointer-events-none opacity-30' : ''}`}
            >
              ← Anterior
            </Link>
            <span className="text-sm text-gray-500">{page} / {totalPages}</span>
            <Link
              href={`/admin/automatizacion?${estado ? `estado=${estado}&` : ''}page=${page + 1}`}
              className={`text-sm text-brand-600 hover:underline ${page >= totalPages ? 'pointer-events-none opacity-30' : ''}`}
            >
              Siguiente →
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
