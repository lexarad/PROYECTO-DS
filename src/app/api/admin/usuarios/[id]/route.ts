import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'
import { registrarAudit } from '@/lib/audit'
import { Role, Plan } from '@prisma/client'

const ROLES_VALIDOS  = Object.values(Role)
const PLANES_VALIDOS = Object.values(Plan)

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const user = await prisma.user.findUnique({
    where: { id: params.id },
    include: {
      solicitudes: {
        orderBy: { createdAt: 'desc' },
        select: {
          id: true, referencia: true, tipo: true, estado: true,
          precio: true, pagado: true, createdAt: true,
        },
      },
      _count: { select: { solicitudes: true, apiKeys: true, notificaciones: true } },
    },
  })

  if (!user) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const ltv = user.solicitudes
    .filter(s => s.pagado)
    .reduce((sum, s) => sum + s.precio, 0)

  return NextResponse.json({ ...user, ltv })
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  if (params.id === session.user.id) {
    return NextResponse.json({ error: 'No puedes editar tu propia cuenta' }, { status: 400 })
  }

  const body = await req.json()
  const data: Record<string, unknown> = {}

  if (body.role !== undefined) {
    if (!ROLES_VALIDOS.includes(body.role)) {
      return NextResponse.json({ error: 'Rol inválido' }, { status: 400 })
    }
    data.role = body.role
  }

  if (body.plan !== undefined) {
    if (!PLANES_VALIDOS.includes(body.plan)) {
      return NextResponse.json({ error: 'Plan inválido' }, { status: 400 })
    }
    data.plan = body.plan
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: 'Nada que actualizar' }, { status: 400 })
  }

  const user = await prisma.user.update({ where: { id: params.id }, data })

  const cambios = Object.entries(body)
    .filter(([k]) => ['role', 'plan'].includes(k))
    .map(([k, v]) => `${k}=${v}`)
    .join(', ')

  registrarAudit(
    session.user.id,
    session.user.email!,
    'USUARIO_ACTUALIZADO',
    'User',
    params.id,
    `Cambios: ${cambios} en usuario ${user.email}`,
    req,
  ).catch(console.error)

  return NextResponse.json({ ok: true, user })
}
