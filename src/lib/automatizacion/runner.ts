import { prisma } from '@/lib/prisma'
import { getBrowser } from './browser'
import { JobLogger } from './logger'
import { CaptchaError } from './forms/base'
import { tramitarNacimiento } from './forms/nacimiento'
import { tramitarMatrimonio } from './forms/matrimonio'
import { tramitarDefuncion } from './forms/defuncion'
import { tramitarUltimasVoluntades } from './forms/ultimas-voluntades'
import { tramitarSegurosFallecimiento } from './forms/seguros-fallecimiento'
import { tramitarAntecedentesPenales } from './forms/antecedentes-penales'
import { tramitarVidaLaboral } from './forms/vida-laboral'
import { validarDatos } from './schemas'
import { sendCambioEstado, sendAlertaManual } from '@/lib/email'
import type { TipoCertificado } from '@prisma/client'
import type {
  DatosNacimiento, DatosMatrimonio, DatosDefuncion, DatosFallecido, DatosAntecedentesPenales, DatosVidaLaboral,
} from './types'

const TIPOS_AUTOMATIZABLES = [
  'NACIMIENTO', 'MATRIMONIO', 'DEFUNCION',
  'ULTIMAS_VOLUNTADES', 'SEGUROS_FALLECIMIENTO', 'ANTECEDENTES_PENALES',
  'VIDA_LABORAL',
] as const

export type TipoAutomatizable = typeof TIPOS_AUTOMATIZABLES[number]

export function esAutomatizable(tipo: string): tipo is TipoAutomatizable {
  return TIPOS_AUTOMATIZABLES.includes(tipo as TipoAutomatizable)
}

/** Backoff exponencial: 5 → 10 → 20 min */
function calcularNextRetry(intentos: number): Date {
  const minutos = Math.pow(2, intentos) * 5
  return new Date(Date.now() + minutos * 60_000)
}

/** Crea un job pendiente cuando se confirma el pago */
export async function crearJob(solicitudId: string, tipo: string) {
  if (!esAutomatizable(tipo)) return null
  return (prisma as any).automatizacionJob.create({
    data: { solicitudId, tipo, estado: 'PENDIENTE' },
  }).catch(console.error)
}

/** Hard timeout: 4 min per job (Vercel limit is 5 min) */
const JOB_TIMEOUT_MS = 240_000

function withTimeout<T>(p: Promise<T>, ms: number, label: string): Promise<T> {
  return Promise.race([
    p,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`Timeout: ${label} superó ${ms / 1000}s`)), ms)
    ),
  ])
}

/** Selecciona la función de tramitación correcta */
function ejecutarTramite(
  tipo: TipoAutomatizable,
  browser: Awaited<ReturnType<typeof getBrowser>>,
  jobId: string,
  datos: Record<string, unknown>,
  logger: JobLogger
) {
  switch (tipo) {
    case 'NACIMIENTO':
      return tramitarNacimiento(browser, jobId, datos as unknown as DatosNacimiento, logger)
    case 'MATRIMONIO':
      return tramitarMatrimonio(browser, jobId, datos as unknown as DatosMatrimonio, logger)
    case 'DEFUNCION':
      return tramitarDefuncion(browser, jobId, datos as unknown as DatosDefuncion, logger)
    case 'ULTIMAS_VOLUNTADES':
      return tramitarUltimasVoluntades(browser, jobId, datos as unknown as DatosFallecido, logger)
    case 'SEGUROS_FALLECIMIENTO':
      return tramitarSegurosFallecimiento(browser, jobId, datos as unknown as DatosFallecido, logger)
    case 'ANTECEDENTES_PENALES':
      return tramitarAntecedentesPenales(browser, jobId, datos as unknown as DatosAntecedentesPenales, logger)
    case 'VIDA_LABORAL':
      return tramitarVidaLaboral(browser, jobId, datos as unknown as DatosVidaLaboral, logger)
  }
}

