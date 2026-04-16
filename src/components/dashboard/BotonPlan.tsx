'use client'

import { useState } from 'react'
import { Plan } from '@prisma/client'

interface Props {
  plan: Plan
  label: string
}

export function BotonPlan({ plan, label }: Props) {
  const [loading, setLoading] = useState(false)

  async function handleClick() {
    setLoading(true)
    const res = await fetch('/api/suscripcion/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ plan }),
    })
    const data = await res.json()
    if (data.url) window.location.href = data.url
    else setLoading(false)
  }

  return (
    <button onClick={handleClick} disabled={loading} className="btn-primary w-full text-sm py-2.5">
      {loading ? 'Redirigiendo...' : label}
    </button>
  )
}
