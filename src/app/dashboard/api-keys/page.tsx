import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getPlan } from '@/lib/planes'
import { GestorApiKeys } from '@/components/dashboard/GestorApiKeys'

export default async function ApiKeysPage() {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/auth/login')

  const user = await prisma.user.findUnique({ where: { id: session.user.id } })
  const planCfg = getPlan(user!.plan)

  if (!planCfg.apiAccess) redirect('/dashboard/plan')

  const keys = await prisma.apiKey.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: 'desc' },
    select: { id: true, nombre: true, keyPrefix: true, activa: true, lastUsedAt: true, createdAt: true },
  })

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-100">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="text-xl font-bold text-brand-700">CertiDocs</Link>
          <Link href="/dashboard" className="text-sm text-gray-500 hover:text-gray-700">← Dashboard</Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-12">
        <div className="mb-8">
          <h1 className="text-2xl font-bold mb-2">API Keys</h1>
          <p className="text-gray-500 text-sm">
            Usa estas claves para acceder a la API REST desde tus aplicaciones o scripts.
            La clave solo se muestra una vez al crearla.
          </p>
        </div>

        <div className="card p-6 mb-6 bg-gray-900 text-gray-100 text-sm font-mono">
          <p className="text-gray-400 mb-2"># Ejemplo de uso</p>
          <p>curl -X GET https://certidocs.es/api/v1/solicitudes \</p>
          <p className="ml-4">-H &quot;Authorization: Bearer cd_tu_api_key&quot;</p>
        </div>

        <GestorApiKeys initialKeys={keys} />
      </main>
    </div>
  )
}
