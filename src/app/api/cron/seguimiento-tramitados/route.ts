import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendActualizacionEspera, sendAlertaSeguimientoAdmin } from '@/lib/email'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 60

const DIAS_AVISO_CLIENTE = 15
const DIAS_ALERTA_ADMIN  = 15
const DIAS_ALERTA_URGENTE = 30

export async function GET(req: NextRequest) {
  const auth = req.headers.get('authorization')
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const ahora = new Date()
  const hace15d = new Date(ahora.getTime() - DIAS_ALERTA_ADMIN  * 24 * 60 * 60 * 1000)

  // Todas las solicitudes en TRAMITADO con más de 15 días en ese estado
  const tramitados = await prisma.solicitud.findMany({
    where: {
      estado: 'TRAMITADO',
      updatedAt: { lte: hace15d },
    },
    include: {
      user: { select: { email: true, name: true } },
      historial: {
        where: { estado: 'TRAMITADO' },
        orderBy: { createdAt: 'asc' },
        take: 1,
      },
    },
    take: 100,
  })

  let avisosCliente = 0
  let alertasAdmin  = 0
  let errores = 0

  for (const s of tramitados) {
    // Calcular días desde que entró en TRAMITADO (más preciso que updatedAt)
    const fechaTramitado = s.historial[0]?.createdAt ?? s.updatedAt
    const diasEspera = Math.floor((ahora.getTime() - fechaTramitado.getTime()) / 86_400_000)
    const urgente = diasEspera >= DIAS_ALERTA_URGENTE
    const emailCliente = s.user?.email ?? s.emailInvitado

    try {
      // Email proactivo al cliente en el día 15 exacto (±1 día de margen del cron diario)
      if (diasEspera >= DIAS_AVISO_CLIENTE && diasEspera < DIAS_AVISO_CLIENTE + 2 && emailCliente) {
        await sendActualizacionEspera({
          to: emailCliente,
          nombre: s.user?.name ?? emailCliente!.split('@')[0],
          tipoCertificado: s.tipo,
          referencia: s.referencia ?? s.id,
          diasEspera,
        })
        avisosCliente++
      }

      // Alerta al admin en día 15 y día 30
      const esUmbral15 = diasEspera >= DIAS_ALERTA_ADMIN && diasEspera < DIAS_ALERTA_ADMIN + 2
      const esUmbral30 = diasEspera >= DIAS_ALERTA_URGENTE && diasEspera < DIAS_ALERTA_URGENTE + 2
      if (esUmbral15 || esUmbral30) {
        await sendAlertaSeguimientoAdmin({
          solicitudId: s.id,
          referencia: s.referencia ?? s.id,
          tipoCertificado: s.tipo,
          diasEspera,
          urgente,
        })

        // Nota interna automática en la solicitud
        await prisma.solicitud.update({
          where: { id: s.id },
          data: {
            historial: {
              create: {
                estado: 'TRAMITADO',
                nota: `Seguimiento automático: ${diasEspera} días en organismo. Admin notificado${urgente ? ' (URGENTE)' : ''}.`,
              },
            },
          },
        })
        alertasAdmin++
      }
    } catch (e) {
      console.error(`Error en seguimiento de ${s.referencia}:`, e)
      errores++
    }
  }

  return NextResponse.json({
    ok: true,
    revisados: tramitados.length,
    avisosCliente,
    alertasAdmin,
    errores,
    timestamp: ahora.toISOString(),
  })
}
