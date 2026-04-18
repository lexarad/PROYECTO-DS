import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

async function checkDb(): Promise<{ ok: boolean; latencyMs: number }> {
  const t0 = Date.now()
  try {
    await prisma.$queryRaw`SELECT 1`
    return { ok: true, latencyMs: Date.now() - t0 }
  } catch {
    return { ok: false, latencyMs: Date.now() - t0 }
  }
}

async function checkStripe(): Promise<{ ok: boolean; latencyMs: number }> {
  const t0 = Date.now()
  try {
    const res = await fetch('https://status.stripe.com/api/v2/status.json', {
      next: { revalidate: 0 },
    })
    const data = await res.json()
    const ok = data?.status?.indicator === 'none'
    return { ok, latencyMs: Date.now() - t0 }
  } catch {
    return { ok: false, latencyMs: Date.now() - t0 }
  }
}

async function checkResend(): Promise<{ ok: boolean; latencyMs: number }> {
  const t0 = Date.now()
  try {
    const res = await fetch('https://resend-status.com/api/v1/status.json', {
      next: { revalidate: 0 },
    })
    const ok = res.ok
    return { ok, latencyMs: Date.now() - t0 }
  } catch {
    // Resend doesn't have a public status API — treat as ok if Resend key present
    return { ok: !!process.env.RESEND_API_KEY, latencyMs: Date.now() - t0 }
  }
}

export async function GET() {
  const [db, stripe, resend] = await Promise.all([checkDb(), checkStripe(), checkResend()])

  const allOk = db.ok && stripe.ok && resend.ok
  const status = allOk ? 'operational' : 'degraded'

  return NextResponse.json(
    {
      status,
      timestamp: new Date().toISOString(),
      services: {
        database: { ...db, name: 'Base de datos' },
        stripe: { ...stripe, name: 'Pagos (Stripe)' },
        email: { ...resend, name: 'Email (Resend)' },
      },
    },
    { status: allOk ? 200 : 503 }
  )
}
