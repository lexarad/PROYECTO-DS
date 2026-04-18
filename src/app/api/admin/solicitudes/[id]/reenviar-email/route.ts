import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { sendCambioEstado } from '@/lib/email'

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (session?.user?.role !== 'ADMIN') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  const solicitud = await prisma.solicitud.findUnique({
    where: { id: params.id },
    include: {
      user: { select: { email: true, name: true } },
      documentos: true,
    },
  })

  if (!solicitud) return NextResponse.json({ error: 'No encontrada' }, { status: 404 })

  const emailTo = solicitud.user?.email ?? solicitud.emailInvitado
  if (!emailTo) return NextResponse.json({ error: 'Sin email de cliente' }, { status: 400 })

  await sendCambioEstado({
    to: emailTo,
    nombre: solicitud.user?.name ?? emailTo,
    tipoCertificado: solicitud.tipo,
    referencia: solicitud.referencia!,
    estado: solicitud.estado,
    documentos: solicitud.documentos.map((d) => ({ nombre: d.nombre, url: d.url })),
  })

  return NextResponse.json({ ok: true })
}
