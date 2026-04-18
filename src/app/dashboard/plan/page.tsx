import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { PLANES, getPlan } from '@/lib/planes'
import { BotonPlan } from '@/components/dashboard/BotonPlan'
import { BotonPortal } from '@/components/dashboard/BotonPortal'
import { InfoSuscripcion } from '@/components/dashboard/InfoSuscripcion'

interface Props {
  searchParams: { activado?: string }
}

export default async function PlanPage({ searchParams }: Props) {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/auth/login')

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { plan: true, stripeCustomerId: true, stripeSubscriptionId: true },
  })
  const planActual = getPlan(user!.plan)

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="text-xl font-bold text-brand-700">CertiDocs</Link>
          <Link href="/dashboard" className="text-sm text-gray-500 hover:text-gray-700">← Dashboard</Link>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-12">
        {searchParams.activado && (
          <div className="bg-green-50 border border-green-200 text-green-800 text-sm px-4 py-3 rounded-lg mb-8">
            Plan activado correctamente. ¡Bienvenido a {planActual.label}!
          </div>
        )}

        <h1 className="text-3xl font-bold mb-2">Tu plan</h1>
        <p className="text-gray-500 mb-10">
          Plan actual: <span className="font-semibold text-brand-700">{planActual.label}</span>
          {planActual.descuento > 0 && ` · ${planActual.descuento}% de descuento activo`}
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {PLANES.map((plan) => {
            const esActual = plan.plan === user!.plan
            return (
              <div key={plan.plan} className={`card p-6 flex flex-col ${esActual ? 'ring-2 ring-brand-500' : ''}`}>
                {esActual && (
                  <span className="text-xs font-semibold text-brand-600 bg-brand-50 px-2 py-0.5 rounded-full self-start mb-3">
                    Plan actual
                  </span>
                )}
                <h2 className="text-xl font-bold mb-1">{plan.label}</h2>
                <p className="text-3xl font-bold mb-1">
                  {plan.precio === 0 ? 'Gratis' : `${plan.precio} €`}
                  {plan.precio > 0 && <span className="text-sm font-normal text-gray-400">/mes</span>}
                </p>
                <p className="text-sm text-gray-500 mb-5">{plan.descripcion}</p>

                <ul className="space-y-2 text-sm mb-6 flex-1">
                  <li className="flex items-center gap-2">
                    <span className="text-green-500">✓</span>
                    {plan.maxSolicitudesMes === null
                      ? 'Solicitudes ilimitadas'
                      : `Hasta ${plan.maxSolicitudesMes} solicitudes/mes`}
                  </li>
                  {plan.descuento > 0 && (
                    <li className="flex items-center gap-2">
                      <span className="text-green-500">✓</span>
                      {plan.descuento}% de descuento en cada solicitud
                    </li>
                  )}
                  <li className="flex items-center gap-2">
                    {plan.apiAccess
                      ? <><span className="text-green-500">✓</span> Acceso a API REST</>
                      : <><span className="text-gray-300">✗</span> <span className="text-gray-400">Sin acceso a API</span></>
                    }
                  </li>
                </ul>

                {!esActual && plan.precio > 0 && (
                  <BotonPlan plan={plan.plan} label={`Activar ${plan.label}`} />
                )}
                {esActual && (
                  <span className="text-sm text-center text-gray-400">Plan activo</span>
                )}
              </div>
            )
          })}
        </div>

        <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center items-center">
          {planActual.apiAccess && (
            <p className="text-sm text-gray-500">
              Tu plan incluye acceso a la API.{' '}
              <Link href="/dashboard/api-keys" className="text-brand-600 hover:underline">
                Gestionar API keys →
              </Link>
            </p>
          )}
          {user?.stripeSubscriptionId && (
            <div className="w-full sm:w-auto sm:min-w-[280px]">
              <BotonPortal />
              <p className="text-xs text-gray-400 text-center mt-1.5">
                Cambiar método de pago, ver historial, cancelar suscripción
              </p>
              <InfoSuscripcion />
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
