import { NextRequest, NextResponse } from 'next/server'
import { procesarJobsPendientes } from '@/lib/automatizacion/runner'

export const runtime = 'nodejs'
export const maxDuration = 300

export async function GET(req: NextRequest) {
  const auth = req.headers.get('authorization')
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const resultado = await procesarJobsPendientes()
  return NextResponse.json({ ok: true, ...resultado })
}
