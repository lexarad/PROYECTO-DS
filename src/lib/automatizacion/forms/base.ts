import { Browser, BrowserContext, Page, Locator } from 'playwright-core'
import { JobLogger } from '../logger'
import { normalizarProvincia } from '../provincias'
import { tieneConfigClavePin, autenticarConClavePin, crearContextoCertificado, manejarPasarelaClave } from '../auth/clavePin'
import { tieneConfigDnie, crearContextoDnie } from '../auth/dnie'

export type MetodoAuth = 'clavepin' | 'dnie' | 'pkcs12' | 'anonimo'

/** Devuelve el método de autenticación activo según las env vars configuradas */
export function detectarMetodoAuth(): MetodoAuth {
  if (tieneConfigClavePin()) return 'clavepin'
  if (tieneConfigDnie())    return 'dnie'
  if (process.env.CERT_P12_BASE64 && process.env.CERT_P12_PASSWORD) return 'pkcs12'
  return 'anonimo'
}

/** True cuando hay cualquier método de autenticación configurado */
export function estaAutenticado(): boolean {
  return detectarMetodoAuth() !== 'anonimo'
}

/**
 * Crea un BrowserContext con el mejor método de autenticación disponible:
 *   1. Cl@ve Permanente (TOTP)  — cloud + on-premise
 *   2. DNIe (tarjeta física)    — solo on-premise con lector
 *   3. Certificado FNMT (.p12)  — cloud + on-premise
 *   4. Anónimo                  — sin certificado (comportamiento actual)
 */
export async function crearContexto(
  browser: Browser,
  logger: JobLogger,
  urlTramite: string,
  jobId: string,
): Promise<BrowserContext> {
  const metodo = detectarMetodoAuth()
  logger.log(`Método de autenticación: ${metodo}`)

  switch (metodo) {
    case 'clavepin':
      return autenticarConClavePin(browser, logger, urlTramite, jobId)
    case 'dnie':
      return crearContextoDnie(browser, logger)
    case 'pkcs12':
      return crearContextoCertificado(browser, logger, urlTramite)
    default:
      return browser.newContext({
        locale: 'es-ES',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36',
      })
  }
}

// Dirección de envío de CertiDocs (se usa en todos los formularios MJ)
export const EMPRESA = {
  nombre: process.env.EMPRESA_NOMBRE ?? 'CertiDocs SL',
  nif:    process.env.EMPRESA_NIF    ?? 'B12345678',
  email:  process.env.EMPRESA_EMAIL  ?? 'tramites@certidocs.es',
  dir:    process.env.EMPRESA_DIRECCION ?? 'Via Laietana 59, 4º 1ª',
  cp:     process.env.EMPRESA_CP     ?? '08003',
  ciudad: process.env.EMPRESA_CIUDAD ?? 'Barcelona',
  tel:    process.env.EMPRESA_TEL    ?? '930000000',
}

const TIMEOUT_CAMPO = 8_000
const TIMEOUT_NAV   = 30_000

/**
 * Dry-run mode: set AUTOMATION_DRY_RUN=true to skip form submission.
 * The browser still navigates and takes a screenshot of the first page,
 * but all field fills, selects, and button clicks are simulated only.
 */
export function isDryRun(): boolean {
  return process.env.AUTOMATION_DRY_RUN === 'true'
}

/** Lanzado cuando se detecta un CAPTCHA — fuerza escalado a REQUIERE_MANUAL */
export class CaptchaError extends Error {
  constructor() { super('CAPTCHA detectado — requiere intervención manual') }
}

/**
 * Detecta si la página contiene un CAPTCHA (reCAPTCHA, hCaptcha, etc.).
 * Lanza CaptchaError si se detecta.
 */
export async function detectarCaptcha(page: Page, logger: JobLogger): Promise<void> {
  const indicadores = [
    'iframe[src*="recaptcha"]',
    'iframe[src*="hcaptcha"]',
    '.g-recaptcha',
    '.h-captcha',
    '#recaptcha',
    '[data-sitekey]',
  ]

  for (const selector of indicadores) {
    const visible = await page.locator(selector).isVisible({ timeout: 1_500 }).catch(() => false)
    if (visible) {
      logger.error(`CAPTCHA detectado (selector: ${selector})`)
      throw new CaptchaError()
    }
  }

  // Comprobación por texto visible en el body
  const texto = await page.innerText('body').catch(() => '')
  if (/captcha|no.*soy.*robot|i.*m.*not.*a.*robot/i.test(texto)) {
    logger.error('CAPTCHA detectado (texto en página)')
    throw new CaptchaError()
  }
}

