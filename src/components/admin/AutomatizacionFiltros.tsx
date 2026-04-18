'use client'

import { useRouter } from 'next/navigation'

const ESTADOS = [
  { value: '', label: 'Todos' },
  { value: 'PENDIENTE', label: 'Pendiente' },
  { value: 'EN_CURSO', label: 'En curso' },
  { value: 'COMPLETADO', label: 'Completado' },
  { value: 'FALLIDO', label: 'Fallido' },
  { value: 'REQUIERE_MANUAL', label: 'Manual' },
]

export function AutomatizacionFiltros({ estadoActivo }: { estadoActivo: string }) {
  const router = useRouter()

  return (
    <div className="flex flex-wrap gap-2">
      {ESTADOS.map((e) => (
        <button
          key={e.value}
          onClick={() => router.push(`/admin/automatizacion${e.value ? `?estado=${e.value}` : ''}`)}
          className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
            estadoActivo === e.value
              ? 'bg-brand-600 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          {e.label}
        </button>
      ))}
    </div>
  )
}
