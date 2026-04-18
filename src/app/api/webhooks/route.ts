import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { generarSecretWebhook } from '@/lib/webhooks-salientes'
import { getPlan } from '@/lib/planes'

const EVENTOS_VALIDOS = [
  'solicitud.estado_cambiado',
  'solicitud.completada',
  'solicitud.rechazada',
  'solicitud.tramitada',
]

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { plan: true } })
  if (!getPlan(user!.plan).apiAccess) {
    return NextResponse.json({ error: 'Plan PRO o superior requerido' }, { status: 403 })
  }

  const endpoints = await (prisma as any).webhookEndpoint.findMany({
    where: { userId: session.user.id },
    select: {
      id: true, url: true, activo: true, eventos: true, createdAt: true,
      _count: { select: { deliveries: true } },
    },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json({ endpoints })
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { plan: true } })
  if (!getPlan(user!.plan).apiAccess) {
    return NextResponse.json({ error: 'Plan PRO o superior requerido' }, { status: 403 })
  }

  const { url, eventos = EVENTOS_VALIDOS } = await req.json()
  if (!url || typeof url !== 'string') {
    return NextResponse.json({ error: 'URL requerida' }, { status: 400 })
  }
  try { new URL(url) } catch {
    return NextResponse.json({ error: 'URL inválida' }, { status: 400 })
  }

  const eventosInvalidos = (eventos as string[]).filter(e => !EVENTOS_VALIDOS.includes(e))
  if (eventosInvalidos.length) {
    return NextResponse.json({ error: `Eventos inválidos: ${eventosInvalidos.join(', ')}` }, { status: 400 })
  }

  const count = await (prisma as any).webhookEndpoint.count({ where: { userId: session.user.id } })
  if (count >= 10) {
    return NextResponse.json({ error: 'Máximo 10 endpoints permitidos' }, { status: 400 })
  }

  const secret = generarSecretWebhook()
  const endpoint = await (prisma as any).webhookEndpoint.create({
    data: { userId: session.user.id, url, secret, eventos },
    select: { id: true, url: true, activo: true, eventos: true, createdAt: true },
  })

  return NextResponse.json({ ...endpoint, secret }, { status: 201 })
}
