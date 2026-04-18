import { prisma } from '@/lib/prisma'
import Link from 'next/link'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Referidos — Admin' }

const PAGE_SIZE = 25

interface PageProps {
  searchParams: { page?: string }
}

export default async function AdminReferidosPage({ searchParams }: PageProps) {
  const page = Math.max(1, parseInt(searchParams.page ?? '1'))

  const [creditos, totalCreditos, totalReferidores, totalReferidos, topReferidores] = await Promise.all([
    (prisma as any).creditoReferido.findMany({
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: {
        user: { select: { id: true, name: true, email: true, referralCode: true } },
      },
    }),
    (prisma as any).creditoReferido.count(),
    prisma.user.count({ where: { referidos: { some: {} } } as any }),
    prisma.user.count({ where: { referidoPorId: { not: null } } as any }),
    // Top 5 referidores por número de créditos obtenidos
    (prisma as any).creditoReferido.groupBy({
      by: ['userId'],
      _count: { id: true },
      _sum: { cantidad: true },
      orderBy: { _count: { id: 'desc' } },
      take: 5,
    }),
  ])

  // Enrich top referidores with user data
  const topConNombre = await Promise.all(
    (topReferidores as any[]).map(async (t: any) => {
      const u = await prisma.user.findUnique({
        where: { id: t.userId },
        select: { name: true, email: true, referralCode: true },
      })
      return { ...t, user: u }
    })
  )

  const totalPages = Math.ceil(totalCreditos / PAGE_SIZE)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Programa de referidos</h1>
        <span className="text-sm text-gray-500">{totalCreditos} crédito{totalCreditos !== 1 ? 's' : ''} generado{totalCreditos !== 1 ? 's' : ''}</span>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <div className="card p-4">
          <p className="text-2xl font-bold text-brand-700">{totalReferidores}</p>
          <p className="text-xs text-gray-500 mt-0.5">Usuarios que han referido</p>
        </div>
        <div className="card p-4">
          <p className="text-2xl font-bold text-green-600">{totalReferidos}</p>
          <p className="text-xs text-gray-500 mt-0.5">Usuarios referidos</p>
        </div>
        <div className="card p-4">
          <p className="text-2xl font-bold text-orange-500">{totalCreditos}</p>
          <p className="text-xs text-gray-500 mt-0.5">Créditos emitidos</p>
        </div>
      </div>

      {/* Top referidores */}
      {topConNombre.length > 0 && (
        <div className="card overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100">
            <span className="text-sm font-semibold text-gray-700">Top referidores</span>
          </div>
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-2 font-medium text-gray-600">Usuario</th>
                <th className="text-left px-4 py-2 font-medium text-gray-600">Código</th>
                <th className="text-center px-4 py-2 font-medium text-gray-600">Referidos</th>
                <th className="text-right px-4 py-2 font-medium text-gray-600">Crédito total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {topConNombre.map((t: any, i: number) => (
                <tr key={t.userId} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-400 w-4">{i + 1}.</span>
                      <div>
                        <p className="font-medium text-gray-800">{t.user?.name ?? '—'}</p>
                        <p className="text-xs text-gray-400">{t.user?.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-brand-700">{t.user?.referralCode ?? '—'}</td>
                  <td className="px-4 py-3 text-center font-bold">{t._count.id}</td>
                  <td className="px-4 py-3 text-right font-semibold text-green-700">{(t._sum.cantidad ?? 0).toFixed(2)} €</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Tabla de créditos */}
      <div className="card overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
          <span className="text-sm font-semibold text-gray-700">Historial de créditos emitidos</span>
          {totalPages > 1 && (
            <span className="text-xs text-gray-400">Página {page}/{totalPages}</span>
          )}
        </div>
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Referidor (recibe crédito)</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">ID Referido</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Código promo</th>
              <th className="text-right px-4 py-3 font-medium text-gray-600">Crédito</th>
              <th className="text-right px-4 py-3 font-medium text-gray-600">Fecha</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {(creditos as any[]).length === 0 && (
              <tr>
                <td colSpan={5} className="text-center py-12 text-gray-400">
                  No hay créditos de referidos todavía.
                </td>
              </tr>
            )}
            {(creditos as any[]).map((c: any) => (
              <tr key={c.id} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <p className="font-medium text-gray-800">{c.user?.name ?? '—'}</p>
                  <p className="text-xs text-gray-400">{c.user?.email}</p>
                </td>
                <td className="px-4 py-3">
                  <Link
                    href={`/admin/usuarios?q=${c.referidoId}`}
                    className="font-mono text-xs text-brand-600 hover:underline"
                  >
                    {c.referidoId.slice(0, 12)}…
                  </Link>
                </td>
                <td className="px-4 py-3 font-mono text-xs text-green-700">{c.codigoPromo ?? '—'}</td>
                <td className="px-4 py-3 text-right font-semibold text-green-700">{(c.cantidad ?? 0).toFixed(2)} €</td>
                <td className="px-4 py-3 text-right text-xs text-gray-400">
                  {new Date(c.createdAt).toLocaleDateString('es-ES', { dateStyle: 'medium' })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {totalPages > 1 && (
          <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between">
            <Link
              href={`/admin/referidos?page=${page - 1}`}
              className={`text-sm text-brand-600 hover:underline ${page <= 1 ? 'pointer-events-none opacity-30' : ''}`}
            >
              ← Anterior
            </Link>
            <span className="text-sm text-gray-500">{page} / {totalPages}</span>
            <Link
              href={`/admin/referidos?page=${page + 1}`}
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
