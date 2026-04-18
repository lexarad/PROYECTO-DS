import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { detectarMetodoAuth } from '@/lib/automatizacion/forms/base'

const MJ_URLS = [
  'https://sede.mjusticia.gob.es/es/tramites/certificado-nacimiento',
  'https://sede.mjusticia.gob.es/es/tramites/certificado-matrimonio',
  'https://sede.mjusticia.gob.es/es/tramites/certificado-defuncion',
]

async function checkUrl(url: string): Promise<{ url: string; ok: boolean; status?: number; ms: number }> {
  const start = Date.now()
  try {
    const res = await fetch(url, {
      method: 'HEAD',
      signal: AbortSignal.timeout(8000),
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; CertiDocs health-check)' },
    })
    return { url, ok: res.ok || res.status < 500, status: res.status, ms: Date.now() - start }
  } catch {
    return { url, ok: false, ms: Date.now() - start }
  }
}

export async function GET(_req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (session?.user?.role !== 'ADMIN') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  const [checks, stats] = await Promise.all([
    Promise.all(MJ_URLS.map(checkUrl)),
    (prisma as any).automatizacionJob.groupBy({
      by: ['estado'],
      _count: { estado: true },
    }),
  ])

  const estadosMap = Object.fromEntries(
    (stats as any[]).map((s: any) => [s.estado, s._count.estado])
  )

  const allOk = checks.every(c => c.ok)

  return NextResponse.json({
    mj: { ok: allOk, checks },
    jobs: estadosMap,
    auth: {
      metodo: detectarMetodoAuth(),
      clavepin: !!(process.env.CLAVEPIN_USER && process.env.CLAVEPIN_PASS && process.env.CLAVEPIN_TOTP_SECRET),
      dnie: process.env.DNIE_ENABLED === 'true',
      pkcs12: !!(process.env.CERT_P12_BASE64 && process.env.CERT_P12_PASSWORD),
    },
    dryRun: process.env.AUTOMATION_DRY_RUN === 'true',
    timestamp: new Date().toISOString(),
  })
}
