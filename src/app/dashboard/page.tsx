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
  const totalPagadas = solicitudes.filter((s) => s.pagado).length
  const totalPendientesPago = solicitudes.filter((s) => !s.pagado).length
  const enProceso = solicitudes.filter((s) => s.estado === 'EN_PROCESO').length
  const completadas = solicitudes.filter((s) => s.estado === 'COMPLETADA').length

  const nombreUsuario = session.user.name?.split(' ')[0] ?? session.user.email?.split('@')[0]

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
            <span className="text-sm text-gray-600 hidden sm:block">{session.user.name ?? session.user.email}</span>
            <Link href="/api/auth/signout" className="text-sm text-gray-500 hover:text-gray-700">Salir</Link>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-10">
        {/* Saludo */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold">Hola, {nombreUsuario}</h1>
            <p className="text-gray-500 text-sm mt-0.5">Aquí tienes el estado de tus solicitudes</p>
          </div>
          <Link href="/solicitar" className="btn-primary text-sm py-2 px-4">
            + Nueva solicitud
          </Link>
        </div>

        {/* Stats */}
        {solicitudes.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
            <div className="card p-4">
              <p className="text-2xl font-bold">{solicitudes.length}</p>
              <p className="text-xs text-gray-500 mt-0.5">Total solicitudes</p>
            </div>
            <div className="card p-4">
              <p className="text-2xl font-bold text-blue-600">{enProceso}</p>
              <p className="text-xs text-gray-500 mt-0.5">En proceso</p>
            </div>
            <div className="card p-4">
              <p className="text-2xl font-bold text-green-600">{completadas}</p>
              <p className="text-xs text-gray-500 mt-0.5">Completadas</p>
            </div>
            <div className="card p-4">
              <p className="text-2xl font-bold text-orange-500">{totalPendientesPago}</p>
              <p className="text-xs text-gray-500 mt-0.5">Pago pendiente</p>
            </div>
          </div>
        )}

        {/* Aviso pago pendiente */}
        {totalPendientesPago > 0 && (
          <div className="bg-orange-50 border border-orange-200 rounded-lg px-4 py-3 mb-6 text-sm text-orange-800">
            Tienes {totalPendientesPago} solicitud{totalPendientesPago > 1 ? 'es' : ''} con pago pendiente. Accede a cada una para completar el pago.
          </div>
        )}

        {/* Lista */}
        {solicitudes.length === 0 ? (
          <div className="card p-14 text-center">
            <div className="text-5xl mb-4">📄</div>
            <h2 className="font-semibold text-lg mb-2">Aún no tienes solicitudes</h2>
            <p className="text-gray-500 text-sm mb-6 max-w-sm mx-auto">
              Solicita tu primer certificado en menos de 5 minutos, sin desplazamientos.
            </p>
            <Link href="/solicitar" className="btn-primary">
              Solicitar primer certificado
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {solicitudes.map((s) => (
              <Link
                key={s.id}
                href={`/dashboard/solicitudes/${s.id}`}
                className="card p-5 flex items-center justify-between hover:shadow-md transition-shadow gap-4"
              >
                <div className="min-w-0">
                  <p className="font-semibold truncate">{s.tipo.replace(/_/g, ' ')}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {s.referencia} · {new Date(s.createdAt).toLocaleDateString('es-ES')}
                  </p>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <span className="font-semibold text-gray-700 hidden sm:block">{s.precio.toFixed(2)} €</span>
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

        {/* Plan info */}
        {user!.plan === 'FREE' && solicitudes.length > 2 && (
          <div className="mt-8 card p-5 flex items-center justify-between gap-4 border-brand-100 bg-brand-50">
            <div>
              <p className="font-semibold text-brand-800">Pásate a PRO</p>
              <p className="text-sm text-brand-600">Descuentos del 15%, hasta 100 solicitudes/mes y acceso a la API.</p>
            </div>
            <Link href="/dashboard/plan" className="btn-primary text-sm flex-shrink-0">
              Ver planes
            </Link>
          </div>
        )}
      </main>
    </div>
  )
}
