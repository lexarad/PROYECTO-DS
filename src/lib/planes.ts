import { Plan } from '@prisma/client'

export interface PlanConfig {
  plan: Plan
  label: string
  descripcion: string
  precio: number       // €/mes
  descuento: number    // % sobre solicitudes
  maxSolicitudesMes: number | null  // null = ilimitadas
  apiAccess: boolean
  stripePriceId: string | null      // null = FREE (sin Stripe)
}

export const PLANES: PlanConfig[] = [
  {
    plan: 'FREE',
    label: 'Individual',
    descripcion: 'Para particulares que tramitan sus propios documentos.',
    precio: 0,
    descuento: 0,
    maxSolicitudesMes: 5,
    apiAccess: false,
    stripePriceId: null,
  },
  {
    plan: 'PRO',
    label: 'Profesional',
    descripcion: 'Para gestores, asesores y abogados. Descuento del 15% en todas las solicitudes.',
    precio: 29,
    descuento: 15,
    maxSolicitudesMes: 100,
    apiAccess: true,
    stripePriceId: process.env.STRIPE_PRICE_PRO ?? null,
  },
  {
    plan: 'ENTERPRISE',
    label: 'Empresa',
    descripcion: 'Para despachos y empresas. 25% de descuento y solicitudes ilimitadas.',
    precio: 79,
    descuento: 25,
    maxSolicitudesMes: null,
    apiAccess: true,
    stripePriceId: process.env.STRIPE_PRICE_ENTERPRISE ?? null,
  },
]

export function getPlan(plan: Plan): PlanConfig {
  return PLANES.find((p) => p.plan === plan)!
}

export function aplicarDescuento(precio: number, plan: Plan): number {
  const cfg = getPlan(plan)
  return parseFloat((precio * (1 - cfg.descuento / 100)).toFixed(2))
}
