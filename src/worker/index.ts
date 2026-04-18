import { PrismaClient } from '@prisma/client'
import { scrapearCertificado } from '@/lib/scraping/mj'
import { getCertificado } from '@/lib/certificados'
import { supabase } from '@/lib/supabase'
import * as Sentry from '@sentry/node'

// Inicializar Sentry
Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV || 'development',
  tracesSampleRate: 1.0,
})

const prisma = new PrismaClient()
const POLL_INTERVAL = 30000 // 30s
const MAX_RETRIES = 3
const WORKER_ID = `worker-${Date.now()}-${Math.random()}`
let shuttingDown = false

async function logJob(jobId: string, message: string) {
  const job = await prisma.automatizacionJob.findUnique({ where: { id: jobId } })
  const newLogs = (job?.logs ? job.logs + '\n' : '') + `[${new Date().toISOString()}] ${message}`
  await prisma.automatizacionJob.update({
    where: { id: jobId },
    data: { logs: newLogs }
  })
}

async function processJob(job: any) {
  const solicitud = await prisma.solicitud.findUnique({
    where: { id: job.solicitudId },
    include: { user: true }
  })
  if (!solicitud) throw new Error('Solicitud not found')

  getCertificado(solicitud.tipo)
  const datos = { ...(solicitud.datos as Record<string, unknown> || {}), tipo: solicitud.tipo }

  try {
    const pdfBuffer = await scrapearCertificado(datos)

    // Subir PDF a Supabase Storage
    const fileName = `${job.id}.pdf`
    const { error } = await supabase.storage
      .from('certificados')
      .upload(fileName, pdfBuffer, {
        contentType: 'application/pdf',
        upsert: false
      })

    if (error) throw new Error(`Upload failed: ${error.message}`)

    const url = supabase.storage.from('certificados').getPublicUrl(fileName).data.publicUrl

    // Guardar documento
    await prisma.documento.create({
      data: {
        solicitudId: job.solicitudId,
        nombre: `${solicitud.tipo.toLowerCase()}.pdf`,
        url,
        tipo: 'PDF'
      }
    })

    // Actualizar estados
    await prisma.solicitud.update({
      where: { id: job.solicitudId },
      data: { estado: 'COMPLETADA' }
    })
    await prisma.automatizacionJob.update({
      where: { id: job.id },
      data: { estado: 'COMPLETADO', completadoAt: new Date() }
    })

    await logJob(job.id, 'Certificado generado exitosamente')
  } catch (error) {
    Sentry.captureException(error)
    await logJob(job.id, `Error: ${String(error)}`)
    
    if (job.intentos >= MAX_RETRIES) {
      await prisma.automatizacionJob.update({
        where: { id: job.id },
        data: { estado: 'REQUIERE_MANUAL', error: String(error) }
      })
    } else {
      // Reintentar con backoff exponencial
      const delay = Math.pow(2, job.intentos) * 1000 // 1s, 2s, 4s...
      const nextRetry = new Date(Date.now() + delay)
      await prisma.automatizacionJob.update({
        where: { id: job.id },
        data: { estado: 'PENDIENTE', intentos: { increment: 1 }, nextRetryAt: nextRetry, error: String(error) }
      })
    }
  }
}

async function pollAndProcess() {
  const job = await prisma.automatizacionJob.findFirst({
    where: { 
      estado: { in: ['PENDIENTE', 'FALLIDO'] },
      OR: [
        { nextRetryAt: null },
        { nextRetryAt: { lte: new Date() } }
      ]
    },
    orderBy: { createdAt: 'asc' }
  })

  if (job) {
    // Marcar como en curso
    await prisma.automatizacionJob.update({
      where: { id: job.id },
      data: { estado: 'EN_CURSO', iniciadoAt: new Date() }
    })

    console.log(`Processing job ${job.id}`)
    await processJob(job)
  }
}

async function main() {
  console.log(`Worker ${WORKER_ID} started`)
  while (!shuttingDown) {
    try {
      await pollAndProcess()
    } catch (error) {
      Sentry.captureException(error)
      console.error('Poll error:', error)
    }
    await new Promise(resolve => setTimeout(resolve, POLL_INTERVAL))
  }
}

process.on('SIGTERM', async () => {
  console.log(`Worker ${WORKER_ID} shutting down...`)
  shuttingDown = true
  await prisma.$disconnect()
  process.exit(0)
})

process.on('SIGINT', async () => {
  shuttingDown = true
  await prisma.$disconnect()
  process.exit(0)
})

main().catch(console.error)