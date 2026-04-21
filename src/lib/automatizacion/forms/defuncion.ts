import { Browser } from 'playwright-core'
import { instalarHandlerPin } from '../auth/dnie'
import { JobLogger } from '../logger'
import { capturarPantalla, aceptarCookies } from '../screenshot'
import { ResultadoAutomatizacion, DatosDefuncion } from '../types'
import {
  rellenar, seleccionar, clickBoton,
  esperarCarga, extraerReferencia, rellenarSolicitante,
  detectarCaptcha, isDryRun, crearContexto, estaAutenticado,
  navegarAFormularioMJ,
} from './base'

const URL_TRAMITE = 'https://sede.mjusticia.gob.es/es/tramites/certificado-defuncion'

export async function tramitarDefuncion(
  browser: Browser,
  jobId: string,
  datos: DatosDefuncion,
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
      logger.log('[DRY-RUN] Conectividad MJ verificada. Saliendo sin enviar formulario.')
      await context.close()
      return { ok: true, refOrganismo: 'DRY-RUN', screenshotUrls: screenshots, logs: logger.dump().split('\n') }
    }

    await navegarAFormularioMJ(page, logger, estaAutenticado())
    await esperarCarga(page, logger)

    logger.log('Rellenando datos del fallecido')
    await rellenar(page, /nombre.*fallecido|nombre del fallecido/i, datos.nombre, logger, { name: 'NOMBRE' })
    await rellenar(page, /primer apellido/i, datos.apellido1, logger, { name: 'APELLIDO1' })
    if (datos.apellido2) {
      await rellenar(page, /segundo apellido/i, datos.apellido2, logger, { name: 'APELLIDO2' })
    }
    await rellenar(page, /fecha.*defunci[oó]n/i, datos.fechaDefuncion, logger, { name: 'FECHA_DEFUNCION' })
    await rellenar(page, /municipio.*defunci[oó]n|lugar.*fallecimiento/i, datos.lugarDefuncion, logger, { name: 'MUNICIPIO_DEFUNCION' })
    await seleccionar(page, /provincia.*defunci[oó]n/i, datos.provinciaDefuncion, logger, { name: 'PROVINCIA_DEFUNCION' })
    if (datos.nombrePadre) {
      await rellenar(page, /nombre.*padre/i, datos.nombrePadre, logger, { name: 'NOMBRE_PADRE' })
    }
    if (datos.nombreMadre) {
      await rellenar(page, /nombre.*madre/i, datos.nombreMadre, logger, { name: 'NOMBRE_MADRE' })
    }
    await seleccionar(page, /tipo.*certificado/i, datos.tipoCertificado, logger, { name: 'TIPO_CERTIFICADO' })
    await seleccionar(page, /finalidad/i, datos.finalidad, logger, { name: 'FINALIDAD' })

    const s2 = await capturarPantalla(page, jobId, '02-datos-fallecido', logger)
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
