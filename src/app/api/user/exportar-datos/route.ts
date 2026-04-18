import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(_req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const [user, solicitudes, facturas, apiKeys, mensajes, notificaciones] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, name: true, email: true, plan: true, role: true, createdAt: true },
    }),
    prisma.solicitud.findMany({
      where: { userId: session.user.id },
      select: {
        id: true, referencia: true, tipo: true, estado: true,
        precio: true, pagado: true, datos: true, createdAt: true,
        historial: { select: { estado: true, nota: true, createdAt: true } },
        documentos: { select: { nombre: true, url: true, tipo: true, createdAt: true } },
        adjuntos: { select: { nombre: true, tipo: true, tamanio: true, createdAt: true } },
      },
    }),
    prisma.factura.findMany({
      where: { userId: session.user.id },
      select: { numero: true, total: true, tipoIVA: true, fechaEmision: true, concepto: true },
    }),
    prisma.apiKey.findMany({
      where: { userId: session.user.id },
      select: { nombre: true, keyPrefix: true, activa: true, lastUsedAt: true, createdAt: true },
    }),
    prisma.mensaje.findMany({
      where: { userId: session.user.id },
      select: { autorRol: true, contenido: true, createdAt: true },
    }),
    prisma.notificacion.findMany({
      where: { userId: session.user.id },
      select: { tipo: true, titulo: true, cuerpo: true, leida: true, createdAt: true },
      take: 200,
    }),
  ])

  const exportacion = {
    exportadoEn: new Date().toISOString(),
    usuario: user,
    solicitudes,
    facturas,
    apiKeys,
    mensajes,
    notificaciones,
  }

  return new NextResponse(JSON.stringify(exportacion, null, 2), {
    headers: {
      'Content-Type': 'application/json',
      'Content-Disposition': `attachment; filename="certidocs-datos-${session.user.id}.json"`,
    },
  })
}