/** Rellena un <input> o <textarea> buscando primero por label, luego por name/id */
export async function rellenar(
  page: Page,
  label: string | RegExp,
  valor: string,
  logger: JobLogger,
  opciones?: { name?: string; id?: string }
): Promise<void> {
  if (!valor) return
  if (isDryRun()) { logger.log(`[DRY-RUN] Campo "${label}" → "${valor}"`); return }

  const locators: Locator[] = [
    page.getByLabel(label, { exact: false }),
  ]
  if (opciones?.name) locators.push(page.locator(`[name="${opciones.name}"]`))
  if (opciones?.id)   locators.push(page.locator(`#${opciones.id}`))

  for (const loc of locators) {
    try {
      await loc.first().waitFor({ state: 'visible', timeout: TIMEOUT_CAMPO })
      await loc.first().clear()
      await loc.first().fill(valor)
      logger.log(`Campo "${label}" → "${valor}"`)
      return
    } catch { /* siguiente */ }
  }
  logger.error(`No se encontró el campo "${label}"`)
}

/** Selecciona una opción de un <select>, normalizando el valor de provincia si aplica */
export async function seleccionar(
  page: Page,
  label: string | RegExp,
  valor: string,
  logger: JobLogger,
  opciones?: { name?: string; id?: string }
): Promise<void> {
  if (!valor) return
  if (isDryRun()) { logger.log(`[DRY-RUN] Select "${label}" → "${valor}"`); return }

  // Normalizar provincias antes de intentar seleccionar
  const valorNorm = normalizarProvincia(valor)
  if (valorNorm !== valor) logger.log(`Provincia normalizada: "${valor}" → "${valorNorm}"`)

  const locators: Locator[] = [
    page.getByLabel(label, { exact: false }),
  ]
  if (opciones?.name) locators.push(page.locator(`select[name="${opciones.name}"]`))
  if (opciones?.id)   locators.push(page.locator(`select#${opciones.id}`))

  for (const loc of locators) {
    try {
      await loc.first().waitFor({ state: 'visible', timeout: TIMEOUT_CAMPO })
      // Intentar por label normalizado, luego original, luego value, luego primer índice
      await loc.first().selectOption({ label: valorNorm })
        .catch(() => loc.first().selectOption({ label: valor }))
        .catch(() => loc.first().selectOption({ value: valorNorm }))
        .catch(() => loc.first().selectOption({ value: valor }))
      logger.log(`Select "${label}" → "${valorNorm}"`)
      return
    } catch { /* siguiente */ }
  }
  logger.error(`No se encontró el select "${label}"`)
}

/** Hace click en un botón buscando por texto */
export async function clickBoton(
  page: Page,
  textos: string[],
  logger: JobLogger
): Promise<void> {
  if (isDryRun()) { logger.log(`[DRY-RUN] Click botón (skipped): ${textos[0]}`); return }
  for (const texto of textos) {
    const loc = page.getByRole('button', { name: new RegExp(texto, 'i') })
    if (await loc.first().isVisible({ timeout: 4_000 }).catch(() => false)) {
      await loc.first().click()
      logger.log(`Click botón "${texto}"`)
      return
    }
  }
  // Último recurso: buscar inputs tipo submit
  const submit = page.locator('input[type="submit"], button[type="submit"]')
  if (await submit.first().isVisible({ timeout: 3_000 }).catch(() => false)) {
    await submit.first().click()
    logger.log('Click submit genérico')
    return
  }
  logger.error(`No se encontró botón con textos: ${textos.join(', ')}`)
}

/** Espera a que la página cargue completamente */
export async function esperarCarga(page: Page, logger: JobLogger) {
  await page.waitForLoadState('networkidle', { timeout: TIMEOUT_NAV }).catch(() =>
    page.waitForLoadState('domcontentloaded', { timeout: TIMEOUT_NAV })
  )
  logger.log(`Página cargada: ${page.url()}`)
}

