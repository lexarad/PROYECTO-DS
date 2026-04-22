import { Browser, Page } from 'playwright-core'
import { JobLogger } from '../logger'
import { capturarPantalla, aceptarCookies } from '../screenshot'
import { ResultadoAutomatizacion, DatosNacimiento } from '../types'
import { instalarHandlerPin } from '../auth/dnie'
import {
  esperarCarga, extraerReferencia,
  detectarCaptcha, isDryRun, crearContexto, estaAutenticado,
  navegarAFormularioMJ, CaptchaError,
} from './base'

const URL_TRAMITE = 'https://sede.mjusticia.gob.es/es/tramites/certificado-nacimiento'

// ─────────────────────────────────────────────────────────────────────────────
// Mapeo de valores de negocio → códigos del MJ
// ─────────────────────────────────────────────────────────────────────────────

function codigoTipoCertificado(tipo: string): string {
  const t = (tipo || '').toLowerCase()
  if (t.includes('plurili') || t.includes('internacional')) return 'PLURNAC'
  if (t.includes('extracto') || t.includes('ordinario'))   return 'EXTNAC'
  if (t.includes('bilingu') || t.includes('bilingüe'))     return 'BILNAC'
  return 'LITNAC' // literal por defecto
}

const COD_ESPANA = '108'

// Barcelona por defecto para el MVP; un mapa completo iría aquí.
function codigoProvincia(_provincia: string | undefined): string {
  return '08'
}
function codigoMunicipioBarcelona(): string {
  return '08019'
}

// YYYY-MM-DD → DD/MM/YYYY; deja el valor intacto si ya lo está.
function normalizarFecha(f: string): string {
  if (!f) return ''
  const m = f.match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (m) return `${m[3]}/${m[2]}/${m[1]}`
  return f
}

function calcularFechaCaducidadDNI(): string {
  const d = new Date()
  d.setFullYear(d.getFullYear() + 5)
  const dd = String(d.getDate()).padStart(2, '0')
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  return `${dd}/${mm}/${d.getFullYear()}`
}

