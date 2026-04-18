import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getCertificados } from '@/lib/certificados'

export async function GET(_req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (session?.user?.role !== 'ADMIN') return NextResponse.json({ error: 'No autorizado' }, { status: 403 })

  const configs = await prisma.precioConfig.findMany()
  const configMap = Object.fromEntries(configs.map(c => [c.tipo, c]))

  const todos = getCertificados().map(cert => ({
    tipo: cert.tipo,
    label: cert.label,
    precioDefault: cert.precio,
    precioActual: configMap[cert.tipo]?.precioBase ?? cert.precio,
    personalizado: !!configMap[cert.tipo],
    activo: configMap[cert.tipo]?.activo ?? true,
    descripcion: configMap[cert.tipo]?.descripcion ?? null,
    updatedAt: configMap[cert.tipo]?.updatedAt ?? null,
  }))

  return NextResponse.json(todos)
}
