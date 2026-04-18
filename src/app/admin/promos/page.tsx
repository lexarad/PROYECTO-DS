import { prisma } from '@/lib/prisma'
import { CrearPromoForm } from '@/components/admin/CrearPromoForm'

export const metadata = { title: 'Códigos promo – Admin' }
export const dynamic = 'force-dynamic'

export default async function PromosAdminPage() {
  const promos = await (prisma as any).codigoPromo.findMany({
    orderBy: { createdAt: 'desc' },
  })

  return (
    <div className="max-w-4xl space-y-6">
      <h1 className="text-2xl font-bold">Códigos promocionales</h1>

      <CrearPromoForm />

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Código</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Descuento</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Usos</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Expira</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Estado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {promos.length === 0 && (
              <tr>
                <td colSpan={5} className="text-center py-10 text-gray-400">No hay códigos aún.</td>
              </tr>
            )}
            {promos.map((p: any) => {
              const expirado = p.expira && new Date(p.expira) < new Date()
              const agotado = p.maxUsos !== null && p.usos >= p.maxUsos
              const activo = p.activo && !expirado && !agotado
              return (
                <tr key={p.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono font-semibold">{p.codigo}</td>
                  <td className="px-4 py-3 text-green-700 font-semibold">{p.descuento}%</td>
                  <td className="px-4 py-3 text-gray-600">
                    {p.usos}{p.maxUsos !== null ? ` / ${p.maxUsos}` : ''}
                  </td>
                  <td className="px-4 py-3 text-gray-500">
                    {p.expira ? new Date(p.expira).toLocaleDateString('es-ES') : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                      activo ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {activo ? 'Activo' : expirado ? 'Expirado' : agotado ? 'Agotado' : 'Inactivo'}
                    </span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
