/**
 * reset-job.ts — Resetea un job y su solicitud para re-ejecución por el worker
 *
 * Uso: npx tsx scripts/reset-job.ts <jobId|referenciaSolicitud>
 *
 * Útil cuando un job fue marcado COMPLETADO por código antiguo (stub)
 * y necesitamos que el worker real lo vuelva a procesar contra el MJ.
 */

import { readFileSync, existsSync } from 'fs'
import { resolve } from 'path'

// Cargar .env
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
  if (!arg) {
    console.error('Uso: npx tsx scripts/reset-job.ts <jobId|referenciaSolicitud>')
    process.exit(1)
  }

  const prisma = new PrismaClient()

  try {
    // Buscar por jobId directo, o por referencia de solicitud
    let job = await (prisma as any).automatizacionJob.findUnique({
      where: { id: arg },
      include: { solicitud: true },
    })

    if (!job) {
      const solicitud = await (prisma as any).solicitud.findFirst({
        where: { referencia: arg },
        include: { automatizacion: true },
      })
      if (solicitud?.automatizacion) {
        const jid = solicitud.automatizacion.id
        job = await (prisma as any).automatizacionJob.findUnique({
          where: { id: jid },
          include: { solicitud: true },
        })
      }
    }

    if (!job) {
      console.error(`❌ No se encontró job ni solicitud con "${arg}"`)
      process.exit(1)
    }

    console.log('📋 Job actual:')
    console.log(`   ID:          ${job.id}`)
    console.log(`   Solicitud:   ${job.solicitud?.referencia} (${job.solicitudId})`)
    console.log(`   Tipo:        ${job.tipo}`)
    console.log(`   Estado:      ${job.estado}`)
    console.log(`   Intentos:    ${job.intentos}/${job.maxIntentos}`)
    console.log(`   RefMJ:       ${job.refOrganismo ?? '(ninguna)'}`)

    // Resetear job → PENDIENTE, sin ref, contador en 0
    await (prisma as any).automatizacionJob.update({
      where: { id: job.id },
      data: {
        estado: 'PENDIENTE',
        intentos: 0,
        nextRetryAt: null,
        iniciadoAt: null,
        completadoAt: null,
        refOrganismo: null,
        error: null,
        logs: null,
        screenshotUrls: [],
      },
    })

    // Resetear solicitud → EN_PROCESO para que el worker la coja
    await (prisma as any).solicitud.update({
      where: { id: job.solicitudId },
      data: {
        estado: 'EN_PROCESO',
        historial: {
          create: {
            estado: 'EN_PROCESO',
            nota: `Job reseteado manualmente (era "${job.estado}"). Pendiente de reproceso por worker con código corregido.`,
          },
        },
      },
    })

    console.log('\n✅ Job reseteado. Estado → PENDIENTE, intentos → 0.')
    console.log('   Ejecuta el worker: npm run worker')
    console.log('   (o directamente: npx tsx src/worker/index.ts)')
  } finally {
    await prisma.$disconnect()
  }
}

main().catch(err => {
  console.error('Error:', err)
  process.exit(1)
})
