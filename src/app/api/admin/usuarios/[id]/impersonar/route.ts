import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'
import { registrarAudit } from '@/lib/audit'

// Returns a magic link to view the dashboard as that user (read-only simulation)
// We do NOT actually create a session — we just redirect the admin to the user's
// public-facing dashboard page so they can visually inspect it.
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const user = await prisma.user.findUnique({
    where: { id: params.id },
    select: { id: true, email: true },
  })
  if (!user) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  registrarAudit(
    session.user.id,
    session.user.email!,
    'VISTA_USUARIO',
    'User',
    params.id,
    `Vista del perfil de ${user.email}`,
    req,
  ).catch(console.error)

  return NextResponse.json({ ok: true, userId: user.id })
}