/**
 * Navega desde la página de trámite del MJ hasta el formulario real.
 *
 * La sede MJ usa Bootstrap collapse: los links están en divs colapsados
 * (class "collapse") y no son "visibles" hasta que se expanden.
 *
 * Estrategia: extraer el href del DOM directamente con page.evaluate()
 * y navegar a él con page.goto() — evita problemas de visibilidad.
 *
 * Estructura HTML del MJ:
 *   <div class="mj-tramite__title" data-toggle="collapse" data-target="#collapse_N">
 *     <h2>Solicitud ... sin identificación ...</h2>
 *   </div>
 *   <div class="mj-tramite__collapse collapse" id="collapse_N">
 *     <a href="https://sede.mjusticia.gob.es/sereci/initDatosGenerales?...">Tramitación On-line sin ...</a>
 *   </div>
 */
export async function navegarAFormularioMJ(
  page: Page,
  logger: JobLogger,
  conAuth: boolean = false,
): Promise<void> {
  const urlActual = page.url()
  const urlTramiteMJ = urlActual  // guardamos para posible fallback anónimo

  // Si ya estamos en el formulario, no hacer nada
  if (
    urlActual.includes('/sereci/') ||
    urlActual.includes('/notasimplerc/') ||
    urlActual.includes('initDatos') ||
    urlActual.includes('initSolicitud') ||
    urlActual.includes('/tramitacion')
  ) {
    logger.log(`Ya en el formulario MJ: ${urlActual}`)
    return
  }

  // Extraer href del DOM aunque el enlace esté en un colapso oculto.
  // Para "sin identificación": buscamos initDatosGenerales sin /clave/
  // Para "con identificación": buscamos initDatosGenerales con /clave/
  // Evitamos initSolicitudLiteral (requiere Cl@ve con cert registrado)
  const href = await page.evaluate((usarAuth: boolean) => {
    const links = Array.from(document.querySelectorAll('a[href]'))
    // Primero intentamos el enlace a initDatosGenerales según modo auth
    for (const a of links) {
      const h = (a as HTMLAnchorElement).href
      if (!h.includes('initDatosGenerales') && !h.includes('initSolicitud')) continue
      if (h.includes('initSolicitudLiteral')) continue  // excluir "un solo clic"
      const esClave = h.includes('/clave/')
      if (usarAuth && esClave) return h
      if (!usarAuth && !esClave) return h
    }
    // Fallback: cualquier link de tramitación
    const fallback = links.find(a => {
      const h = (a as HTMLAnchorElement).href
      return h.includes('initDatosGenerales') && !h.includes('initSolicitudLiteral')
    })
    return fallback ? (fallback as HTMLAnchorElement).href : null
  }, conAuth)

  if (href) {
    logger.log(`Navegando directo al formulario MJ: ${href}`)
    await page.goto(href, { waitUntil: 'domcontentloaded', timeout: 60_000 })
    await new Promise(r => setTimeout(r, 600))

    // Si hay redirección a pasarela Cl@ve, manejar autenticación con certificado
    if (page.url().includes('clave.gob.es')) {
      logger.log('Redirigido a pasarela Cl@ve — iniciando autenticación con certificado FNMT')
      await manejarPasarelaClave(page, logger)

      // Esperar a que el SAML POST complete la redirección de vuelta a sede MJ
      // La página ServiceProvider hace auto-submit con JavaScript
      logger.log('Esperando redirección SAML de vuelta a sede MJ...')
      try {
        await page.waitForURL(
          (url: URL) => !url.href.includes('clave.gob.es') && !url.href.includes('pasarela'),
          { timeout: 45_000 }
        )
        logger.log(`Redirección SAML completada: ${page.url()}`)
      } catch {
        // Si no redirigió, intentar click en botón de confirmación Cl@ve
        logger.log(`Aún en Cl@ve (${page.url()}) — buscando botón de confirmación`)
        const btnConfirmar = page.getByRole('button', { name: /confirmar|aceptar|continuar|enviar|acceder/i })
          .or(page.locator('input[type="submit"]'))
        if (await btnConfirmar.first().isVisible({ timeout: 3_000 }).catch(() => false)) {
          await btnConfirmar.first().click()
          logger.log('Click en botón confirmación Cl@ve')
          await page.waitForURL(
            (url: URL) => !url.href.includes('clave.gob.es'),
            { timeout: 60_000 }
          ).catch(() => {})
        }
        logger.log(`URL tras espera SAML: ${page.url()}`)
      }

      await page.waitForLoadState('domcontentloaded', { timeout: 15_000 }).catch(() => {})

      // Si aún estamos en Cl@ve (auth falló), volver al trámite y usar enlace anónimo
      if (page.url().includes('clave.gob.es') || page.url().includes('pasarela')) {
        logger.log('SAML no completó — fallback a formulario sin autenticación')
        await page.goto(urlTramiteMJ, { waitUntil: 'domcontentloaded', timeout: 60_000 })
        await new Promise(r => setTimeout(r, 400))
        const hrefAnonimo = await page.evaluate(() => {
          const links = Array.from(document.querySelectorAll('a[href]'))
          const found = links.find(a => {
            const h = (a as HTMLAnchorElement).href
            return h.includes('initDatosGenerales') && !h.includes('/clave/') && !h.includes('initSolicitudLiteral')
          })
          return found ? (found as HTMLAnchorElement).href : null
        })
        if (hrefAnonimo) {
          logger.log(`Navegando a formulario anónimo: ${hrefAnonimo}`)
          await page.goto(hrefAnonimo, { waitUntil: 'domcontentloaded', timeout: 60_000 })
        } else {
          logger.log('Enlace anónimo no encontrado en página del trámite')
        }
      }
    }

    logger.log(`Formulario cargado: ${page.url()}`)
    return
  }

  // Si no hay link de tramitación online, puede que requiera auth
  logger.log(`Link de tramitación no encontrado en DOM — verificando página actual`)
  if (!conAuth) {
    logger.log('Hint: si la página requiere CL@VE, configura CLAVEPIN_* o CERT_P12_BASE64 en .env')
  }
}

