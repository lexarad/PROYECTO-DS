import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(_req: Request, { params }: { params: { jobId: string } }) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const job = await (prisma as any).automatizacionJob.findUnique({
    where: { id: params.jobId },
    select: {
      estado: true,
      logs: true,
      error: true,
      refOrganismo: true,
      screenshotUrls: true,
      intentos: true,
      completadoAt: true,
      updatedAt: true,
    },
  })

  if (!job) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })

  return NextResponse.json(job)
}
