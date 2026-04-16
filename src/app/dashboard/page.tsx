import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { EstadoBadge } from '@/components/ui/EstadoBadge'
import { getPlan } from '@/lib/planes'

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/auth/login')

  const [solicitudes, user] = await Promise.all([
    prisma.solicitud.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.user.findUnique({ where: { id: session.user.id } }),
  ])
  const planCfg = getPlan(user!.plan)

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="text-xl font-bold text-brand-700">CertiDocs</Link>
          <div className="flex items-center gap-4">
            <Link href="/dashboard/plan" className="text-xs font-medium bg-brand-50 text-brand-700 px-2 py-1 rounded-full hover:bg-brand-100 transition-colors">
              {planCfg.label}
            </Link>
            {planCfg.apiAccess && (
              <Link href="/dashboard/api-keys" className="text-sm text-gray-500 hover:text-gray-700">API keys</Link>
            )}
            <span className="text-sm text-gray-600">{session.user.name ?? session.user.email}</span>
            <Link href="/api/auth/signout" className="text-sm text-gray-500 hover:text-gray-700">Salir</Link>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-10">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold">Mis solicitudes</h1>
          <Link href="/solicitar" className="btn-primary text-sm py-2 px-4">
            + Nueva solicitud
          </Link>
        </div>

        {solicitudes.length === 0 ? (
          <div className="card p-12 text-center">
            <p className="text-gray-500 mb-6">Aún no tienes solicitudes.</p>
            <Link href="/solicitar" className="btn-primary">
              Solicitar tu primer certificado
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {solicitudes.map((s) => (
              <Link
                key={s.id}
                href={`/dashboard/solicitudes/${s.id}`}
                className="card p-5 flex items-center justify-between hover:shadow-md transition-shadow"
              >
                <div>
                  <p className="font-semibold">{s.tipo.replace(/_/g, ' ')}</p>
                  <p className="text-sm text-gray-500">
                    Ref: {s.referencia} · {new Date(s.createdAt).toLocaleDateString('es-ES')}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <span className="font-semibold text-gray-700">{s.precio.toFixed(2)} €</span>
                  {!s.pagado && (
                    <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-orange-100 text-orange-700">
                      Pago pendiente
                    </span>
                  )}
                  <EstadoBadge estado={s.estado} />
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
