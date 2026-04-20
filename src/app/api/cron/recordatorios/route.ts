import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendRecordatorioPago } from '@/lib/email-recordatorio'
import { logger } from '@/lib/logger'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Ventanas de recordatorio: [desde, hasta] en horas
const VENTANAS = [
  { desde: 24, hasta: 36,  segundo: false },  // primer aviso ~24h
  { desde: 72, hasta: 84,  segundo: true  },  // segundo aviso ~72h (más urgente)
]

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const baseUrl = process.env.NEXTAUTH_URL ?? 'https://certidocs-xi.vercel.app'
  let enviados = 0
  let errores = 0

  for (const ventana of VENTANAS) {
    const desde = new Date(Date.now() - ventana.hasta * 60 * 60 * 1000)
    const hasta  = new Date(Date.now() - ventana.desde * 60 * 60 * 1000)

    const pendientes = await prisma.solicitud.findMany({
      where: {
        pagado: false,
        estado: { in: ['PENDIENTE'] },
        createdAt: { gte: desde, lte: hasta },
        stripeSessionId: { not: null },
        OR: [
          { emailInvitado: { not: null } },
          { userId: { not: null } },
        ],
      },
      include: { user: { select: { email: true, name: true } } },
      take: 50,
    })

    for (const s of pendientes) {
      const emailTo = s.user?.email ?? s.emailInvitado
      if (!emailTo || !s.referencia) continue

      const nombre = s.user?.name ?? emailTo.split('@')[0]
      const checkoutUrl = `${baseUrl}/solicitar/${s.tipo.toLowerCase()}`

      try {
        await sendRecordatorioPago({
          to: emailTo,
          nombre,
          tipoCertificado: s.tipo,
          referencia: s.referencia,
          precio: s.precio,
          checkoutUrl,
          segundo: ventana.segundo,
        })
        enviados++
      } catch (e) {
        logger.error(`Error enviando recordatorio a ${emailTo}:`, e)
        errores++
      }
    }
  }

  return NextResponse.json({
    ok: true,
    enviados,
    errores,
    timestamp: new Date().toISOString(),
  })
}
