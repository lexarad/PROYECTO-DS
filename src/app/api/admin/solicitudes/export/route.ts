import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const runtime = 'nodejs'

function escapeCsv(val: unknown): string {
  const str = String(val ?? '')
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (session?.user?.role !== 'ADMIN') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  const { searchParams } = new URL(req.url)
  const desde = searchParams.get('desde')
  const hasta = searchParams.get('hasta')
  const soloPagadas = searchParams.get('pagadas') !== 'false'

  const where: Record<string, unknown> = {}
  if (soloPagadas) where.pagado = true
  if (desde || hasta) {
    where.createdAt = {}
    if (desde) (where.createdAt as Record<string, unknown>).gte = new Date(desde)
    if (hasta) (where.createdAt as Record<string, unknown>).lte = new Date(hasta)
  }

  const solicitudes = await prisma.solicitud.findMany({
    where,
    include: {
      user: { select: { email: true, name: true, plan: true } },
      factura: { select: { numero: true, baseImponible: true, cuotaIVA: true } },
    },
    orderBy: { createdAt: 'desc' },
  })

  const headers = [
    'Referencia', 'Fecha', 'Tipo', 'Estado', 'Pagado',
    'Precio total', 'Base imponible', 'IVA (21%)',
    'Nº Factura', 'Cliente nombre', 'Cliente email', 'Plan',
  ]

  const rows = solicitudes.map((s) => [
    s.referencia ?? '',
    new Date(s.createdAt).toLocaleDateString('es-ES'),
    s.tipo.replace(/_/g, ' '),
    s.estado,
    s.pagado ? 'Sí' : 'No',
    s.precio.toFixed(2),
    s.factura?.baseImponible.toFixed(2) ?? '',
    s.factura?.cuotaIVA.toFixed(2) ?? '',
    s.factura?.numero ?? '',
    s.user?.name ?? s.emailInvitado ?? '',
    s.user?.email ?? s.emailInvitado ?? '',
    s.user?.plan ?? 'INVITADO',
  ])

  const csv = [
    headers.map(escapeCsv).join(','),
    ...rows.map((r) => r.map(escapeCsv).join(',')),
  ].join('\r\n')

  const filename = `certidocs-solicitudes-${new Date().toISOString().slice(0, 10)}.csv`

  return new NextResponse('\uFEFF' + csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  })
}
