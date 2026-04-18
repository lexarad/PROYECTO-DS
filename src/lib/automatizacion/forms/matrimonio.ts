import { Browser } from 'playwright-core'
import { instalarHandlerPin } from '../auth/dnie'
import { JobLogger } from '../logger'
import { capturarPantalla, aceptarCookies } from '../screenshot'
import { ResultadoAutomatizacion, DatosMatrimonio } from '../types'
import {
  rellenar, seleccionar, clickBoton,
  esperarCarga, extraerReferencia, rellenarSolicitante,
  detectarCaptcha, isDryRun, crearContexto, estaAutenticado,
  navegarAFormularioMJ,
} from './base'

const URL_TRAMITE = 'https://sede.mjusticia.gob.es/es/tramites/certificado-matrimonio'

export async function tramitarMatrimonio(
  browser: Browser,
  jobId: string,
  datos: DatosMatrimonio,
  logger: JobLogger
): Promise<ResultadoAutomatizacion> {
  const screenshots: string[] = []
  const context = await crearContexto(browser, logger, URL_TRAMITE, jobId)
  const page = await context.newPage()
  instalarHandlerPin(page, logger)

  try {
    logger.log(`Navegando a ${URL_TRAMITE}`)
    await page.goto(URL_TRAMITE, { waitUntil: 'domcontentloaded', timeout: 30_000 })
    await aceptarCookies(page, logger)
    await esperarCarga(page, logger)
    await detectarCaptcha(page, logger)
    const s1 = await capturarPantalla(page, jobId, '01-inicio', logger)
    if (s1) screenshots.push(s1)

    if (isDryRun()) {
      logger.log('[DRY-RUN] Conectividad MJ verificada. Saliendo sin enviar formulario.')
      await context.close()
      return { ok: true, refOrganismo: 'DRY-RUN', screenshotUrls: screenshots, logs: logger.dump().split('\n') }
    }

    await navegarAFormularioMJ(page, logger, estaAutenticado())
    await esperarCarga(page, logger)

    // Cónyuge 1
    logger.log('Rellenando datos cónyuge 1')
    await rellenar(page, /nombre.*c[oó]nyuge.*1|primer.*contrayente.*nombre/i, datos.c1Nombre, logger, { name: 'NOMBRE_CONYUGE1' })
    await rellenar(page, /primer apellido.*c[oó]nyuge.*1|1.*apellido.*contrayente/i, datos.c1Apellido1, logger, { name: 'APELLIDO1_CONYUGE1' })
    if (datos.c1Apellido2) {
      await rellenar(page, /segundo apellido.*c[oó]nyuge.*1/i, datos.c1Apellido2, logger, { name: 'APELLIDO2_CONYUGE1' })
    }

    // Cónyuge 2
    logger.log('Rellenando datos cónyuge 2')
    await rellenar(page, /nombre.*c[oó]nyuge.*2|segundo.*contrayente.*nombre/i, datos.c2Nombre, logger, { name: 'NOMBRE_CONYUGE2' })
    await rellenar(page, /primer apellido.*c[oó]nyuge.*2/i, datos.c2Apellido1, logger, { name: 'APELLIDO1_CONYUGE2' })
    if (datos.c2Apellido2) {
      await rellenar(page, /segundo apellido.*c[oó]nyuge.*2/i, datos.c2Apellido2, logger, { name: 'APELLIDO2_CONYUGE2' })
    }

    // Matrimonio
    await rellenar(page, /fecha.*matrimonio|fecha.*celebraci[oó]n/i, datos.fechaMatrimonio, logger, { name: 'FECHA_MATRIMONIO' })
    await rellenar(page, /municipio.*matrimonio|lugar.*celebraci[oó]n/i, datos.lugarMatrimonio, logger, { name: 'MUNICIPIO_MATRIMONIO' })
    await seleccionar(page, /provincia.*matrimonio/i, datos.provinciaMatrimonio, logger, { name: 'PROVINCIA_MATRIMONIO' })
    await seleccionar(page, /tipo.*certificado/i, datos.tipoCertificado, logger, { name: 'TIPO_CERTIFICADO' })
    await seleccionar(page, /finalidad/i, datos.finalidad, logger, { name: 'FINALIDAD' })

    const s2 = await capturarPantalla(page, jobId, '02-datos-matrimonio', logger)
    if (s2) screenshots.push(s2)

    await clickBoton(page, ['Siguiente', 'Continuar', 'Avanzar'], logger)
    await esperarCarga(page, logger)

    await rellenarSolicitante(page, datos, logger)

    const s3 = await capturarPantalla(page, jobId, '03-solicitante', logger)
    if (s3) screenshots.push(s3)

    await clickBoton(page, ['Siguiente', 'Continuar', 'Enviar', 'Confirmar'], logger)
    await esperarCarga(page, logger)

    const s4 = await capturarPantalla(page, jobId, '04-confirmacion', logger)
    if (s4) screenshots.push(s4)

    const ref = await extraerReferencia(page, logger)
    await context.close()
    return { ok: true, refOrganismo: ref ?? undefined, screenshotUrls: screenshots, logs: logger.dump().split('\n') }
  } catch (err) {
    const sFail = await capturarPantalla(page, jobId, 'error', logger)
    if (sFail) screenshots.push(sFail)
    logger.error(String(err))
    await context.close()
    return { ok: false, error: String(err), screenshotUrls: screenshots, logs: logger.dump().split('\n') }
  }
}
