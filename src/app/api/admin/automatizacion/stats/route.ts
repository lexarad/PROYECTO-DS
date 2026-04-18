import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const [pendiente, en_curso, completado, fallido, requiere_manual] = await Promise.all([
    (prisma as any).automatizacionJob.count({ where: { estado: 'PENDIENTE' } }),
    (prisma as any).automatizacionJob.count({ where: { estado: 'EN_CURSO' } }),
    (prisma as any).automatizacionJob.count({ where: { estado: 'COMPLETADO' } }),
    (prisma as any).automatizacionJob.count({ where: { estado: 'FALLIDO' } }),
    (prisma as any).automatizacionJob.count({ where: { estado: 'REQUIERE_MANUAL' } }),
  ])

  return NextResponse.json({ pendiente, en_curso, completado, fallido, requiere_manual })
}
