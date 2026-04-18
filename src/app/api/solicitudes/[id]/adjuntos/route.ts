import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { put } from '@vercel/blob'

const MAX_SIZE = 10 * 1024 * 1024 // 10 MB
const MAX_PER_SOLICITUD = 5
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'application/pdf']

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const solicitud = await prisma.solicitud.findUnique({
    where: { id: params.id, userId: session.user.id },
    select: { id: true, adjuntos: { orderBy: { createdAt: 'asc' } } },
  })

  if (!solicitud) return NextResponse.json({ error: 'No encontrada' }, { status: 404 })

  return NextResponse.json(solicitud.adjuntos)
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const solicitud = await prisma.solicitud.findUnique({
    where: { id: params.id, userId: session.user.id },
    select: { id: true, pagado: true, estado: true, _count: { select: { adjuntos: true } } },
  })

  if (!solicitud) return NextResponse.json({ error: 'No encontrada' }, { status: 404 })
  if (!solicitud.pagado) return NextResponse.json({ error: 'La solicitud debe estar pagada para adjuntar documentos' }, { status: 403 })
  if (['COMPLETADA', 'RECHAZADA'].includes(solicitud.estado)) {
    return NextResponse.json({ error: 'No se pueden añadir adjuntos a solicitudes cerradas' }, { status: 403 })
  }
  if (solicitud._count.adjuntos >= MAX_PER_SOLICITUD) {
    return NextResponse.json({ error: `Máximo ${MAX_PER_SOLICITUD} archivos por solicitud` }, { status: 422 })
  }

  const formData = await req.formData()
  const file = formData.get('file') as File | null
  if (!file) return NextResponse.json({ error: 'Archivo requerido' }, { status: 400 })

  if (file.size > MAX_SIZE) return NextResponse.json({ error: 'El archivo supera 10 MB' }, { status: 422 })
  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json({ error: 'Tipo de archivo no permitido. Usa PDF, JPG, PNG o WEBP' }, { status: 422 })
  }

  const pathname = `adjuntos/${solicitud.id}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`
  const blob = await put(pathname, file, { access: 'public' })

  const adjunto = await prisma.adjunto.create({
    data: {
      solicitudId: solicitud.id,
      nombre: file.name,
      url: blob.url,
      blobPathname: blob.pathname,
      tipo: file.type,
      tamanio: file.size,
    },
  })

  return NextResponse.json(adjunto, { status: 201 })
}
