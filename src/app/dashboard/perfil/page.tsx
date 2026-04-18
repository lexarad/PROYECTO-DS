import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { AccionesRGPD } from '@/components/ui/AccionesRGPD'
import { getPlan } from '@/lib/planes'
import { FormularioPerfil } from '@/components/dashboard/FormularioPerfil'

export const metadata = { title: 'Mi perfil – CertiDocs' }

export default async function PerfilPage() {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/auth/login')

  const [user, stats] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true, name: true, email: true, plan: true,
        createdAt: true, stripeSubscriptionId: true, password: true,
      },
    }),
    prisma.solicitud.aggregate({
      where: { userId: session.user.id, pagado: true },
      _count: { id: true },
      _sum: { precio: true },
    }),
  ])

  if (!user) redirect('/auth/login')

  const planCfg = getPlan(user.plan)

  const tiposFrecuentes = await prisma.solicitud.groupBy({
    by: ['tipo'],
    where: { userId: session.user.id, pagado: true },
    _count: { tipo: true },
    orderBy: { _count: { tipo: 'desc' } },
    take: 3,
  })

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="text-xl font-bold text-brand-700">CertiDocs</Link>
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="text-sm text-gray-500 hover:text-gray-700">← Dashboard</Link>
            <Link href="/api/auth/signout" className="text-sm text-gray-500 hover:text-gray-700">Salir</Link>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-10">
        <div className="mb-8">
          <h1 className="text-2xl font-bold">Mi perfil</h1>
          <p className="text-gray-500 text-sm mt-0.5">Gestiona tus datos y preferencias</p>
        </div>

        {/* Estadísticas personales */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="card p-4 text-center">
            <p className="text-2xl font-bold text-brand-700">{stats._count.id}</p>
            <p className="text-xs text-gray-500 mt-0.5">Solicitudes</p>
          </div>
          <div className="card p-4 text-center">
            <p className="text-2xl font-bold text-green-600">{(stats._sum.precio ?? 0).toFixed(0)} €</p>
            <p className="text-xs text-gray-500 mt-0.5">Total pagado</p>
          </div>
          <div className="card p-4 text-center">
            <p className="text-sm font-bold text-gray-900">{planCfg.label}</p>
            <p className="text-xs text-gray-500 mt-0.5">Plan activo</p>
            <Link href="/dashboard/plan" className="text-xs text-brand-600 hover:underline">Gestionar</Link>
          </div>
        </div>

        {tiposFrecuentes.length > 0 && (
          <div className="card p-5 mb-6">
            <h2 className="text-sm font-semibold text-gray-700 mb-3">Certificados más solicitados</h2>
            <div className="flex flex-wrap gap-2">
              {tiposFrecuentes.map((t) => (
                <span key={t.tipo} className="text-xs bg-brand-50 text-brand-700 px-3 py-1 rounded-full font-medium">
                  {t.tipo.replace(/_/g, ' ')} ({t._count.tipo})
                </span>
              ))}
            </div>
          </div>
        )}

        {/* RGPD */}
        <AccionesRGPD />

        {/* Formulario de edición */}
        <FormularioPerfil
          nombre={user.name ?? ''}
          email={user.email}
          miembro={new Date(user.createdAt).toLocaleDateString('es-ES', { year: 'numeric', month: 'long' })}
          tienePassword={!!user.password}
        />
      </main>
    </div>
  )
}
