import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'

const NAV = [
  { href: '/admin', label: 'Solicitudes' },
  { href: '/admin/usuarios', label: 'Usuarios' },
]

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'ADMIN') redirect('/dashboard')

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-brand-900 text-white">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/" className="font-bold text-lg">CertiDocs</Link>
            <span className="text-brand-100 text-xs font-medium bg-brand-700 px-2 py-0.5 rounded">ADMIN</span>
            <nav className="flex items-center gap-4">
              {NAV.map((n) => (
                <Link key={n.href} href={n.href} className="text-sm text-brand-200 hover:text-white transition-colors">
                  {n.label}
                </Link>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-brand-300">{session.user.email}</span>
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
