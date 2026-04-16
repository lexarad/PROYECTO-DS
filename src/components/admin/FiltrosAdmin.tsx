'use client'

import { useRouter, usePathname } from 'next/navigation'
import { EstadoSolicitud, TipoCertificado } from '@prisma/client'

const ESTADOS: { value: EstadoSolicitud; label: string }[] = [
  { value: 'PENDIENTE', label: 'Pendiente' },
  { value: 'EN_PROCESO', label: 'En proceso' },
  { value: 'COMPLETADA', label: 'Completada' },
  { value: 'RECHAZADA', label: 'Rechazada' },
]

const TIPOS: { value: TipoCertificado; label: string }[] = [
  { value: 'NACIMIENTO', label: 'Nacimiento' },
  { value: 'MATRIMONIO', label: 'Matrimonio' },
  { value: 'DEFUNCION', label: 'Defunción' },
  { value: 'EMPADRONAMIENTO', label: 'Empadronamiento' },
  { value: 'ANTECEDENTES_PENALES', label: 'Antecedentes penales' },
  { value: 'VIDA_LABORAL', label: 'Vida laboral' },
]

interface Props {
  currentEstado?: string
  currentTipo?: string
  currentQ?: string
}

export function FiltrosAdmin({ currentEstado, currentTipo, currentQ }: Props) {
  const router = useRouter()
  const pathname = usePathname()

  function aplicar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = new FormData(e.currentTarget)
    const params = new URLSearchParams()
    const q = form.get('q') as string
    const estado = form.get('estado') as string
    const tipo = form.get('tipo') as string
    if (q) params.set('q', q)
    if (estado) params.set('estado', estado)
    if (tipo) params.set('tipo', tipo)
    router.push(`${pathname}?${params.toString()}`)
  }

  function limpiar() {
    router.push(pathname)
  }

  return (
    <form onSubmit={aplicar} className="flex flex-wrap gap-3 mb-6">
      <input
        name="q"
        defaultValue={currentQ}
        placeholder="Buscar por referencia, email o nombre..."
        className="input max-w-xs text-sm"
      />
      <select name="estado" defaultValue={currentEstado ?? ''} className="input w-auto text-sm">
        <option value="">Todos los estados</option>
        {ESTADOS.map((e) => <option key={e.value} value={e.value}>{e.label}</option>)}
      </select>
      <select name="tipo" defaultValue={currentTipo ?? ''} className="input w-auto text-sm">
        <option value="">Todos los tipos</option>
        {TIPOS.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
      </select>
      <button type="submit" className="btn-primary text-sm py-2 px-4">Filtrar</button>
      {(currentEstado || currentTipo || currentQ) && (
        <button type="button" onClick={limpiar} className="btn-secondary text-sm py-2 px-4">Limpiar</button>
      )}
    </form>
  )
}
