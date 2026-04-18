import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getStatsReferidos, obtenerOCrearReferralCode } from '@/lib/referidos'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const code = await obtenerOCrearReferralCode(session.user.id)
  const stats = await getStatsReferidos(session.user.id)

  const baseUrl = process.env.NEXTAUTH_URL ?? 'https://certidocs-xi.vercel.app'
  return NextResponse.json({
    ...stats,
    referralCode: code,
    referralUrl: `${baseUrl}/auth/registro?ref=${code}`,
  })
}
