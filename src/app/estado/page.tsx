import { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Estado del sistema — CertiDocs',
  description: 'Estado en tiempo real de los servicios de CertiDocs.',
}

export const dynamic = 'force-dynamic'

type ServiceStatus = {
  ok: boolean
  latencyMs: number
  name: string
}

type EstadoResponse = {
  status: 'operational' | 'degraded'
  timestamp: string
  services: {
    database: ServiceStatus
    stripe: ServiceStatus
    email: ServiceStatus
  }
}

async function getEstado(): Promise<EstadoResponse | null> {
  try {
    const baseUrl = process.env.NEXTAUTH_URL ?? 'http://localhost:3000'
    const res = await fetch(`${baseUrl}/api/estado`, { cache: 'no-store' })
    return res.json()
  } catch {
    return null
  }
}

function StatusDot({ ok }: { ok: boolean }) {
  return (
    <span
      className={`inline-block w-2.5 h-2.5 rounded-full ${ok ? 'bg-green-500' : 'bg-red-500'}`}
      aria-label={ok ? 'Operativo' : 'Con problemas'}
    />
  )
}

function ServiceRow({ service }: { service: ServiceStatus }) {
  return (
    <div className="flex items-center justify-between py-4 border-b border-gray-100 last:border-0">
      <div className="flex items-center gap-3">
        <StatusDot ok={service.ok} />
        <span className="font-medium text-gray-800">{service.name}</span>
      </div>
      <div className="flex items-center gap-4 text-sm text-gray-500">
        <span>{service.latencyMs} ms</span>
        <span
          className={`font-semibold ${service.ok ? 'text-green-600' : 'text-red-600'}`}
        >
          {service.ok ? 'Operativo' : 'Con problemas'}
        </span>
      </div>
    </div>
  )
}

export default async function EstadoPage() {
  const data = await getEstado()

  const isOk = data?.status === 'operational'
  const timestamp = data?.timestamp ? new Date(data.timestamp).toLocaleString('es-ES') : null

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-100">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="text-xl font-bold text-brand-700">CertiDocs</Link>
          <span className="text-sm text-gray-400">Estado del sistema</span>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-12">
        {/* Banner global */}
        <div
          className={`rounded-xl px-6 py-5 mb-8 flex items-center gap-4 ${
            !data ? 'bg-gray-100' :
            isOk ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
          }`}
        >
          <span className="text-3xl">{!data ? '⚠️' : isOk ? '✅' : '🔴'}</span>
          <div>
            <p className={`font-bold text-lg ${!data ? 'text-gray-700' : isOk ? 'text-green-800' : 'text-red-800'}`}>
              {!data ? 'No se pudo obtener el estado' :
               isOk ? 'Todos los sistemas operativos' : 'Algunos servicios con problemas'}
            </p>
            {timestamp && (
              <p className="text-sm text-gray-500 mt-0.5">Actualizado: {timestamp}</p>
            )}
          </div>
        </div>

        {/* Servicios */}
        {data && (
          <div className="card p-0 overflow-hidden mb-8">
            <div className="px-6 py-4 bg-gray-50 border-b border-gray-100">
              <h2 className="font-semibold text-gray-700">Servicios</h2>
            </div>
            <div className="px-6">
              <ServiceRow service={data.services.database} />
              <ServiceRow service={data.services.stripe} />
              <ServiceRow service={data.services.email} />
            </div>
          </div>
        )}

        {/* Info */}
        <p className="text-center text-sm text-gray-400">
          Esta página se actualiza en cada visita.{' '}
          <a href="/estado" className="text-brand-600 hover:underline">Recargar</a>
        </p>
      </main>
    </div>
  )
}
