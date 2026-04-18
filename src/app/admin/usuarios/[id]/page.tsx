import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { EstadoBadge } from '@/components/ui/EstadoBadge'
import { UsuarioAcciones } from '@/components/admin/UsuarioAcciones'

export const dynamic = 'force-dynamic'

interface Props { params: { id: string } }

export default async function AdminUsuarioDetallePage({ params }: Props) {
  const user = await prisma.user.findUnique({
    where: { id: params.id },
    include: {
      solicitudes: {
        orderBy: { createdAt: 'desc' },
        include: { factura: { select: { id: true, numero: true } } },
      },
    },
  })

  if (!user) notFound()

  const ltv = user.solicitudes.filter((s) => s.pagado).reduce((sum, s) => sum + s.precio, 0)
  const completadas = user.solicitudes.filter((s) => s.estado === 'COMPLETADA').length

  return (
    <div className="max-w-5xl space-y-6">
      <div>
        <Link href="/admin/usuarios" className="text-sm text-gray-500 hover:text-gray-700">← Usuarios</Link>
        <h1 className="text-2xl font-bold mt-1">{user.name ?? user.email}</h1>
        <p className="text-sm text-gray-500">{user.email}</p>
      </div>

      {/* Header row with KPIs + actions */}
      <div className="flex flex-col lg:flex-row gap-4 items-start">
        <div className="flex-1 grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="card p-4">
          <p className="text-2xl font-bold">{user.solicitudes.length}</p>
          <p className="text-xs text-gray-500 mt-0.5">Solicitudes</p>
        </div>
        <div className="card p-4">
          <p className="text-2xl font-bold text-green-600">{completadas}</p>
          <p className="text-xs text-gray-500 mt-0.5">Completadas</p>
        </div>
        <div className="card p-4">
          <p className="text-2xl font-bold text-brand-600">{ltv.toFixed(2)} €</p>
          <p className="text-xs text-gray-500 mt-0.5">LTV</p>
        </div>
        <div className="card p-4">
          <p className="text-sm font-bold">{user.plan}</p>
          <p className="text-xs text-gray-500 mt-0.5">Plan actual</p>
        </div>
        </div>
        <UsuarioAcciones userId={user.id} roleActual={user.role} planActual={user.plan} />
      </div>

      {/* Info */}
      <div className="card p-6">
        <h2 className="font-semibold mb-4">Datos de la cuenta</h2>
        <dl className="space-y-2 text-sm">
          <div className="flex gap-4">
            <dt className="text-gray-500 w-32 shrink-0">Email</dt>
            <dd>{user.email}</dd>
          </div>
          <div className="flex gap-4">
            <dt className="text-gray-500 w-32 shrink-0">Nombre</dt>
            <dd>{user.name ?? '—'}</dd>
          </div>
          <div className="flex gap-4">
            <dt className="text-gray-500 w-32 shrink-0">Rol</dt>
            <dd>{user.role}</dd>
          </div>
          <div className="flex gap-4">
            <dt className="text-gray-500 w-32 shrink-0">Plan</dt>
            <dd>{user.plan}</dd>
          </div>
          <div className="flex gap-4">
            <dt className="text-gray-500 w-32 shrink-0">Stripe ID</dt>
            <dd className="font-mono text-xs">{user.stripeCustomerId ?? '—'}</dd>
          </div>
          <div className="flex gap-4">
            <dt className="text-gray-500 w-32 shrink-0">Registro</dt>
            <dd>{new Date(user.createdAt).toLocaleDateString('es-ES', { dateStyle: 'long' })}</dd>
          </div>
        </dl>
      </div>

      {/* Solicitudes */}
      <div className="card overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="font-semibold">Historial de solicitudes</h2>
        </div>
        {user.solicitudes.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-10">Sin solicitudes.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-5 py-3 font-medium text-gray-600">Referencia</th>
                <th className="text-left px-5 py-3 font-medium text-gray-600">Tipo</th>
                <th className="text-left px-5 py-3 font-medium text-gray-600 hidden md:table-cell">Fecha</th>
                <th className="text-left px-5 py-3 font-medium text-gray-600">Precio</th>
                <th className="text-left px-5 py-3 font-medium text-gray-600">Estado</th>
                <th className="px-5 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {user.solicitudes.map((s) => (
                <tr key={s.id} className="hover:bg-gray-50">
                  <td className="px-5 py-3 font-mono text-xs text-gray-600">{s.referencia}</td>
                  <td className="px-5 py-3">{s.tipo.replace(/_/g, ' ')}</td>
                  <td className="px-5 py-3 text-gray-500 hidden md:table-cell">
                    {new Date(s.createdAt).toLocaleDateString('es-ES')}
                  </td>
                  <td className="px-5 py-3 font-semibold">{s.precio.toFixed(2)} €</td>
                  <td className="px-5 py-3"><EstadoBadge estado={s.estado} /></td>
                  <td className="px-5 py-3">
                    <Link href={`/admin/solicitudes/${s.id}`} className="text-brand-600 hover:underline text-xs">
                      Gestionar →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
