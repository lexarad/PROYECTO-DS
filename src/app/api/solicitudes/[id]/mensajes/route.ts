import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { sendMensajeCliente } from '@/lib/email'

const MAX_CONTENIDO = 2000

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const solicitud = await prisma.solicitud.findUnique({
    where: { id: params.id, userId: session.user.id },
    select: { id: true },
  })
  if (!solicitud) return NextResponse.json({ error: 'No encontrada' }, { status: 404 })

  const mensajes = await prisma.mensaje.findMany({
    where: { solicitudId: params.id },
    orderBy: { createdAt: 'asc' },
    select: { id: true, autorRol: true, contenido: true, leido: true, createdAt: true },
  })

  // Marcar como leídos los mensajes del admin que el cliente aún no ha visto
  const noLeidos = mensajes.filter(m => m.autorRol === 'ADMIN' && !m.leido).map(m => m.id)
  if (noLeidos.length > 0) {
    await prisma.mensaje.updateMany({ where: { id: { in: noLeidos } }, data: { leido: true } })
  }

  return NextResponse.json(mensajes)
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const solicitud = await prisma.solicitud.findUnique({
    where: { id: params.id, userId: session.user.id },
    select: { id: true, referencia: true, estado: true },
  })
  if (!solicitud) return NextResponse.json({ error: 'No encontrada' }, { status: 404 })
  if (['COMPLETADA', 'RECHAZADA'].includes(solicitud.estado)) {
    return NextResponse.json({ error: 'No se pueden enviar mensajes en solicitudes cerradas' }, { status: 403 })
  }

  const body = await req.json()
  const contenido = typeof body.contenido === 'string' ? body.contenido.trim() : ''
  if (!contenido) return NextResponse.json({ error: 'El mensaje no puede estar vacío' }, { status: 422 })
  if (contenido.length > MAX_CONTENIDO) {
    return NextResponse.json({ error: `Máximo ${MAX_CONTENIDO} caracteres` }, { status: 422 })
  }

  const mensaje = await prisma.mensaje.create({
    data: {
      solicitudId: solicitud.id,
      userId: session.user.id,
      autorRol: 'USER',
      contenido,
    },
  })

  // Notificar al admin por email
  const adminEmail = process.env.ADMIN_EMAIL
  if (adminEmail) {
    await sendMensajeCliente({
      adminEmail,
      clienteNombre: session.user.name ?? session.user.email ?? 'Cliente',
      referencia: solicitud.referencia ?? solicitud.id,
      solicitudId: solicitud.id,
      extracto: contenido.slice(0, 300),
    }).catch(() => {})
  }

  return NextResponse.json(mensaje, { status: 201 })
}
