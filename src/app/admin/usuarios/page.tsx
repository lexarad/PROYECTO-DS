import { prisma } from '@/lib/prisma'

export default async function AdminUsuariosPage() {
  const usuarios = await prisma.user.findMany({
    orderBy: { createdAt: 'desc' },
    include: { _count: { select: { solicitudes: true } } },
  })

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Usuarios</h1>
        <span className="text-sm text-gray-500">{usuarios.length} usuarios registrados</span>
      </div>

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Nombre</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Email</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Rol</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Solicitudes</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Registro</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {usuarios.map((u) => (
              <tr key={u.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium">{u.name ?? '—'}</td>
                <td className="px-4 py-3 text-gray-600">{u.email}</td>
                <td className="px-4 py-3">
                  {u.role === 'ADMIN' ? (
                    <span className="text-xs font-medium bg-brand-100 text-brand-700 px-2 py-0.5 rounded-full">Admin</span>
                  ) : (
                    <span className="text-xs text-gray-400">Usuario</span>
                  )}
                </td>
                <td className="px-4 py-3">{u._count.solicitudes}</td>
                <td className="px-4 py-3 text-gray-500">{new Date(u.createdAt).toLocaleDateString('es-ES')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
