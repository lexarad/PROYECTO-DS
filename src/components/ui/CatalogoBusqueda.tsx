'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'

interface Certificado {
  tipo: string
  label: string
  descripcion: string
  precio: number
}

const TIEMPOS: Record<string, string> = {
  NACIMIENTO: '5–10 días',
  MATRIMONIO: '5–10 días',
  DEFUNCION: '5–10 días',
  EMPADRONAMIENTO: '3–5 días',
  ANTECEDENTES_PENALES: '24–48 h',
  VIDA_LABORAL: '24–48 h',
  ULTIMAS_VOLUNTADES: '10–15 días',
  SEGUROS_FALLECIMIENTO: '10–15 días',
}

export function CatalogoBusqueda({ certificados }: { certificados: Certificado[] }) {
  const [query, setQuery] = useState('')

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim()
    if (!q) return certificados
    return certificados.filter(
      (c) =>
        c.label.toLowerCase().includes(q) ||
        c.descripcion.toLowerCase().includes(q) ||
        c.tipo.toLowerCase().includes(q)
    )
  }, [query, certificados])

  return (
    <div>
      <div className="mb-8">
        <div className="relative max-w-md">
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
            🔍
          </span>
          <input
            type="search"
            placeholder="Buscar certificado..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="input pl-10 w-full"
          />
        </div>
        {query && (
          <p className="text-sm text-gray-500 mt-2">
            {filtered.length === 0
              ? 'Sin resultados para tu búsqueda'
              : `${filtered.length} certificado${filtered.length !== 1 ? 's' : ''} encontrado${filtered.length !== 1 ? 's' : ''}`}
          </p>
        )}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-4xl mb-3">🔎</div>
          <p className="text-gray-500">No encontramos certificados con ese término.</p>
          <button onClick={() => setQuery('')} className="text-sm text-brand-600 hover:underline mt-2">
            Ver todos los certificados
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((cert) => (
            <Link
              key={cert.tipo}
              href={`/solicitar/${cert.tipo.toLowerCase()}`}
              className="card p-6 hover:shadow-md border border-transparent hover:border-brand-200 transition-all group flex flex-col"
            >
              <div className="flex-1">
                <h2 className="font-semibold text-gray-900 group-hover:text-brand-600 transition-colors mb-1.5">
                  {cert.label}
                </h2>
                <p className="text-sm text-gray-500 mb-4">{cert.descripcion}</p>
              </div>
              <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                <div>
                  <span className="text-brand-600 font-bold text-lg">{cert.precio.toFixed(2)} €</span>
                  <p className="text-xs text-gray-400 mt-0.5">Plazo: {TIEMPOS[cert.tipo]}</p>
                </div>
                <span className="text-xs font-medium text-brand-600 bg-brand-50 px-3 py-1.5 rounded-full group-hover:bg-brand-600 group-hover:text-white transition-colors">
                  Solicitar
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
