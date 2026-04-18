import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { invalidarCachePrecio } from '@/lib/precios'
import { registrarAudit } from '@/lib/audit'
import type { TipoCertificado } from '@prisma/client'

const TIPOS_VALIDOS: TipoCertificado[] = [
  'NACIMIENTO', 'MATRIMONIO', 'DEFUNCION', 'EMPADRONAMIENTO',
  'ANTECEDENTES_PENALES', 'VIDA_LABORAL', 'ULTIMAS_VOLUNTADES', 'SEGUROS_FALLECIMIENTO',
]

export async function PATCH(req: NextRequest, { params }: { params: { tipo: string } }) {
  const session = await getServerSession(authOptions)
  if (session?.user?.role !== 'ADMIN') return NextResponse.json({ error: 'No autorizado' }, { status: 403 })

  const tipo = params.tipo as TipoCertificado
  if (!TIPOS_VALIDOS.includes(tipo)) return NextResponse.json({ error: 'Tipo inválido' }, { status: 400 })

  const body = await req.json()
  const precio = parseFloat(body.precioBase)
  if (isNaN(precio) || precio < 0 || precio > 9999) {
    return NextResponse.json({ error: 'Precio inválido (0–9999)' }, { status: 422 })
  }

  const config = await prisma.precioConfig.upsert({
    where: { tipo },
    update: {
      precioBase: precio,
      activo: body.activo ?? true,
      descripcion: body.descripcion ?? null,
    },
    create: {
      tipo,
      precioBase: precio,
      activo: body.activo ?? true,
      descripcion: body.descripcion ?? null,
    },
  })

  invalidarCachePrecio(tipo)

  registrarAudit(
    session.user.id, session.user.email!,
    'ESTADO_CAMBIADO', 'precio_config', tipo,
    `Precio ${tipo} actualizado → ${precio.toFixed(2)}€`,
    req,
  ).catch(console.error)

  return NextResponse.json(config)
}

export async function DELETE(req: NextRequest, { params }: { params: { tipo: string } }) {
  const session = await getServerSession(authOptions)
  if (session?.user?.role !== 'ADMIN') return NextResponse.json({ error: 'No autorizado' }, { status: 403 })

  await prisma.precioConfig.deleteMany({ where: { tipo: params.tipo as TipoCertificado } })
  invalidarCachePrecio(params.tipo)

  return new NextResponse(null, { status: 204 })
}
