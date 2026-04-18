import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const body = await req.json()

  // Cambiar nombre
  if (body.name !== undefined) {
    if (!body.name || String(body.name).trim().length < 2) {
      return NextResponse.json({ error: 'Nombre demasiado corto' }, { status: 400 })
    }
    await prisma.user.update({
      where: { id: session.user.id },
      data: { name: String(body.name).trim() },
    })
    return NextResponse.json({ ok: true })
  }

  // Cambiar contraseña
  if (body.currentPassword && body.newPassword) {
    if (String(body.newPassword).length < 8) {
      return NextResponse.json({ error: 'La nueva contraseña debe tener al menos 8 caracteres' }, { status: 400 })
    }
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { password: true },
    })
    if (!user?.password) {
      return NextResponse.json({ error: 'No puedes cambiar la contraseña de una cuenta OAuth' }, { status: 400 })
    }
    const valid = await bcrypt.compare(String(body.currentPassword), user.password)
    if (!valid) {
      return NextResponse.json({ error: 'Contraseña actual incorrecta' }, { status: 400 })
    }
    const hashed = await bcrypt.hash(String(body.newPassword), 12)
    await prisma.user.update({ where: { id: session.user.id }, data: { password: hashed } })
    return NextResponse.json({ ok: true })
  }

  return NextResponse.json({ error: 'Sin cambios válidos' }, { status: 400 })
}
