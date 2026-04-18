'use client'

import { useState } from 'react'
import Link from 'next/link'

interface Props {
  pendientesTramitar: number
  jobsManuales: number
  email: string
}

export function AdminMobileMenu({ pendientesTramitar, jobsManuales, email }: Props) {
  const [open, setOpen] = useState(false)

  const LINKS = [
    { href: '/admin',               label: 'Solicitudes'    },
    { href: '/admin/analytics',     label: 'Analytics'      },
    { href: '/admin/tramitacion',   label: 'Tramitación',   badge: pendientesTramitar, badgeColor: 'bg-orange-500' },
    { href: '/admin/usuarios',      label: 'Usuarios'       },
    { href: '/admin/facturas',      label: 'Facturas'       },
    { href: '/admin/webhooks',      label: 'Webhooks'       },
    { href: '/admin/promos',        label: 'Promos'         },
    { href: '/admin/automatizacion',label: 'Automatización', badge: jobsManuales, badgeColor: 'bg-red-500' },
  ]

  return (
    <div className="md:hidden">
      <button
        onClick={() => setOpen(!open)}
        className="text-white p-1.5 rounded hover:bg-brand-700 transition-colors"
        aria-label="Menú"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          {open ? (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          ) : (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          )}
        </svg>
      </button>

      {open && (
        <div className="absolute top-full left-0 right-0 bg-brand-900 border-t border-brand-700 z-50 shadow-xl">
          <nav className="max-w-7xl mx-auto px-4 py-3 space-y-1">
            {LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="flex items-center justify-between text-brand-200 hover:text-white hover:bg-brand-800 px-3 py-2 rounded-lg text-sm transition-colors"
              >
                {link.label}
                {link.badge != null && link.badge > 0 && (
                  <span className={`${link.badgeColor} text-white text-xs font-bold px-1.5 py-0.5 rounded-full`}>
                    {link.badge}
                  </span>
                )}
              </Link>
            ))}
            <div className="border-t border-brand-700 pt-2 mt-2">
              <p className="text-xs text-brand-400 px-3 py-1">{email}</p>
              <Link href="/api/auth/signout" onClick={() => setOpen(false)} className="text-brand-300 hover:text-white text-sm px-3 py-2 block">
                Cerrar sesión
              </Link>
            </div>
          </nav>
        </div>
      )}
    </div>
  )
}
