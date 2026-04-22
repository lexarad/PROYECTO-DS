import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get('secret')
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const results: Record<string, string> = {}
  for (const value of ['OCR_EXTRACCION', 'TITULARIDAD_INMUEBLE']) {
    try {
      await prisma.$executeRawUnsafe(`ALTER TYPE "TipoCertificado" ADD VALUE IF NOT EXISTS '${value}'`)
      results[value] = 'ok'
    } catch (e: any) {
      results[value] = `error: ${e?.message ?? String(e)}`
    }
  }

  const existing: Array<{ enumlabel: string }> = await prisma.$queryRawUnsafe(
    `SELECT enumlabel FROM pg_enum e JOIN pg_type t ON e.enumtypid = t.oid WHERE t.typname = 'TipoCertificado' ORDER BY e.enumsortorder`
  )

  return NextResponse.json({ results, values: existing.map(x => x.enumlabel) })
}

export const dynamic = 'force-dynamic'
