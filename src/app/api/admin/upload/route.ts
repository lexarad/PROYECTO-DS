import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { put } from '@vercel/blob'

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  const formData = await req.formData()
  const file = formData.get('file') as File | null

  if (!file) {
    return NextResponse.json({ error: 'No se ha enviado ningún archivo' }, { status: 400 })
  }

  const maxBytes = 20 * 1024 * 1024 // 20 MB
  if (file.size > maxBytes) {
    return NextResponse.json({ error: 'El archivo supera el límite de 20 MB' }, { status: 400 })
  }

  const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp']
  if (!allowedTypes.includes(file.type)) {
    return NextResponse.json({ error: 'Solo se permiten PDF, JPG y PNG' }, { status: 400 })
  }

  const timestamp = Date.now()
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
  const pathname = `certificados/${timestamp}-${safeName}`

  const blob = await put(pathname, file, {
    access: 'public',
    contentType: file.type,
  })

  return NextResponse.json({ url: blob.url, nombre: file.name })
}
