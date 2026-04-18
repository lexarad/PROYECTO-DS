import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import Link from 'next/link'

const TIPO_ICON: Record<string, string> = {
  ESTADO_CAMBIADO: '📋',
  MENSAJE: '💬',
  DOCUMENTO: '📄',
  PAGO: '✅',
}

export const metadata = { title: 'Notificaciones — CertiDocs' }

export default async function NotificacionesPage() {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/auth/login')

  const notificaciones = await prisma.notificacion.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: 'desc' },
    take: 100,
  })

  // Marcar todas como leídas al abrir la página
  await prisma.notificacion.updateMany({
    where: { userId: session.user.id, leida: false },
    data: { leida: true },
  })

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-100">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="text-xl font-bold text-brand-700">CertiDocs</Link>
          <Link href="/dashboard" className="text-sm text-gray-500 hover:text-gray-700">← Mi área</Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-10">
        <h1 className="text-2xl font-bold mb-6">Notificaciones</h1>

        {notificaciones.length === 0 ? (
          <div className="card p-10 text-center text-gray-400">
            <p className="text-4xl mb-3">🔔</p>
            <p>Sin notificaciones por ahora.</p>
          </div>
        ) : (
          <div className="card divide-y divide-gray-100">
            {notificaciones.map(n => (
              <div key={n.id} className="px-6 py-4 flex items-start gap-4">
                <span className="text-2xl mt-0.5 shrink-0">{TIPO_ICON[n.tipo] ?? '🔔'}</span>
                <div className="flex-1">
                  <p className="font-medium">{n.titulo}</p>
                  <p className="text-sm text-gray-500 mt-0.5">{n.cuerpo}</p>
                  <div className="flex items-center gap-3 mt-1">
                    <p className="text-xs text-gray-400">
                      {new Date(n.createdAt).toLocaleDateString('es-ES', {
                        weekday: 'short', day: 'numeric', month: 'long',
                        hour: '2-digit', minute: '2-digit',
                      })}
                    </p>
                    {n.enlace && (
                      <Link href={n.enlace} className="text-xs text-brand-600 hover:underline">Ver →</Link>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