/** Extrae el número de expediente/localizador de la página de confirmación */
export async function extraerReferencia(page: Page, logger: JobLogger): Promise<string | null> {
  const patrones = [
    /[Ll]ocalizador[:\s]+([A-Z0-9\-\/]+)/,
    /[Nn]úmero de expediente[:\s]+([A-Z0-9\-\/]+)/,
    /[Nn]º de registro[:\s]+([A-Z0-9\-\/]+)/,
    /[Rr]eferencia[:\s]+([A-Z0-9\-\/]+)/,
    /[Ee]xpediente[:\s]+([A-Z0-9\-\/]+)/,
  ]

  const texto = await page.innerText('body').catch(() => '')
  for (const patron of patrones) {
    const match = texto.match(patron)
    if (match?.[1]) {
      logger.log(`Referencia del organismo encontrada: ${match[1]}`)
      return match[1]
    }
  }

  logger.log('No se encontró referencia del organismo en la página de confirmación')
  return null
}

/** Rellena el bloque de datos del solicitante (común a todos los formularios MJ) */
export async function rellenarSolicitante(
  page: Page,
  datos: {
    solNombre: string
    solApellido1: string
    solApellido2?: string
    solDni: string
    solTelefono: string
    solDireccion: string
    solCp: string
    solMunicipio: string
    solProvincia: string
  },
  logger: JobLogger
) {
  await rellenar(page, /nombre.*solicitante|nombre del solicitante|tu nombre/i, datos.solNombre, logger, { name: 'NOMBRE_SOLICITANTE' })
  await rellenar(page, /primer apellido.*solicitante|1.*apellido.*solicitante/i, datos.solApellido1, logger, { name: 'APELLIDO1_SOLICITANTE' })
  if (datos.solApellido2) {
    await rellenar(page, /segundo apellido.*solicitante|2.*apellido.*solicitante/i, datos.solApellido2, logger, { name: 'APELLIDO2_SOLICITANTE' })
  }
  await rellenar(page, /dni|nie|pasaporte|documento.*identidad/i, datos.solDni, logger, { name: 'NIF_SOLICITANTE' })
  await rellenar(page, /teléfono|telefono/i, datos.solTelefono, logger, { name: 'TELEFONO_SOLICITANTE' })
  await rellenar(page, /dirección|direccion|calle/i, datos.solDireccion, logger, { name: 'DIRECCION_SOLICITANTE' })
  await rellenar(page, /código postal|cp/i, datos.solCp, logger, { name: 'CP_SOLICITANTE' })
  await rellenar(page, /municipio.*solicitante|ciudad/i, datos.solMunicipio, logger, { name: 'MUNICIPIO_SOLICITANTE' })
  await seleccionar(page, /provincia.*solicitante/i, datos.solProvincia, logger, { name: 'PROVINCIA_SOLICITANTE' })
  await rellenar(page, /email|correo/i, EMPRESA.email, logger, { name: 'EMAIL_SOLICITANTE' })
}
