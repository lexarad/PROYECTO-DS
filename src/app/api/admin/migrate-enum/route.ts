import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

export async function GET(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get('secret')
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const directUrl = process.env.DIRECT_URL
  if (!directUrl) {
    return NextResponse.json({ error: 'DIRECT_URL not set' }, { status: 500 })
  }

  const client = new PrismaClient({ datasources: { db: { url: directUrl } } })
  const results: Record<string, string> = {}
  let values: string[] = []

  try {
    for (const value of ['OCR_EXTRACCION', 'TITULARIDAD_INMUEBLE']) {
      try {
        await client.$executeRawUnsafe(`ALTER TYPE "TipoCertificado" ADD VALUE IF NOT EXISTS '${value}'`)
        results[value] = 'ok'
      } catch (e: any) {
        results[value] = `error: ${e?.message ?? String(e)}`
      }
    }

    try {
      const rows: Array<{ enumlabel: string }> = await client.$queryRawUnsafe(
        `SELECT enumlabel FROM pg_enum e JOIN pg_type t ON e.enumtypid = t.oid WHERE t.typname = 'TipoCertificado' ORDER BY e.enumsortorder`
      )
      values = rows.map(x => x.enumlabel)
    } catch (e: any) {
      values = [`query failed: ${e?.message ?? String(e)}`]
    }
  } finally {
    await client.$disconnect()
  }

  return NextResponse.json({ results, values, directUrlHost: directUrl.replace(/^.*@/, '').replace(/[?].*$/, '') })
}

export const dynamic = 'force-dynamic'
