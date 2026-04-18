import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getPlan } from '@/lib/planes'
import { GestorWebhooks } from '@/components/dashboard/GestorWebhooks'

export const metadata = { title: 'Webhooks — CertiDocs' }
export const dynamic = 'force-dynamic'

export default async function WebhooksPage() {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/auth/login')

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { plan: true },
  })
  const planCfg = getPlan(user!.plan)
  if (!planCfg.apiAccess) redirect('/dashboard/plan')

  const endpoints = await (prisma as any).webhookEndpoint.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true, url: true, activo: true, eventos: true, createdAt: true,
      _count: { select: { deliveries: true } },
    },
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
          <h1 className="text-2xl font-bold mb-1">Webhooks</h1>
          <p className="text-gray-500 text-sm">
            Recibe notificaciones en tiempo real cuando cambia el estado de tus solicitudes.
          </p>
        </div>

        {/* Docs box */}
        <div className="card p-5 mb-6 bg-gray-900 text-gray-100 text-sm font-mono space-y-2">
          <p className="text-gray-400"># Verificar firma en tu servidor (Node.js)</p>
          <p className="text-green-400">const sig = req.headers[&apos;x-webhook-signature&apos;]</p>
          <p>const hmac = crypto.createHmac(&apos;sha256&apos;, SECRET)</p>
          <p>hmac.update(JSON.stringify(req.body))</p>
          <p className="text-green-400">const valid = hmac.digest(&apos;hex&apos;) === sig</p>
        </div>

        <GestorWebhooks initialEndpoints={endpoints} />
      </main>
    </div>
  )
}
