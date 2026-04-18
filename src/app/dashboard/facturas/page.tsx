import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export const metadata = { title: 'Mis facturas – CertiDocs' }

export default async function FacturasPage() {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/auth/login')

  const facturas = await prisma.factura.findMany({
    where: { userId: session.user.id },
    include: { solicitud: { select: { referencia: true, tipo: true } } },
    orderBy: { fechaEmision: 'desc' },
  })

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="text-xl font-bold text-brand-700">CertiDocs</Link>
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="text-sm text-gray-500 hover:text-gray-700">← Mi área</Link>
            <Link href="/api/auth/signout" className="text-sm text-gray-500 hover:text-gray-700">Salir</Link>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-10">
        <div className="mb-8">
          <h1 className="text-2xl font-bold">Mis facturas</h1>
          <p className="text-gray-500 text-sm mt-1">Historial de facturas y recibos de tus pagos</p>
        </div>

        {facturas.length === 0 ? (
          <div className="card p-14 text-center">
            <div className="text-5xl mb-4">🧾</div>
            <h2 className="font-semibold text-lg mb-2">Sin facturas todavía</h2>
            <p className="text-gray-500 text-sm max-w-sm mx-auto">
              Las facturas se generan automáticamente al confirmar el pago de cada solicitud.
            </p>
          </div>
        ) : (
          <div className="card overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Nº Factura</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Concepto</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden sm:table-cell">Fecha</th>
                  <th className="text-right px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Total</th>
                  <th className="px-5 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {facturas.map((f) => (
                  <tr key={f.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-4">
                      <span className="font-mono font-semibold text-gray-900">{f.numero}</span>
                    </td>
                    <td className="px-5 py-4">
                      <p className="text-gray-800 truncate max-w-xs">{f.solicitud.tipo.replace(/_/g, ' ')}</p>
                      <p className="text-xs text-gray-400 mt-0.5 font-mono">{f.solicitud.referencia}</p>
                    </td>
                    <td className="px-5 py-4 text-gray-500 hidden sm:table-cell">
                      {new Date(f.fechaEmision).toLocaleDateString('es-ES')}
                    </td>
                    <td className="px-5 py-4 text-right font-semibold text-gray-900">
                      {f.total.toFixed(2)} €
                    </td>
                    <td className="px-5 py-4 text-right">
                      <a
                        href={`/api/facturas/${f.id}/pdf`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-green-700 bg-green-50 border border-green-200 px-3 py-1.5 rounded-lg hover:bg-green-100 transition-colors"
                      >
                        PDF
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="px-5 py-4 bg-gray-50 border-t border-gray-100 flex justify-between items-center">
              <p className="text-xs text-gray-500">{facturas.length} factura{facturas.length !== 1 ? 's' : ''}</p>
              <p className="text-sm font-semibold text-gray-700">
                Total pagado: {facturas.reduce((acc, f) => acc + f.total, 0).toFixed(2)} €
              </p>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
