import { readFileSync, existsSync } from 'fs'
import { resolve } from 'path'

const envPath = resolve(__dirname, '..', '.env')
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

async function main() {
  const arg = process.argv[2]
  if (!arg) { console.error('Uso: npx tsx scripts/status-job.ts <jobId|referencia>'); process.exit(1) }

  const prisma = new PrismaClient()
  try {
    let job = await (prisma as any).automatizacionJob.findUnique({
      where: { id: arg },
      include: { solicitud: true },
    })
    if (!job) {
      const sol = await (prisma as any).solicitud.findFirst({
        where: { referencia: arg },
        include: { automatizacion: true },
      })
      if (sol?.automatizacion) {
        job = await (prisma as any).automatizacionJob.findUnique({
          where: { id: sol.automatizacion.id },
          include: { solicitud: true },
        })
      }
    }
    if (!job) { console.error(`No encontrado: ${arg}`); process.exit(1) }

    console.log(`=== Job ${job.id} ===`)
    console.log(`Solicitud:    ${job.solicitud?.referencia}`)
    console.log(`Tipo:         ${job.tipo}`)
    console.log(`Estado:       ${job.estado}`)
    console.log(`Intentos:     ${job.intentos}/${job.maxIntentos}`)
    console.log(`RefMJ:        ${job.refOrganismo ?? '(ninguna)'}`)
    console.log(`Iniciado:     ${job.iniciadoAt ?? '-'}`)
    console.log(`Completado:   ${job.completadoAt ?? '-'}`)
    console.log(`NextRetry:    ${job.nextRetryAt ?? '-'}`)
    console.log(`Error:        ${job.error ?? '(ninguno)'}`)
    console.log(`\n--- LOGS (últimas 80 líneas) ---`)
    const logs = (job.logs ?? '').split('\n')
    console.log(logs.slice(-80).join('\n'))
    console.log(`\n--- SCREENSHOTS ---`)
    console.log(JSON.stringify(job.screenshotUrls, null, 2))
  } finally {
    await prisma.$disconnect()
  }
}

main().catch(e => { console.error(e); process.exit(1) })
