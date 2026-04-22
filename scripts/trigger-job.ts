import 'dotenv/config'
import { procesarJob } from '../src/lib/automatizacion/runner'
import { closeBrowser } from '../src/lib/automatizacion/browser'
import { prisma } from '../src/lib/prisma'

async function main() {
  const arg = process.argv[2]
  if (!arg) {
    console.error('Uso: npx tsx scripts/trigger-job.ts <referencia|jobId>')
    console.error('Ej:  npx tsx scripts/trigger-job.ts CD-1776729959486-UW9C')
    process.exit(1)
  }

  let jobId = arg
  if (arg.startsWith('CD-')) {
    const solicitud = await prisma.solicitud.findFirst({
      where: { referencia: arg },
      select: { id: true, tipo: true, estado: true },
    })
    if (!solicitud) {
      console.error(`Solicitud con referencia ${arg} no encontrada`)
      process.exit(1)
    }
    console.log(`✓ Solicitud: ${solicitud.id} (${solicitud.tipo}, ${solicitud.estado})`)

    const job = await (prisma as any).automatizacionJob.findFirst({
      where: { solicitudId: solicitud.id },
      orderBy: { createdAt: 'desc' },
    })
    if (!job) {
      console.error('No hay AutomatizacionJob para esa solicitud')
      process.exit(1)
    }
    jobId = job.id
    console.log(`✓ Job: ${jobId} (estado: ${job.estado}, intentos: ${job.intentos}/${job.maxIntentos})`)
  }

  console.log(`\n→ Lanzando job ${jobId}...`)
  const antes = await (prisma as any).automatizacionJob.findUnique({ where: { id: jobId } })
  if (!antes) {
    console.error('Job no encontrado')
    process.exit(1)
  }

  if (antes.estado !== 'PENDIENTE' && antes.estado !== 'FALLIDO') {
    console.log(`  Forzando estado a PENDIENTE (estaba en ${antes.estado})...`)
    await (prisma as any).automatizacionJob.update({
      where: { id: jobId },
      data: { estado: 'PENDIENTE', intentos: 0, error: null, nextRetryAt: null },
    })
  } else if (antes.nextRetryAt && antes.nextRetryAt > new Date()) {
    console.log(`  Limpiando nextRetryAt para que corra ya...`)
    await (prisma as any).automatizacionJob.update({
      where: { id: jobId },
      data: { nextRetryAt: null },
    })
  }

  await procesarJob(jobId)

  const despues = await (prisma as any).automatizacionJob.findUnique({ where: { id: jobId } })
  console.log(`\n${'═'.repeat(60)}`)
  console.log(`← Estado final: ${despues?.estado}`)
  console.log(`  intentos: ${despues?.intentos}/${despues?.maxIntentos}`)
  console.log(`  refOrganismo: ${despues?.refOrganismo ?? 'null'}`)
  console.log(`  error: ${despues?.error ?? 'null'}`)
  console.log(`  screenshots: ${(despues?.screenshotUrls ?? []).length}`)
  console.log(`${'═'.repeat(60)}\n`)
  console.log(`logs:\n${despues?.logs ?? '(vacío)'}`)

  await closeBrowser()
  await prisma.$disconnect()
}

main().catch((e) => {
  console.error('❌ Error fatal:', e)
  process.exit(1)
})
