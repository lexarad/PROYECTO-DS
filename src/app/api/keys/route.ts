import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { generarApiKey } from '@/lib/apikeys'
import { getPlan } from '@/lib/planes'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const keys = await prisma.apiKey.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: 'desc' },
    select: { id: true, nombre: true, keyPrefix: true, activa: true, lastUsedAt: true, createdAt: true },
  })

  return NextResponse.json(keys)
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  // Verificar que el plan permite API access
  const user = await prisma.user.findUnique({ where: { id: session.user.id } })
  const planCfg = getPlan(user!.plan)
  if (!planCfg.apiAccess) {
    return NextResponse.json(
      { error: 'Tu plan no incluye acceso a la API. Actualiza a Pro o Enterprise.' },
      { status: 403 }
    )
  }

  const { nombre } = await req.json()
  if (!nombre) return NextResponse.json({ error: 'El nombre es obligatorio' }, { status: 400 })

  const { key, keyHash, keyPrefix } = generarApiKey()

  await prisma.apiKey.create({
    data: { userId: session.user.id, nombre, keyHash, keyPrefix },
  })

  // Devolvemos la key en claro SOLO en esta respuesta
  return NextResponse.json({ key, keyPrefix, nombre }, { status: 201 })
}