// Inferir sexo por nombre (último recurso — el dato real debería venir del cliente)
function inferirSexo(nombre: string): string {
  const n = (nombre || '').trim().toUpperCase()
  if (/(A|MARIA|ANA|TERESA|LAURA|CARMEN|LUCIA|ELENA|SARA|PAULA)$/.test(n)) return '2'
  return '1'
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers string-based (page.evaluate con strings, no funciones — tsx __name)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * page.evaluate con reintento automático cuando la navegación destruye el contexto.
 * Justo tras un click de "Siguiente" Playwright puede tardar hasta 1-2s en re-crear
 * el execution context, y cualquier evaluate en ese hueco lanza "Execution context
 * was destroyed". Reintentamos hasta 3 veces con espera entre medias.
 */
async function evalRetry<T = any>(page: Page, script: string | Function, arg?: any, reintentos = 3): Promise<T | null> {
  for (let i = 0; i < reintentos; i++) {
    try {
      await page.waitForLoadState('domcontentloaded', { timeout: 10_000 }).catch(() => {})
      // @ts-ignore
      return await page.evaluate(script as any, arg) as T
    } catch (e: any) {
      const msg = String(e)
      if (msg.includes('Execution context was destroyed') || msg.includes('frame got detached')) {
        await new Promise(r => setTimeout(r, 1500))
        continue
      }
      throw e
    }
  }
  return null
}

async function setSelect(page: Page, selector: string, value: string, logger: JobLogger, etiqueta?: string): Promise<boolean> {
  const js = `(function(){
    var el = document.querySelector(${JSON.stringify(selector)});
    if (!el) return false;
    el.value = ${JSON.stringify(value)};
    el.dispatchEvent(new Event('change', { bubbles: true }));
    return true;
  })()`
  const ok = (await evalRetry<boolean>(page, js)) === true
  if (ok) logger.log(`  ${etiqueta ?? selector} = ${value}`)
  else    logger.log(`  ⚠  ${etiqueta ?? selector}: selector no encontrado`)
  await new Promise(r => setTimeout(r, 400))
  return ok
}

async function setInput(page: Page, selector: string, value: string, logger: JobLogger, etiqueta?: string): Promise<boolean> {
  if (!value) { logger.log(`  ⚠  ${etiqueta ?? selector}: valor vacío, salto`); return false }
  const js = `(function(){
    var el = document.querySelector(${JSON.stringify(selector)});
    if (!el) return false;
    el.value = ${JSON.stringify(value)};
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
    return true;
  })()`
  const ok = (await evalRetry<boolean>(page, js)) === true
  if (ok) logger.log(`  ${etiqueta ?? selector} = "${value}"`)
  else    logger.log(`  ⚠  ${etiqueta ?? selector}: input no encontrado`)
  return ok
}

async function checkRadio(page: Page, selector: string, logger: JobLogger, etiqueta?: string): Promise<boolean> {
  const js = `(function(){
    var el = document.querySelector(${JSON.stringify(selector)});
    if (!el) return false;
    el.checked = true;
    el.dispatchEvent(new Event('change', { bubbles: true }));
    el.dispatchEvent(new Event('click',  { bubbles: true }));
    return true;
  })()`
  const ok = (await evalRetry<boolean>(page, js)) === true
  if (ok) logger.log(`  ✔ ${etiqueta ?? selector}`)
  else    logger.log(`  ⚠  ${etiqueta ?? selector}: radio no encontrado`)
  return ok
}

async function marcarChecksDeclaracion(page: Page, logger: JobLogger) {
  const count = (await evalRetry<number>(page, `(function(){
    var inputs = document.querySelectorAll('input[type="checkbox"]');
    var marcados = 0;
    for (var i=0;i<inputs.length;i++) {
      var el = inputs[i];
      var n = (el.name || '') + ' ' + (el.id || '');
      if (/oposicion/i.test(n)) continue;
      if (/interesLegitimo|declaracion|aceptaCond|consentim|responsable|autoriza/i.test(n) && !el.checked) {
        el.checked = true;
        el.dispatchEvent(new Event('change', { bubbles: true }));
        el.dispatchEvent(new Event('click', { bubbles: true }));
        marcados++;
      }
    }
    return marcados;
  })()`)) ?? 0
  if (count > 0) logger.log(`  ✔ ${count} checkbox(es) de declaración marcados`)
}

async function clickAvanzar(page: Page, logger: JobLogger, preferido?: string): Promise<string | null> {
  const jsPref = preferido ? JSON.stringify(preferido) : 'null'
  const clicked = await evalRetry<string | null>(page, `(function(){
    var prio = ${jsPref}
      ? [${jsPref}, 'Enviar Solicitud', 'Crear Solicitud', 'Confirmar', 'Enviar', 'Siguiente']
      : ['Enviar Solicitud', 'Enviar solicitud', 'Crear Solicitud', 'Crear solicitud', 'Continuar como Autorizado', 'Continuar como Rep. Legal', 'Continuar', 'Confirmar', 'Enviar', 'Siguiente'];
    var btns = document.querySelectorAll('button, input[type="submit"], a.btn, a.btn-primary');
    for (var p=0;p<prio.length;p++) {
      var txt = prio[p];
      var lc = txt.toLowerCase();
      for (var i=0;i<btns.length;i++) {
        var el = btns[i];
        var label = ((el.textContent || '').trim().replace(/\\s+/g, ' ')) || (el.value || '');
        if (label === txt || label.toLowerCase() === lc) {
          if (el.disabled) continue;
          el.click();
          return txt;
        }
      }
    }
    return null;
  })()`)
  if (clicked) logger.log(`  🔘 Click "${clicked}"`)
  else         logger.log(`  ⚠  Ningún botón de avance encontrado`)
  return clicked
}

async function getErrores(page: Page): Promise<string[]> {
  return (await evalRetry<string[]>(page, `(function(){
    var sels = ['.invalid-feedback', '.form-text.text-danger', '.alert-danger', '.error-summary', '.has-error .help-block', 'span.error', '.field-error'];
    var out = [];
    for (var i=0;i<sels.length;i++) {
      var els = document.querySelectorAll(sels[i]);
      for (var j=0;j<els.length;j++) {
        var t = (els[j].innerText || '').trim();
        if (t && t.length > 0 && t.length < 500) out.push(t);
      }
    }
    var uniq = {}; var result = [];
    for (var n=0;n<out.length;n++) { if (!uniq[out[n]]) { uniq[out[n]] = true; result.push(out[n]); } }
    return result;
  })()`)) ?? []
}

async function esperarCaptchaManual(page: Page, logger: JobLogger): Promise<void> {
  const captchaVisible = (await evalRetry<boolean>(page, `(function(){
    var ifr = document.querySelectorAll('iframe[src*="recaptcha"]');
    for (var i=0;i<ifr.length;i++) {
      var r = ifr[i].getBoundingClientRect();
      if (r.width > 150 && r.height > 40) return true;
    }
    return false;
  })()`)) === true
  if (!captchaVisible) return

  const headed = process.env.AUTOMATION_HEADLESS === 'false'
  if (!headed) throw new CaptchaError()

  logger.log('')
  logger.log('═══════════════════════════════════════════════════════════════')
  logger.log('🚨  ATENCIÓN: reCAPTCHA DETECTADO')
  logger.log('🚨  VE A LA VENTANA DE CHROMIUM Y RESUELVE EL CAPTCHA')
  logger.log('🚨  Tienes hasta 10 MINUTOS — el worker espera')
  logger.log('═══════════════════════════════════════════════════════════════')
  logger.log('')
  // Traer la ventana al frente si podemos
  try { await page.bringToFront() } catch { /* best-effort */ }

  const inicio = Date.now()
  let resuelto = false
  let ultimoLog = 0
  while (Date.now() - inicio < 600_000) { // 10 min
    const token = (await evalRetry<number>(page, `(function(){
      var ta = document.querySelector('textarea[name="g-recaptcha-response"]');
      return ta ? ta.value.length : 0;
    })()`)) ?? 0
    if (token && token > 20) { resuelto = true; logger.log(`✅ CAPTCHA resuelto (${token} chars)`); break }

    const transcurridos = Math.round((Date.now() - inicio) / 1000)
    if (transcurridos - ultimoLog >= 30) {
      logger.log(`  ⏳ Esperando captcha... (${transcurridos}s de 600s)`)
      ultimoLog = transcurridos
    }
    await new Promise(r => setTimeout(r, 2000))
  }
  if (!resuelto) {
    logger.log('⚠  CAPTCHA no resuelto en 10 min — escalando a REQUIERE_MANUAL')
    throw new CaptchaError()
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Tramitación principal — flujo ANÓNIMO del MJ (sin Cl@ve)
// ─────────────────────────────────────────────────────────────────────────────

export async function tramitarNacimiento(
  browser: Browser,
  jobId: string,
  datos: DatosNacimiento,
  logger: JobLogger,
): Promise<ResultadoAutomatizacion> {
  const screenshots: string[] = []
  const context = await crearContexto(browser, logger, URL_TRAMITE, jobId)
  const page = await context.newPage()
  instalarHandlerPin(page, logger)

  try {
    // ── Paso 1: Abrir página del trámite ──────────────────────────────────
    logger.log(`Navegando a ${URL_TRAMITE}`)
    await page.goto(URL_TRAMITE, { waitUntil: 'domcontentloaded', timeout: 60_000 })
    await aceptarCookies(page, logger)
    await esperarCarga(page, logger)
    const s1 = await capturarPantalla(page, jobId, '01-inicio', logger)
    if (s1) screenshots.push(s1)

    if (isDryRun()) {
      logger.log('[DRY-RUN] Conectividad MJ verificada. Saliendo sin enviar formulario.')
      await context.close()
      return { ok: true, refOrganismo: 'DRY-RUN', screenshotUrls: screenshots, logs: logger.dump().split('\n') }
    }

    // ── Paso 2: Navegar al formulario ─────────────────────────────────────
    const autenticado = estaAutenticado()
    logger.log(`Modo de auth: ${autenticado ? 'con certificado/Cl@ve (con fallback a anónimo)' : 'anónimo'}`)
    await navegarAFormularioMJ(page, logger, autenticado)
    await esperarCarga(page, logger)
    await detectarCaptcha(page, logger)

    // ── Paso 3: DATOS GENERALES ────────────────────────────────────────────
    logger.log('Paso 3 — DATOS GENERALES')
    await setSelect(page, 'select[name="materiaVO.codMateriaGe"]', 'NAC', logger, 'Materia')
    await checkRadio(page, '#radioTipoSolicitud_1', logger, 'Tipo solicitud = CERTIFICACIÓN')
    await checkRadio(page, '#radioInscritoFallecido_1', logger, 'Inscrito fallecido = No')

    const tipoSol = datos.tipoSolicitante ?? '4'
    await setSelect(page, 'select[name="tipoInteresadoVO.codTipoInteresado"]', tipoSol, logger,
      `Tipo solicitante (${tipoSol === '1' ? 'Inscrito' : 'Tercero'})`)

    let btnPaso3Pref: string | undefined
    if (tipoSol === '4') {
      const calidad = datos.calidadTercero ?? '3'
      await new Promise(r => setTimeout(r, 800))
      await setSelect(page, 'select[name="serDatosSolicitudVO.codCalidadTerIns"]', calidad, logger, 'Calidad tercero')
      await new Promise(r => setTimeout(r, 900))
      if (calidad === '2') btnPaso3Pref = 'Continuar como Rep. Legal'
      if (calidad === '3') btnPaso3Pref = 'Continuar como Autorizado'
    }

    const s2 = await capturarPantalla(page, jobId, '02-datos-generales', logger)
    if (s2) screenshots.push(s2)

    await clickAvanzar(page, logger, btnPaso3Pref)
    await page.waitForLoadState('domcontentloaded', { timeout: 30_000 }).catch(() => {})
    await new Promise(r => setTimeout(r, 2000))
    await esperarCaptchaManual(page, logger)

    // ── Paso 4: DATOS DEL SOLICITANTE (serPersonaTerceroVO) ────────────────
    logger.log('Paso 4 — DATOS DEL SOLICITANTE (quien pide)')
    await setSelect(page, '#tipoIdentificadorTer', '1', logger, 'Tipo documento solicitante (DNI)')
    await setInput (page, '#numIdentificacion', datos.solDni, logger, 'Nº documento solicitante')
    await setInput (page, '#fechaCaducidadDoc', calcularFechaCaducidadDNI(), logger, 'Fecha caducidad DNI')
    await setSelect(page, '#paisEmisorDoc', COD_ESPANA, logger, 'País emisor (ESPAÑA)')
    await setSelect(page, '#sexo', inferirSexo(datos.solNombre), logger, 'Sexo solicitante')
    await setInput (page, '#nombre',    datos.solNombre,    logger, 'Nombre solicitante')
    await setInput (page, '#apellido1', datos.solApellido1, logger, 'Apellido1 solicitante')
    if (datos.solApellido2) await setInput(page, '#apellido2', datos.solApellido2, logger, 'Apellido2 solicitante')
    await setInput (page, '#email', process.env.EMPRESA_EMAIL || 'soporte@certidocs.es', logger, 'Email')

    const s3 = await capturarPantalla(page, jobId, '03-datos-solicitante', logger)
    if (s3) screenshots.push(s3)

    await clickAvanzar(page, logger, 'Siguiente')
    await page.waitForLoadState('domcontentloaded', { timeout: 30_000 }).catch(() => {})
    await new Promise(r => setTimeout(r, 2000))
    await esperarCaptchaManual(page, logger)

    const erroresP4 = await getErrores(page)
    if (erroresP4.length) logger.log(`  ⚠  Errores P4: ${erroresP4.slice(0, 5).join(' | ')}`)

    // ── Paso 5: DATOS DEL INSCRITO (serPersonaVO) ──────────────────────────
    logger.log('Paso 5 — DATOS DEL INSCRITO (persona del certificado)')
    // Identificador del inscrito opcional — algunos formularios lo permiten vacío.
    // Si tenemos DNI (cuando solicitante === inscrito), lo rellenamos.
    if (datos.solDni && (datos.tipoSolicitante === '1' || datos.solNombre === datos.nombre)) {
      await setSelect(page, '#tipoIdentificadorIns', '1', logger, 'Tipo doc inscrito (DNI)')
      await setInput (page, '#numIdentificacionIns', datos.solDni, logger, 'Nº doc inscrito')
    }
    await setSelect(page, '#sexo', inferirSexo(datos.nombre), logger, 'Sexo inscrito')
    await setSelect(page, '#paisEmisorDoc', COD_ESPANA, logger, 'País emisor doc inscrito')
    await setInput (page, '#nombre',    datos.nombre,    logger, 'Nombre inscrito')
    await setInput (page, '#apellido1', datos.apellido1, logger, 'Apellido1 inscrito')
    if (datos.apellido2) await setInput(page, '#apellido2Ins', datos.apellido2, logger, 'Apellido2 inscrito')
    if (datos.nombrePadre) await setInput(page, '#progenitorA', datos.nombrePadre, logger, 'Progenitor A (padre)')
    if (datos.nombreMadre) await setInput(page, '#progenitorB', datos.nombreMadre, logger, 'Progenitor B (madre)')

    await setInput (page, '#fechaNacimiento', normalizarFecha(datos.fechaNacimiento), logger, 'Fecha nacimiento')
    await setSelect(page, '#paisNacimiento',  COD_ESPANA, logger, 'País nacimiento')
    await new Promise(r => setTimeout(r, 300))

    const provCod = codigoProvincia(datos.provinciaNacimiento)
    await setSelect(page, '#provinciaNacimiento', provCod, logger, `Provincia nacimiento (${provCod})`)
    await new Promise(r => setTimeout(r, 1500)) // AJAX municipios

    const nMuni = await page.locator('#municipioNacimiento option').count()
    if (nMuni > 1) {
      await setSelect(page, '#municipioNacimiento', codigoMunicipioBarcelona(), logger, 'Municipio nacimiento')
    } else {
      await setInput(page, '#lugarNacimiento', datos.lugarNacimiento || 'BARCELONA', logger, 'Lugar nacimiento (texto)')
    }

    const s4 = await capturarPantalla(page, jobId, '04-datos-inscrito', logger)
    if (s4) screenshots.push(s4)

    await clickAvanzar(page, logger, 'Siguiente')
    await page.waitForLoadState('domcontentloaded', { timeout: 30_000 }).catch(() => {})
    await new Promise(r => setTimeout(r, 2000))
    await esperarCaptchaManual(page, logger)

    const erroresP5 = await getErrores(page)
    if (erroresP5.length) logger.log(`  ⚠  Errores P5: ${erroresP5.slice(0, 5).join(' | ')}`)

    // ── Paso 6: DATOS DEL CERTIFICADO ──────────────────────────────────────
    logger.log('Paso 6 — DATOS DEL CERTIFICADO')
    await setSelect(page, '#tipoCertificado', codigoTipoCertificado(datos.tipoCertificado), logger, 'Tipo certificado')
    await setInput (page, '#numCopias', '1', logger, 'Nº copias')
    await setSelect(page, '#destinatario', '3', logger, 'Destinatario (Otros)')
    await setSelect(page, '#motivo', '2', logger, 'Motivo (Otros)')
    await setInput (page, '#finalidad', datos.finalidad || 'Uso particular', logger, 'Finalidad')

    const s5 = await capturarPantalla(page, jobId, '05-datos-certificado', logger)
    if (s5) screenshots.push(s5)

    await clickAvanzar(page, logger, 'Siguiente')
    await page.waitForLoadState('domcontentloaded', { timeout: 30_000 }).catch(() => {})
    await new Promise(r => setTimeout(r, 2000))
    await esperarCaptchaManual(page, logger)

    // ── Paso 7: NOTIFICACIÓN + DOMICILIO + REGISTRO CIVIL ──────────────────
    logger.log('Paso 7 — NOTIFICACIÓN / DOMICILIO / REGISTRO CIVIL')
    await setSelect(page, '#codViaNotificacion', 'E', logger, 'Vía notif (Electrónica)')
    await new Promise(r => setTimeout(r, 400))
    await setInput (page, '#telefono', datos.solTelefono || '930000000', logger, 'Teléfono')
    await setSelect(page, '#paisDomicilio', COD_ESPANA, logger, 'País domicilio')
    await new Promise(r => setTimeout(r, 500))
    const provDom = codigoProvincia(datos.solProvincia)
    await setSelect(page, '#provinciaDomicilio', provDom, logger, `Provincia domicilio (${provDom})`)
    await new Promise(r => setTimeout(r, 900))
    await setSelect(page, '#municipioDomicilio', codigoMunicipioBarcelona(), logger, 'Municipio domicilio')
    await setInput (page, '#codigoPostal', datos.solCp || '08003', logger, 'CP')

    await evalRetry(page, `(function(){
      var el = document.querySelector('#codTipoViaIne');
      if (!el) return;
      var opt = null;
      for (var i=0;i<el.options.length;i++) {
        var t = (el.options[i].text || '').toUpperCase();
        if (t.indexOf('CALLE') >= 0 || el.options[i].value === 'CL') { opt = el.options[i]; break; }
      }
      if (!opt && el.options.length > 1) opt = el.options[1];
      if (opt) { el.value = opt.value; el.dispatchEvent(new Event('change', { bubbles: true })); }
    })()`)
    logger.log('  Tipo vía = CALLE')

    const direccion = (datos.solDireccion || 'VIA LAIETANA 59').toUpperCase()
    const m = direccion.match(/^(.+?)\s+(\d+[A-Z]?)\s*(.*)$/)
    const nombreVia = m ? m[1].trim() : direccion
    const numVia    = m ? m[2].trim() : '1'
    await setInput(page, '#nombreVia', nombreVia, logger, 'Nombre vía')
    await setInput(page, '#numero',    numVia,    logger, 'Número vía')

    await setSelect(page, '#paisInscripcion', COD_ESPANA, logger, 'País inscripción RC')
    await new Promise(r => setTimeout(r, 500))
    const provRc = codigoProvincia(datos.provinciaNacimiento)
    await setSelect(page, '#provRegistroCivil', provRc, logger, `Provincia RC (${provRc})`)
    await new Promise(r => setTimeout(r, 1700)) // AJAX oficinas RC

    const rc = (await evalRetry<{ ok: boolean; value?: string; text?: string; reason?: string }>(page, `(function(){
      var el = document.querySelector('#codRegistroCivil');
      if (!el) return { ok: false, reason: 'select no existe' };
      if (el.options.length <= 1) return { ok: false, reason: 'sin opciones cargadas' };
      var principal = null, fallback = null;
      for (var i=0;i<el.options.length;i++) {
        var t = (el.options[i].text || '').toUpperCase();
        if (t.indexOf('BARCELONA') >= 0) {
          if (t.indexOf('COLABORADORA') < 0 && !principal) principal = el.options[i];
          if (!fallback) fallback = el.options[i];
        }
      }
      var elegida = principal || fallback || el.options[1];
      el.value = elegida.value;
      el.dispatchEvent(new Event('change', { bubbles: true }));
      return { ok: true, value: elegida.value, text: elegida.text };
    })()`)) ?? { ok: false, reason: 'evaluate falló' }
    if (rc.ok) logger.log(`  Registro Civil = ${rc.value} (${rc.text})`)
    else       logger.log(`  ⚠  Registro Civil: ${rc.reason}`)

    const s6 = await capturarPantalla(page, jobId, '06-notificacion', logger)
    if (s6) screenshots.push(s6)

    // ── Paso 8: Confirmación y envío final (puede requerir 1–3 clicks) ─────
    logger.log('Paso 8 — CONFIRMACIÓN Y ENVÍO')

    const MAX_PASOS_FINALES = 6
    let refMJ: string | null = null
    for (let i = 0; i < MAX_PASOS_FINALES; i++) {
      const urlAntes = page.url()
      await marcarChecksDeclaracion(page, logger)
      const txtBtn = await clickAvanzar(page, logger)
      await page.waitForLoadState('domcontentloaded', { timeout: 45_000 }).catch(() => {})
      await new Promise(r => setTimeout(r, 2000))
      await esperarCaptchaManual(page, logger)

      const urlDespues = page.url()
      const sX = await capturarPantalla(page, jobId, `07-paso-final-${i + 1}`, logger)
      if (sX) screenshots.push(sX)

      const errs = await getErrores(page)
      if (errs.length) logger.log(`  Errores tras "${txtBtn}": ${errs.slice(0, 3).join(' | ')}`)

      refMJ = await extraerReferencia(page, logger)
      if (refMJ) break

      if (txtBtn === null && urlAntes === urlDespues && errs.length === 0) break
    }

    const sFinal = await capturarPantalla(page, jobId, '08-final', logger)
    if (sFinal) screenshots.push(sFinal)

    await context.close()

    if (!refMJ) {
      logger.error('No se pudo extraer localizador/expediente del MJ — solicitud NO confirmada')
      return {
        ok: false,
        error: 'El formulario no devolvió un localizador/expediente del MJ. Requiere revisión manual.',
        screenshotUrls: screenshots,
        logs: logger.dump().split('\n'),
      }
    }

    return {
      ok: true,
      refOrganismo: refMJ,
      screenshotUrls: screenshots,
      logs: logger.dump().split('\n'),
    }
  } catch (err) {
    const sFail = await capturarPantalla(page, jobId, 'error', logger).catch(() => null)
    if (sFail) screenshots.push(sFail)
    logger.error(String(err))
    await context.close().catch(() => {})
    if (err instanceof CaptchaError) throw err
    return { ok: false, error: String(err), screenshotUrls: screenshots, logs: logger.dump().split('\n') }
  }
}
