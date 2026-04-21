import { Browser } from 'playwright-core'
import { JobLogger } from '../logger'
import { capturarPantalla, aceptarCookies } from '../screenshot'
import { ResultadoAutomatizacion, DatosVidaLaboral } from '../types'
import { instalarHandlerPin } from '../auth/dnie'
import {
  rellenar, clickBoton, esperarCarga, extraerReferencia,
  detectarCaptcha, isDryRun, crearContexto, estaAutenticado,
  navegarAFormularioMJ,
} from './base'

// Sede electrónica de la Seguridad Social — Informe de Vida Laboral
const URL_TRAMITE = 'https://portal.seg-social.gob.es/wps/portal/importass/importass/Ciudadanos/vidaLaboral'

export async function tramitarVidaLaboral(
  browser: Browser,
  jobId: string,
  datos: DatosVidaLaboral,
  logger: JobLogger
): Promise<ResultadoAutomatizacion> {
  const screenshots: string[] = []
  const context = await crearContexto(browser, logger, URL_TRAMITE, jobId)
  const page = await context.newPage()
  instalarHandlerPin(page, logger)

  try {
    logger.log(`Navegando a ${URL_TRAMITE}`)
    await page.goto(URL_TRAMITE, { waitUntil: 'domcontentloaded', timeout: 60_000 })
    await aceptarCookies(page, logger)
    await esperarCarga(page, logger)
    await detectarCaptcha(page, logger)
    const s1 = await capturarPantalla(page, jobId, '01-inicio', logger)
    if (s1) screenshots.push(s1)

    if (isDryRun()) {
      logger.log('[DRY-RUN] Conectividad Seguridad Social verificada. Saliendo sin enviar formulario.')
      await context.close()
      return { ok: true, refOrganismo: 'DRY-RUN', screenshotUrls: screenshots, logs: logger.dump().split('\n') }
    }

    // ── Paso 2: Iniciar (con o sin autenticación) ──────────────────────────
    if (estaAutenticado()) {
      await navegarAFormularioMJ(page, logger, true)
    } else {
      // La Seguridad Social requiere identificación — sin auth es manual
      logger.log('La Vida Laboral requiere autenticación. Sin credenciales Cl@ve/certificado, el trámite debe ser manual.')
      await context.close()
      return {
        ok: false,
        error: 'La Vida Laboral requiere autenticación con Cl@ve Permanente o certificado digital. Configura CLAVEPIN_* en las variables de entorno.',
        screenshotUrls: screenshots,
        logs: logger.dump().split('\n'),
      }
    }

    await esperarCarga(page, logger)
    const s2 = await capturarPantalla(page, jobId, '02-autenticado', logger)
    if (s2) screenshots.push(s2)

    // ── Paso 3: Seleccionar tipo de informe ───────────────────────────────
    logger.log('Seleccionando tipo de informe de vida laboral')

    // La SS ofrece: "Informe de vida laboral completo" o "a fecha determinada"
    const tipoInforme = datos.tipoInforme ?? 'completo'
    const botonTipo = tipoInforme === 'fecha'
      ? ['A fecha determinada', 'Fecha concreta', 'Informe a fecha']
      : ['Informe completo', 'Vida laboral completa', 'Completo']

    await clickBoton(page, botonTipo, logger)
    await esperarCarga(page, logger)

    // Si es a fecha determinada, rellenar la fecha
    if (tipoInforme === 'fecha' && datos.fechaConsulta) {
      await rellenar(page, /fecha.*consulta|fecha.*informe/i, datos.fechaConsulta, logger, { name: 'FECHA_CONSULTA' })
    }

    const s3 = await capturarPantalla(page, jobId, '03-tipo-informe', logger)
    if (s3) screenshots.push(s3)

    // ── Paso 4: Datos de envío / método de recepción ──────────────────────
    // La SS permite: descarga directa, envío por email o correo postal
    const metodo = datos.metodoEnvio ?? 'email'
    logger.log(`Método de envío: ${metodo}`)

    if (metodo === 'email') {
      await clickBoton(page, ['Correo electrónico', 'Email', 'Por email'], logger)
      await rellenar(page, /correo.*electr[oó]nico|email|e-mail/i, datos.emailEnvio ?? datos.solEmail, logger, { name: 'EMAIL_ENVIO' })
    } else if (metodo === 'postal') {
      await clickBoton(page, ['Correo postal', 'Postal', 'Por correo'], logger)
    } else {
      await clickBoton(page, ['Descarga', 'Descargar', 'Inmediata'], logger)
    }

    const s4 = await capturarPantalla(page, jobId, '04-metodo-envio', logger)
    if (s4) screenshots.push(s4)

    // ── Paso 5: Confirmar y enviar ────────────────────────────────────────
    await clickBoton(page, ['Solicitar', 'Enviar', 'Confirmar', 'Aceptar'], logger)
    await esperarCarga(page, logger)

    const s5 = await capturarPantalla(page, jobId, '05-confirmacion', logger)
    if (s5) screenshots.push(s5)

    const refOrganismo = await extraerReferencia(page, logger)
    logger.log(`Referencia Seguridad Social: ${refOrganismo ?? '(no encontrada)'}`)

    await context.close()
    return {
      ok: true,
      refOrganismo: refOrganismo ?? undefined,
      screenshotUrls: screenshots,
      logs: logger.dump().split('\n'),
    }

  } catch (err) {
    const s = await capturarPantalla(page, jobId, 'error', logger).catch(() => null)
    if (s) screenshots.push(s)
    await context.close()
    throw err
  }
}
