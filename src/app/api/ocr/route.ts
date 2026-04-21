import { NextRequest, NextResponse } from 'next/server'
import { Mistral } from '@mistralai/mistralai'
import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger'

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
    const base64 = buffer.toString('base64')
    const isPdf = file.type === 'application/pdf'
    const mimeType = isPdf ? 'application/pdf' : file.type
    const dataUrl = `data:${mimeType};base64,${base64}`

    const client = new Mistral({ apiKey: process.env.MISTRAL_API_KEY ?? '' })

    // Step 1: OCR extraction
    const ocrResponse = await client.ocr.process({
      model: 'mistral-ocr-latest',
      document: isPdf
        ? { type: 'document_url', documentUrl: dataUrl }
        : { type: 'image_url', imageUrl: dataUrl },
    })

    const textoExtraido = ocrResponse.pages
      ?.map((p: any) => p.markdown ?? '')
      .join('\n\n')
      .trim() ?? ''

    if (!textoExtraido) {
      return NextResponse.json({ error: 'No se pudo extraer texto del documento' }, { status: 422 })
    }

    // Step 2: Structured field mapping
    const mappingResponse = await client.chat.complete({
      model: 'mistral-small-latest',
      messages: [{
        role: 'user',
        content: `Analiza este texto extraído de un certificado oficial español e identifica el tipo y extrae los campos del formulario.

Tipos posibles: NACIMIENTO, MATRIMONIO, DEFUNCION, EMPADRONAMIENTO, ANTECEDENTES_PENALES, VIDA_LABORAL

Campos por tipo:
- NACIMIENTO: nombre, apellido1, apellido2, fechaNacimiento (YYYY-MM-DD), lugarNacimiento (solo el nombre del municipio o ciudad, sin hospital ni clínica ni detalles adicionales), provinciaNacimiento (solo la provincia), nombrePadre (nombre completo del padre), nombreMadre (nombre completo de la madre)
- MATRIMONIO: c1Nombre, c1Apellido1, c1Apellido2, c2Nombre, c2Apellido1, c2Apellido2, fechaMatrimonio (YYYY-MM-DD), lugarMatrimonio
- DEFUNCION: nombre, apellido1, apellido2, fechaDefuncion (YYYY-MM-DD), lugarDefuncion, provinciaDefuncion
- EMPADRONAMIENTO: nombre, apellido1, apellido2, dni, municipio, direccion
- ANTECEDENTES_PENALES: nombre, apellido1, apellido2, dni, fechaNacimiento (YYYY-MM-DD), lugarNacimiento
- VIDA_LABORAL: nombre, apellido1, apellido2, dni, fechaNacimiento (YYYY-MM-DD)

Responde SOLO con JSON válido, sin explicaciones: {"tipo":"NACIMIENTO","campos":{"nombre":"...","apellido1":"...",...}}

TEXTO DEL DOCUMENTO:
${textoExtraido}`,
      }],
      responseFormat: { type: 'json_object' },
    })

    let tipoCertificado = ''
    let camposExtraidos: Record<string, string> = {}

    try {
      const raw = mappingResponse.choices?.[0]?.message?.content ?? '{}'
      const parsed = JSON.parse(typeof raw === 'string' ? raw : JSON.stringify(raw))
      tipoCertificado = parsed.tipo ?? ''
      camposExtraidos = parsed.campos ?? {}
    } catch {
      // Non-fatal: just skip pre-fill
    }

    const referencia = `OCR-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`

    await prisma.solicitud.create({
      data: {
        userId: null,
        emailInvitado: email.toLowerCase().trim(),
        tipo: 'OCR_EXTRACCION',
        datos: { textoExtraido, nombreArchivo: file.name, tipoCertificado, camposExtraidos },
        precio: 0,
        referencia,
      },
    })

    return NextResponse.json({
      texto: textoExtraido,
      tipoCertificado,
      campos: camposExtraidos,
      referencia,
    })
  } catch (err) {
    logger.error('[ocr]', err)
    return NextResponse.json({ error: 'Error al procesar el documento' }, { status: 500 })
  }
}

export const maxDuration = 30
export const dynamic = 'force-dynamic'
