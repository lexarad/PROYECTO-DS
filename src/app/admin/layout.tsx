import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { prisma } from '@/lib/prisma'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'ADMIN') redirect('/dashboard')

  const pendientesTramitar = await prisma.solicitud.count({
    where: { pagado: true, estado: 'EN_PROCESO' },
  })

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-brand-900 text-white">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/" className="font-bold text-lg">CertiDocs</Link>
            <span className="text-brand-100 text-xs font-medium bg-brand-700 px-2 py-0.5 rounded">ADMIN</span>
            <nav className="flex items-center gap-4">
              <Link href="/admin" className="text-sm text-brand-200 hover:text-white transition-colors">
                Solicitudes
              </Link>
              <Link href="/admin/tramitacion" className="text-sm text-brand-200 hover:text-white transition-colors flex items-center gap-1.5">
                Tramitación
                {pendientesTramitar > 0 && (
                  <span className="bg-orange-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full leading-none">
                    {pendientesTramitar}
                  </span>
                )}
              </Link>
              <Link href="/admin/usuarios" className="text-sm text-brand-200 hover:text-white transition-colors">
                Usuarios
              </Link>
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-brand-300 hidden sm:block">{session.user.email}</span>
            <Link href="/api/auth/signout" className="text-xs text-brand-300 hover:text-white">Salir</Link>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-8">
        {children}
      </main>
    </div>
  )
}
