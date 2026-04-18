import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { sendRespuestaAdmin } from '@/lib/email'
import { crearNotificacion } from '@/lib/notificaciones'
import { registrarAudit } from '@/lib/audit'

const MAX_CONTENIDO = 2000

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  const solicitud = await prisma.solicitud.findUnique({
    where: { id: params.id },
    select: { id: true },
  })
  if (!solicitud) return NextResponse.json({ error: 'No encontrada' }, { status: 404 })

  const mensajes = await prisma.mensaje.findMany({
    where: { solicitudId: params.id },
    orderBy: { createdAt: 'asc' },
    select: { id: true, autorRol: true, contenido: true, leido: true, createdAt: true },
  })

  // Marcar como leídos los mensajes del cliente
  const noLeidos = mensajes.filter(m => m.autorRol === 'USER' && !m.leido).map(m => m.id)
  if (noLeidos.length > 0) {
    await prisma.mensaje.updateMany({ where: { id: { in: noLeidos } }, data: { leido: true } })
  }

  return NextResponse.json(mensajes)
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  const solicitud = await prisma.solicitud.findUnique({
    where: { id: params.id },
    include: { user: { select: { email: true, name: true } } },
  })
  if (!solicitud) return NextResponse.json({ error: 'No encontrada' }, { status: 404 })

  const body = await req.json()
  const contenido = typeof body.contenido === 'string' ? body.contenido.trim() : ''
  if (!contenido) return NextResponse.json({ error: 'El mensaje no puede estar vacío' }, { status: 422 })
  if (contenido.length > MAX_CONTENIDO) {
    return NextResponse.json({ error: `Máximo ${MAX_CONTENIDO} caracteres` }, { status: 422 })
  }

  const mensaje = await prisma.mensaje.create({
    data: { solicitudId: solicitud.id, autorRol: 'ADMIN', contenido },
  })

  registrarAudit(
    session.user.id, session.user.email!,
    'MENSAJE_ENVIADO', 'solicitud', params.id,
    `Mensaje al cliente — ${solicitud.referencia ?? params.id}: "${contenido.slice(0, 80)}"`,
    req,
  ).catch(console.error)

  // Notificación in-app al cliente
  if (solicitud.userId) {
    crearNotificacion(
      solicitud.userId,
      'MENSAJE',
      'Tienes una respuesta de CertiDocs',
      contenido.slice(0, 120),
      `/dashboard/solicitudes/${solicitud.id}`,
    ).catch(console.error)
  }

  // Notificar al cliente por email
  const clienteEmail = solicitud.user?.email ?? solicitud.emailInvitado
  if (clienteEmail) {
    await sendRespuestaAdmin({
      clienteEmail,
      clienteNombre: solicitud.user?.name ?? 'Cliente',
      referencia: solicitud.referencia ?? solicitud.id,
      solicitudId: solicitud.id,
      extracto: contenido.slice(0, 300),
    }).catch(() => {})
  }

  return NextResponse.json(mensaje, { status: 201 })
}
