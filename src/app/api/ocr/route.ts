import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { prisma } from '@/lib/prisma'
import { stripe } from '@/lib/stripe'
import { logger } from '@/lib/logger'

const client = new Anthropic()
const PRECIO_OCR = 4.9

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File | null
    const email = formData.get('email') as string | null

    if (!file || !email) {
      return NextResponse.json({ error: 'Falta archivo o email' }, { status: 400 })
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'Email inválido' }, { status: 400 })
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const mimeType = file.type as 'image/jpeg' | 'image/png' | 'image/webp' | 'image/gif'
    const isPdf = file.type === 'application/pdf'

    let textoExtraido = ''

    if (isPdf) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const pdfParse = (await import('pdf-parse' as any)) as any
      const data = await pdfParse(buffer)
      textoExtraido = data.text
    } else {
      const base64 = buffer.toString('base64')
      const response = await client.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 2048,
        messages: [{
          role: 'user',
          content: [
            {
              type: 'image',
              source: { type: 'base64', media_type: mimeType, data: base64 },
            },
            {
              type: 'text',
              text: 'Extrae y transcribe todos los datos y texto de este documento. Devuelve los campos como pares clave-valor estructurados. Si es un documento de identidad, certificado o formulario, identifica cada campo claramente.',
            },
          ],
        }],
      })
      textoExtraido = response.content[0].type === 'text' ? response.content[0].text : ''
    }

    const referencia = `OCR-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`

    const solicitud = await prisma.solicitud.create({
      data: {
        userId: null,
        emailInvitado: email.toLowerCase().trim(),
        tipo: 'OCR_EXTRACCION',
        datos: { textoExtraido, nombreArchivo: file.name },
        precio: PRECIO_OCR,
        referencia,
      },
    })

    const baseUrl = (process.env.NEXTAUTH_URL ?? 'http://localhost:3000').replace(/\/$/, '')

    const checkout = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      customer_email: email,
      line_items: [{
        quantity: 1,
        price_data: {
          currency: 'eur',
          unit_amount: Math.round(PRECIO_OCR * 100),
          product_data: {
            name: 'Extracción de datos por OCR',
            description: `Archivo: ${file.name} · Ref: ${referencia}`,
          },
        },
      }],
      metadata: { solicitudId: solicitud.id, invitado: 'true' },
      success_url: `${baseUrl}/pago/exito?ref=${referencia}&invitado=1`,
      cancel_url: `${baseUrl}/solicitar/ocr?cancelado=1`,
    })

    await prisma.solicitud.update({
      where: { id: solicitud.id },
      data: { stripeSessionId: checkout.id },
    })

    return NextResponse.json({
      texto: textoExtraido,
      checkoutUrl: checkout.url,
      referencia,
    })
  } catch (err) {
    logger.error('[ocr]', err)
    return NextResponse.json({ error: 'Error al procesar el documento' }, { status: 500 })
  }
}

export const maxDuration = 30
export const dynamic = 'force-dynamic'
