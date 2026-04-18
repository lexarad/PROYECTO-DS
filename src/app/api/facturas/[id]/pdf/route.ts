import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { renderToBuffer } from '@react-pdf/renderer'
import { FacturaPDF } from '@/lib/factura-pdf'
import React from 'react'
import type { DocumentProps } from '@react-pdf/renderer'

export const runtime = 'nodejs'

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const factura = await prisma.factura.findUnique({
    where: { id: params.id },
  })

  if (!factura) {
    return NextResponse.json({ error: 'Factura no encontrada' }, { status: 404 })
  }

  const isAdmin = session.user.role === 'ADMIN'
  const isOwner = factura.userId === session.user.id

  if (!isAdmin && !isOwner) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  const element = React.createElement(FacturaPDF, { factura }) as React.ReactElement<DocumentProps>
  const buffer = await renderToBuffer(element)

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${factura.numero}.pdf"`,
      'Cache-Control': 'private, max-age=3600',
    },
  })
}
