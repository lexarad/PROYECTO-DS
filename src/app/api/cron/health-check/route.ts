import { NextRequest, NextResponse } from 'next/server'
import { sendAlertaMJ } from '@/lib/email'

export const runtime = 'nodejs'
export const maxDuration = 30

const MJ_URLS = [
  'https://sede.mjusticia.gob.es/es/tramites/certificado-nacimiento',
  'https://sede.mjusticia.gob.es/es/tramites/certificado-matrimonio',
  'https://sede.mjusticia.gob.es/es/tramites/certificado-defuncion',
]

async function checkUrl(url: string): Promise<boolean> {
  try {
    const res = await fetch(url, {
      method: 'HEAD',
      signal: AbortSignal.timeout(8000),
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; CertiDocs health-check)' },
    })
    return res.ok || res.status < 500
  } catch {
    return false
  }
}

export async function GET(req: NextRequest) {
  const auth = req.headers.get('authorization')
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const results = await Promise.all(MJ_URLS.map(async (url) => ({ url, ok: await checkUrl(url) })))
  const caidas = results.filter(r => !r.ok)

  if (caidas.length > 0) {
    await sendAlertaMJ({ caidas: caidas.map(r => r.url) }).catch(console.error)
  }

  return NextResponse.json({ ok: caidas.length === 0, caidas: caidas.map(r => r.url) })
}
