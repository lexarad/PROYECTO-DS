import { readFileSync, existsSync } from 'fs'
import { resolve } from 'path'

// Cargar .env manualmente (tsx/Node no lo hace por defecto cuando se lanza
// como script standalone). Este worker se ejecuta fuera del contexto Next.js.
const envPath = resolve(__dirname, '..', '..', '.env')
if (existsSync(envPath)) {
  const lines = readFileSync(envPath, 'utf-8').split('\n')
  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eq = trimmed.indexOf('=')
    if (eq === -1) continue
    const key = trimmed.slice(0, eq).trim()
    const val = trimmed.slice(eq + 1).trim().replace(/^["']|["']$/g, '')
    if (key && !(key in process.env)) process.env[key] = val
  }
}

import { PrismaClient } from '@prisma/client'
import * as Sentry from '@sentry/node'
import { procesarJob } from '@/lib/automatizacion/runner'

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV || 'development',
  tracesSampleRate: 1.0,
})

const prisma = new PrismaClient()
const POLL_INTERVAL = 5_000   // bajado de 30s a 5s para debugging local
const WORKER_ID = `worker-${Date.now()}-${Math.random()}`
let shuttingDown = false

// Log clave al arranque: confirma que .env se cargó y cómo va a lanzarse el browser
console.log(`[env] AUTOMATION_HEADLESS=${process.env.AUTOMATION_HEADLESS ?? '(no set)'}`)
console.log(`[env] CERT_P12_BASE64 len=${process.env.CERT_P12_BASE64?.length ?? 0}`)
console.log(`[env] DATABASE_URL=${process.env.DATABASE_URL ? '(set)' : '(NO SET!)'}`)

/**
 * Selecciona el siguiente job ejecutable (PENDIENTE/FALLIDO, con nextRetryAt vencido)
 * y lo procesa a través del runner oficial, que sí llama a la automatización real
 * contra la sede MJ (antes: stub `scrapearCertificado` que devolvía un PDF fake).
 */
let pollCount = 0
async function pollAndProcess() {
  pollCount++
  const job = await prisma.automatizacionJob.findFirst({
    where: {
      estado: { in: ['PENDIENTE', 'FALLIDO'] },
      intentos: { lt: 3 },
      OR: [
        { nextRetryAt: null },
        { nextRetryAt: { lte: new Date() } },
      ],
    },
    orderBy: { createdAt: 'asc' },
    select: { id: true, estado: true, intentos: true, nextRetryAt: true, tipo: true },
  })

  if (!job) {
    if (pollCount % 6 === 1) {
      // Cada 6 polls (30s) reportamos cuántos jobs hay totales y en qué estado
      const grupos = await prisma.automatizacionJob.groupBy({
        by: ['estado'], _count: { estado: true },
      }).catch(() => [])
      const resumen = (grupos as any[]).map(g => `${g.estado}=${g._count.estado}`).join(' ')
      console.log(`[poll ${pollCount}] sin jobs procesables — resumen DB: ${resumen || '(vacio)'}`)
    }
    return
  }

  console.log(`[${WORKER_ID}] Procesando job ${job.id} (${job.tipo}, estado=${job.estado}, intentos=${job.intentos})`)
  await procesarJob(job.id)
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
