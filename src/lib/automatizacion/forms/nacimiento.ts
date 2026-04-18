import { Browser } from 'playwright-core'
import { JobLogger } from '../logger'
import { capturarPantalla, aceptarCookies } from '../screenshot'
import { ResultadoAutomatizacion, DatosNacimiento } from '../types'
import { instalarHandlerPin } from '../auth/dnie'
import {
  rellenar, seleccionar, clickBoton,
  esperarCarga, extraerReferencia, rellenarSolicitante,
  detectarCaptcha, isDryRun, crearContexto, estaAutenticado,
  navegarAFormularioMJ,
} from './base'

const URL_TRAMITE = 'https://sede.mjusticia.gob.es/es/tramites/certificado-nacimiento'

export async function tramitarNacimiento(
  browser: Browser,
  jobId: string,
  datos: DatosNacimiento,
  logger: JobLogger
): Promise<ResultadoAutomatizacion> {
  const screenshots: string[] = []
  const context = await crearContexto(browser, logger, URL_TRAMITE, jobId)
  const page = await context.newPage()
  instalarHandlerPin(page, logger)

  try {
    // ── Paso 1: Abrir página del trámite ──────────────────────────────────────
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

    // ── Paso 2: Navegar al formulario (extrae href del DOM, navega directo) ───
    await navegarAFormularioMJ(page, logger, estaAutenticado())
    await esperarCarga(page, logger)
    await detectarCaptcha(page, logger)

    // ── Paso 3: DATOS GENERALES (primer paso del formulario MJ) ─────────────
    // Seleccionar tipo de certificado
    logger.log('Rellenando DATOS GENERALES (paso 1)')
    await page.locator('select[name="materiaVO.codMateriaGe"]')
      .selectOption({ value: 'NAC' })
      .catch(() => logger.log('Select materia no encontrado — puede ya estar preseleccionado'))

    // Tipo de solicitante: '1'=Inscrito (para mí), '4'=Tercero (default CertiDocs)
    const tipoSol = datos.tipoSolicitante ?? '4'
    await page.locator('select[name="tipoInteresadoVO.codTipoInteresado"]')
      .selectOption({ value: tipoSol })
      .catch(() => seleccionar(page, /persona que solicita/i, tipoSol === '1' ? 'Inscrito' : 'Tercero', logger))
    logger.log(`Tipo solicitante: ${tipoSol === '1' ? 'Inscrito' : 'Tercero'}`)

    // Calidad del tercero (solo si tipoSolicitante='4')
    if (tipoSol === '4') {
      const calidad = datos.calidadTercero ?? '3'
      await new Promise(r => setTimeout(r, 600))  // esperar que aparezca el select de calidad
      await page.locator('select[name="serDatosSolicitudVO.codCalidadTerIns"]')
        .selectOption({ value: calidad })
        .catch(() => logger.log('Select calidad tercero no encontrado (puede ser normal si no aplica)'))
      logger.log(`Calidad tercero: ${calidad}`)
    }

    const s2 = await capturarPantalla(page, jobId, '02-datos-generales', logger)
    if (s2) screenshots.push(s2)

    await clickBoton(page, ['Siguiente', 'Continuar', 'Avanzar'], logger)
    await esperarCarga(page, logger)
    await detectarCaptcha(page, logger)

    // ── Paso 4: DATOS DEL INSCRITO ────────────────────────────────────────────
    logger.log('Rellenando datos del inscrito')
    await rellenar(page, /nombre/i, datos.nombre, logger, { name: 'nombre' })
    await rellenar(page, /primer apellido/i, datos.apellido1, logger, { name: 'apellido1' })
    if (datos.apellido2) {
      await rellenar(page, /segundo apellido/i, datos.apellido2, logger, { name: 'apellido2' })
    }
    await rellenar(page, /fecha.*nacimiento/i, datos.fechaNacimiento, logger, { name: 'fechaNacimiento' })
    await rellenar(page, /municipio.*nacimiento|lugar.*nacimiento/i, datos.lugarNacimiento, logger, { name: 'lugarNacimiento' })
    await seleccionar(page, /provincia.*nacimiento/i, datos.provinciaNacimiento, logger, { name: 'provinciaNacimiento' })
    if (datos.nombrePadre) {
      await rellenar(page, /nombre.*padre/i, datos.nombrePadre, logger, { name: 'nombrePadre' })
    }
    if (datos.nombreMadre) {
      await rellenar(page, /nombre.*madre/i, datos.nombreMadre, logger, { name: 'nombreMadre' })
    }

    // Tipo de certificado y finalidad
    await seleccionar(page, /tipo.*certificado/i, datos.tipoCertificado, logger, { name: 'tipoCertificado' })
    await seleccionar(page, /finalidad/i, datos.finalidad, logger, { name: 'finalidad' })

    const s3 = await capturarPantalla(page, jobId, '03-datos-inscrito', logger)
    if (s3) screenshots.push(s3)

    await clickBoton(page, ['Siguiente', 'Continuar', 'Avanzar'], logger)
    await esperarCarga(page, logger)

    // ── Paso 5: DATOS DEL SOLICITANTE ─────────────────────────────────────────
    logger.log('Rellenando datos del solicitante')
    await rellenarSolicitante(page, datos, logger)

    const s4 = await capturarPantalla(page, jobId, '04-datos-solicitante', logger)
    if (s4) screenshots.push(s4)

    await clickBoton(page, ['Siguiente', 'Continuar', 'Enviar', 'Confirmar'], logger)
    await esperarCarga(page, logger)

    // ── Paso 6: Confirmación final ────────────────────────────────────────────
    await detectarCaptcha(page, logger)
    const s5 = await capturarPantalla(page, jobId, '05-confirmacion', logger)
    if (s5) screenshots.push(s5)

    const ref = await extraerReferencia(page, logger)

    await context.close()
    return {
      ok: true,
      refOrganismo: ref ?? undefined,
      screenshotUrls: screenshots,
      logs: logger.dump() ? logger.dump().split('\n') : [],
    }
  } catch (err) {
    const sFail = await capturarPantalla(page, jobId, 'error', logger)
    if (sFail) screenshots.push(sFail)
    logger.error(String(err))
    await context.close()
    return { ok: false, error: String(err), screenshotUrls: screenshots, logs: logger.dump().split('\n') }
  }
}