/** Procesa un job individual por ID */
export async function procesarJob(jobId: string): Promise<void> {
  // ── Atomic claim ──────────────────────────────────────────────────────────
  // Uses a single updateMany so that if two Vercel cron invocations run
  // simultaneously, only ONE of them transitions the row to EN_CURSO.
  // PostgreSQL guarantees that only one concurrent UPDATE wins.
  const claimed = await (prisma as any).automatizacionJob.updateMany({
    where: {
      id: jobId,
      estado: { in: ['PENDIENTE', 'FALLIDO'] },
      OR: [{ nextRetryAt: null }, { nextRetryAt: { lte: new Date() } }],
    },
    data: {
      estado: 'EN_CURSO',
      intentos: { increment: 1 },
      iniciadoAt: new Date(),
      nextRetryAt: null,
    },
  })

  if (claimed.count === 0) return  // Another worker already claimed it

  // ── Fetch full job after claiming ─────────────────────────────────────────
  const job = await (prisma as any).automatizacionJob.findUnique({
    where: { id: jobId },
    include: {
      solicitud: {
        include: { user: { select: { email: true, name: true } } },
      },
    },
  })

  if (!job) return

  // intentos was incremented atomically; check against limit
  if (job.intentos > job.maxIntentos) {
    await (prisma as any).automatizacionJob.update({
      where: { id: jobId },
      data: { estado: 'REQUIERE_MANUAL' },
    })
    sendAlertaManual({
      jobId,
      solicitudId: job.solicitudId,
      referencia: job.solicitud?.referencia ?? job.solicitudId,
      tipo: job.tipo,
      motivo: `Límite de intentos superado (${job.intentos}/${job.maxIntentos})`,
      intentos: job.intentos,
    }).catch(console.error)
    return
  }

  const logger = new JobLogger(async (logs) => {
    await (prisma as any).automatizacionJob.update({
      where: { id: jobId },
      data: { logs },
    })
  })
  const datos = job.solicitud.datos as Record<string, unknown>
  logger.log(`Iniciando job ${jobId} — tipo: ${job.tipo} — intento ${job.intentos}`)

  // ── Validar datos de entrada antes de tocar el browser ───────────────────
  const validacion = validarDatos(job.tipo as TipoCertificado, datos)
  if (!validacion.success) {
    const mensaje = 'error' in validacion
      ? (validacion.error instanceof Object && 'errors' in validacion.error
          ? JSON.stringify((validacion.error as any).errors)
          : String((validacion.error as any).message))
      : 'Datos inválidos'
    logger.error(`Validación fallida: ${mensaje}`)
    await (prisma as any).automatizacionJob.update({
      where: { id: jobId },
      data: {
        estado: 'REQUIERE_MANUAL',
        error: `Datos de entrada inválidos: ${mensaje}`,
        logs: logger.dump(),
      },
    })
    sendAlertaManual({
      jobId,
      solicitudId: job.solicitudId,
      referencia: job.solicitud?.referencia ?? job.solicitudId,
      tipo: job.tipo,
      motivo: `Datos inválidos: ${mensaje}`,
      intentos: job.intentos,
    }).catch(console.error)
    return
  }

  // ── Ejecutar con browser + timeout ────────────────────────────────────────
  try {
    const browser = await getBrowser()
    const resultado = await withTimeout(
      ejecutarTramite(job.tipo as TipoAutomatizable, browser, jobId, datos, logger),
      JOB_TIMEOUT_MS,
      job.tipo,
    )

    if (resultado.ok) {
      await (prisma as any).automatizacionJob.update({
        where: { id: jobId },
        data: {
          estado: 'COMPLETADO',
          refOrganismo: resultado.refOrganismo ?? null,
          screenshotUrls: resultado.screenshotUrls,
          logs: resultado.logs.join('\n'),
          completadoAt: new Date(),
          nextRetryAt: null,
          error: null,
        },
      })

      await prisma.solicitud.update({
        where: { id: job.solicitudId },
        data: {
          estado: 'TRAMITADO',
          historial: {
            create: {
              estado: 'TRAMITADO',
              nota: resultado.refOrganismo
                ? `Cursado automáticamente. Ref: ${resultado.refOrganismo}`
                : 'Cursado automáticamente ante el organismo.',
            },
          },
        },
      })

      logger.log(`Job ${jobId} completado. Ref organismo: ${resultado.refOrganismo ?? 'N/D'}`)

      const emailCliente = job.solicitud.user?.email ?? job.solicitud.emailInvitado
      const nombreCliente = job.solicitud.user?.name ?? 'Cliente'
      if (emailCliente) {
        sendCambioEstado({
          to: emailCliente,
          nombre: nombreCliente,
          tipoCertificado: job.solicitud.tipo,
          referencia: job.solicitud.referencia ?? '',
          estado: 'TRAMITADO',
          nota: resultado.refOrganismo
            ? `Número de expediente en el Ministerio de Justicia: ${resultado.refOrganismo}`
            : 'Hemos enviado tu solicitud al Ministerio de Justicia.',
        }).catch(console.error)
      }
    } else {
      const agotados = job.intentos >= job.maxIntentos
      await (prisma as any).automatizacionJob.update({
        where: { id: jobId },
        data: {
          estado: agotados ? 'REQUIERE_MANUAL' : 'FALLIDO',
          error: resultado.error ?? null,
          screenshotUrls: resultado.screenshotUrls,
          logs: resultado.logs.join('\n'),
          nextRetryAt: agotados ? null : calcularNextRetry(job.intentos),
        },
      })
      logger.error(`Job ${jobId} fallido: ${resultado.error}`)
      if (agotados) {
        sendAlertaManual({
          jobId,
          solicitudId: job.solicitudId,
          referencia: job.solicitud?.referencia ?? job.solicitudId,
          tipo: job.tipo,
          motivo: resultado.error ?? 'Error desconocido en la ejecución del formulario',
          intentos: job.intentos,
        }).catch(console.error)
      }
    }
  } catch (err) {
    const agotados = job.intentos >= job.maxIntentos
    const esCaptcha = err instanceof CaptchaError
    const necesitaManual = esCaptcha || agotados

    await (prisma as any).automatizacionJob.update({
      where: { id: jobId },
      data: {
        estado: necesitaManual ? 'REQUIERE_MANUAL' : 'FALLIDO',
        error: String(err),
        logs: logger.dump(),
        nextRetryAt: necesitaManual ? null : calcularNextRetry(job.intentos),
      },
    })
    if (necesitaManual) {
      sendAlertaManual({
        jobId,
        solicitudId: job.solicitudId,
        referencia: job.solicitud?.referencia ?? job.solicitudId,
        tipo: job.tipo,
        motivo: esCaptcha ? `CAPTCHA detectado: ${String(err)}` : String(err),
        intentos: job.intentos,
      }).catch(console.error)
    }
  }
}

/** Procesa todos los jobs pendientes/fallidos listos para reintentar */
export async function procesarJobsPendientes(): Promise<{ procesados: number; errores: number }> {
  const ahora = new Date()
  const jobs = await (prisma as any).automatizacionJob.findMany({
    where: {
      estado: { in: ['PENDIENTE', 'FALLIDO'] },
      intentos: { lt: 3 },
      OR: [{ nextRetryAt: null }, { nextRetryAt: { lte: ahora } }],
    },
    orderBy: { createdAt: 'asc' },
    take: 5,
    select: { id: true },
  })

  let procesados = 0
  let errores = 0

  // procesarJob uses atomic claim internally, so parallel calls are safe
  const resultados = await Promise.allSettled(jobs.map((job: { id: string }) => procesarJob(job.id)))
  for (const r of resultados) {
    if (r.status === 'fulfilled') procesados++
    else errores++
  }

  return { procesados, errores }
}
