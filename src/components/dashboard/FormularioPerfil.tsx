'use client'

import { useState } from 'react'

interface Props {
  nombre: string
  email: string
  miembro: string
  tienePassword: boolean
}

export function FormularioPerfil({ nombre, email, miembro, tienePassword }: Props) {
  const [name, setName] = useState(nombre)
  const [savingName, setSavingName] = useState(false)
  const [nameMsg, setNameMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)

  const [currentPwd, setCurrentPwd] = useState('')
  const [newPwd, setNewPwd] = useState('')
  const [savingPwd, setSavingPwd] = useState(false)
  const [pwdMsg, setPwdMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)

  async function handleSaveName(e: React.FormEvent) {
    e.preventDefault()
    setSavingName(true)
    setNameMsg(null)
    const res = await fetch('/api/user/perfil', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    })
    const data = await res.json()
    setNameMsg(res.ok ? { type: 'ok', text: 'Nombre actualizado' } : { type: 'err', text: data.error })
    setSavingName(false)
  }

  async function handleChangePwd(e: React.FormEvent) {
    e.preventDefault()
    setSavingPwd(true)
    setPwdMsg(null)
    const res = await fetch('/api/user/perfil', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ currentPassword: currentPwd, newPassword: newPwd }),
    })
    const data = await res.json()
    if (res.ok) {
      setPwdMsg({ type: 'ok', text: 'Contraseña cambiada correctamente' })
      setCurrentPwd('')
      setNewPwd('')
    } else {
      setPwdMsg({ type: 'err', text: data.error })
    }
    setSavingPwd(false)
  }

  return (
    <div className="space-y-6">
      {/* Datos básicos */}
      <div className="card p-6">
        <h2 className="text-base font-semibold mb-4">Datos de la cuenta</h2>

        <div className="mb-4">
          <label className="block text-sm text-gray-500 mb-1">Email</label>
          <p className="text-gray-900 font-medium">{email}</p>
          <p className="text-xs text-gray-400 mt-0.5">Miembro desde {miembro}</p>
        </div>

        <form onSubmit={handleSaveName} className="flex items-end gap-3">
          <div className="flex-1">
            <label htmlFor="nombre" className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
            <input
              id="nombre"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="input w-full"
              minLength={2}
              required
            />
          </div>
          <button type="submit" disabled={savingName} className="btn-primary py-2 px-4 text-sm">
            {savingName ? 'Guardando...' : 'Guardar'}
          </button>
        </form>
        {nameMsg && (
          <p className={`text-xs mt-2 ${nameMsg.type === 'ok' ? 'text-green-600' : 'text-red-500'}`}>
            {nameMsg.text}
          </p>
        )}
      </div>

      {/* Cambio de contraseña */}
      {tienePassword && (
        <div className="card p-6">
          <h2 className="text-base font-semibold mb-4">Cambiar contraseña</h2>
          <form onSubmit={handleChangePwd} className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña actual</label>
              <input
                type="password"
                value={currentPwd}
                onChange={(e) => setCurrentPwd(e.target.value)}
                className="input w-full max-w-sm"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nueva contraseña</label>
              <input
                type="password"
                value={newPwd}
                onChange={(e) => setNewPwd(e.target.value)}
                className="input w-full max-w-sm"
                minLength={8}
                required
              />
              <p className="text-xs text-gray-400 mt-1">Mínimo 8 caracteres</p>
            </div>
            <button type="submit" disabled={savingPwd} className="btn-primary py-2 px-4 text-sm">
              {savingPwd ? 'Cambiando...' : 'Cambiar contraseña'}
            </button>
            {pwdMsg && (
              <p className={`text-xs ${pwdMsg.type === 'ok' ? 'text-green-600' : 'text-red-500'}`}>
                {pwdMsg.text}
              </p>
            )}
          </form>
        </div>
      )}
    </div>
  )
}
