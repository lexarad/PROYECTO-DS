import { Browser } from 'playwright-core'
import { instalarHandlerPin } from '../auth/dnie'
import { JobLogger } from '../logger'
import { capturarPantalla, aceptarCookies } from '../screenshot'
import { ResultadoAutomatizacion, DatosAntecedentesPenales } from '../types'
import {
  rellenar, seleccionar, clickBoton,
  esperarCarga, extraerReferencia, rellenarSolicitante,
  detectarCaptcha, isDryRun, crearContexto, estaAutenticado,
  navegarAFormularioMJ,
} from './base'

const URL_TRAMITE = 'https://sede.mjusticia.gob.es/es/tramites/certificado-antecedentes-penales'

export async function tramitarAntecedentesPenales(
  browser: Browser,
  jobId: string,
  datos: DatosAntecedentesPenales,
  logger: JobLogger
): Promise<ResultadoAutomatizacion> {
  const screenshots: string[] = []
  const context = await crearContexto(browser, logger, URL_TRAMITE, jobId)
  const page = await context.newPage()
  instalarHandlerPin(page, logger)

  try {
    // ── Paso 1: Abrir página del trámite ──
    logger.log(`Navegando a ${URL_TRAMITE}`)
    await page.goto(URL_TRAMITE, { waitUntil: 'domcontentloaded', timeout: 30_000 })
    await aceptarCookies(page, logger)
    await esperarCarga(page, logger)
    await detectarCaptcha(page, logger)
    const s1 = await capturarPantalla(page, jobId, '01-inicio', logger)
    if (s1) screenshots.push(s1)

    if (isDryRun()) {
      logger.log('[DRY-RUN] Conectividad MJ (Antecedentes) verificada. Saliendo sin enviar formulario.')
      await context.close()
      return { ok: true, refOrganismo: 'DRY-RUN', screenshotUrls: screenshots, logs: logger.dump().split('\n') }
    }

    // ── Paso 2: Navegar al formulario ──
    await navegarAFormularioMJ(page, logger, estaAutenticado())
    await esperarCarga(page, logger)
    const s2 = await capturarPantalla(page, jobId, '02-formulario', logger)
    if (s2) screenshots.push(s2)

    // ── Paso 3: Datos del interesado ──
    logger.log('Rellenando datos del interesado')
    await rellenar(page, /nombre/i, datos.nombre, logger, { name: 'NOMBRE' })
    await rellenar(page, /primer apellido/i, datos.apellido1, logger, { name: 'APELLIDO1' })
    if (datos.apellido2) {
      await rellenar(page, /segundo apellido/i, datos.apellido2, logger, { name: 'APELLIDO2' })
    }
    await rellenar(page, /fecha.*nacimiento/i, datos.fechaNacimiento, logger, { name: 'FECHA_NACIMIENTO' })

    // ── Paso 4: Tipo y número de documento ──
    logger.log('Rellenando tipo y número de documento')
    await seleccionar(page, /tipo.*documento/i, datos.tipoDocumento, logger, { name: 'TIPO_DOC' })
    await rellenar(page, /n[úu]mero.*documento|DNI|NIE/i, datos.numeroDocumento, logger, { name: 'NUM_DOC' })

    // ── Paso 5: Opciones del certificado ──
    logger.log('Seleccionando opciones del certificado')
    await seleccionar(page, /finalidad/i, datos.finalidad, logger, { name: 'FINALIDAD' })
    await seleccionar(page, /modalidad|tipo.*solicitud|urgente/i, datos.modalidad, logger, { name: 'MODALIDAD' })

    const s3 = await capturarPantalla(page, jobId, '03-datos-interesado', logger)
    if (s3) screenshots.push(s3)

    // ── Paso 6: Siguiente ──
    await clickBoton(page, ['Siguiente', 'Continuar', 'Avanzar'], logger)
    await esperarCarga(page, logger)

    // ── Paso 7: Datos del solicitante ──
    logger.log('Rellenando datos del solicitante')
    await rellenarSolicitante(page, datos, logger)

    const s4 = await capturarPantalla(page, jobId, '04-solicitante', logger)
    if (s4) screenshots.push(s4)

    // ── Paso 8: Enviar ──
    await clickBoton(page, ['Enviar', 'Presentar', 'Firmar y enviar', 'Confirmar'], logger)
    await esperarCarga(page, logger)

    const s5 = await capturarPantalla(page, jobId, '05-confirmacion', logger)
    if (s5) screenshots.push(s5)

    // ── Paso 9: Extraer referencia ──
    const refOrganismo = await extraerReferencia(page, logger)
    logger.log(`Referencia del organismo: ${refOrganismo ?? '(no encontrada)'}`)

    await context.close()
    return { ok: true, refOrganismo: refOrganismo ?? undefined, screenshotUrls: screenshots, logs: logger.dump().split('\n') }

  } catch (err) {
    const s = await capturarPantalla(page, jobId, 'error', logger).catch(() => null)
    if (s) screenshots.push(s)
    await context.close()
    throw err
  }
}
