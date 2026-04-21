import { Browser, BrowserContext } from 'playwright-core'
import { JobLogger } from '../logger'
import { generarTOTP, segundosRestantesTOTP } from './totp'
import { capturarPantalla } from '../screenshot'

export interface ConfigClavePin {
  nif: string
  password: string
  totpSecret: string
}

/**
 * Lee las credenciales Cl@ve desde variables de entorno.
 * Devuelve null si alguna variable falta (el bot continuará en modo sin autenticación).
 */
export function getConfigClavePin(): ConfigClavePin | null {
  const nif      = process.env.CLAVEPIN_USER
  const password = process.env.CLAVEPIN_PASS
  const totpSecret = process.env.CLAVEPIN_TOTP_SECRET

  if (!nif || !password || !totpSecret) return null
  return { nif, password, totpSecret }
}

export function tieneConfigClavePin(): boolean {
  return getConfigClavePin() !== null
}

/**
 * Realiza el login en Cl@ve Permanente y devuelve un BrowserContext autenticado.
 * El contexto mantiene las cookies de sesión activas para navegar a la sede MJ.
 *
 * Flujo Cl@ve Permanente:
 *   1. Navegar a la página del trámite MJ → click "Acceder con Cl@ve"
 *   2. Cl@ve IdP → campo NIF + contraseña → Siguiente
 *   3. Página OTP → campo de 6 dígitos TOTP → Confirmar
 *   4. Redirigido de vuelta a la sede MJ con sesión activa
 */
export async function autenticarConClavePin(
  browser: Browser,
  logger: JobLogger,
  urlTramite: string,
  jobId: string,
): Promise<BrowserContext> {
  const cfg = getConfigClavePin()
  if (!cfg) throw new Error('Credenciales Cl@ve Permanente no configuradas')

  logger.log('Iniciando autenticación Cl@ve Permanente')

  const context = await browser.newContext({
    locale: 'es-ES',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36',
  })
  const page = await context.newPage()

  try {
    // ── Paso 1: Ir al trámite y pulsar "Con Cl@ve" ──────────────────────────
    logger.log(`Navegando a ${urlTramite}`)
    await page.goto(urlTramite, { waitUntil: 'domcontentloaded', timeout: 30_000 })

    await capturarPantalla(page, jobId, 'auth-01-inicio', logger)

    // Intentar varios textos de botón según la sede
    const botonesClaveTextos = [
      'Cl@ve', 'clave', 'Acceder con Cl@ve', 'Con Cl@ve',
      'Certificado o Cl@ve', 'Identificación electrónica',
    ]
    let claveBtnClicked = false
    for (const texto of botonesClaveTextos) {
      const btn = page.getByRole('link', { name: new RegExp(texto, 'i') })
        .or(page.getByRole('button', { name: new RegExp(texto, 'i') }))
      if (await btn.first().isVisible({ timeout: 3_000 }).catch(() => false)) {
        await btn.first().click()
        claveBtnClicked = true
        logger.log(`Click en botón Cl@ve: "${texto}"`)
        break
      }
    }
    if (!claveBtnClicked) {
      logger.log('Botón Cl@ve no encontrado — la página puede haber cambiado de estructura')
    }

    await page.waitForLoadState('networkidle', { timeout: 20_000 }).catch(() => {})
    await capturarPantalla(page, jobId, 'auth-02-idp', logger)

    // ── Paso 2: Formulario NIF + contraseña ─────────────────────────────────
    logger.log('Rellenando NIF y contraseña en Cl@ve IdP')

    const nifInput = page.locator('input[name="dni"], input[id*="nif"], input[id*="dni"], input[placeholder*="NIF"]').first()
    const passInput = page.locator('input[type="password"]').first()

    if (await nifInput.isVisible({ timeout: 8_000 }).catch(() => false)) {
      await nifInput.fill(cfg.nif)
      logger.log('NIF introducido')
    } else {
      logger.log('Campo NIF no encontrado — puede que ya haya redirigido o el selector cambió')
    }

    if (await passInput.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await passInput.fill(cfg.password)
      logger.log('Contraseña introducida')
    }

    // Click en siguiente / enviar
    const btnSiguiente = page.getByRole('button', { name: /siguiente|acceder|entrar|enviar/i })
      .or(page.locator('input[type="submit"]'))
    await btnSiguiente.first().click().catch(() => {})
    await page.waitForLoadState('networkidle', { timeout: 20_000 }).catch(() => {})
    await capturarPantalla(page, jobId, 'auth-03-otp', logger)

    // ── Paso 3: Código OTP ───────────────────────────────────────────────────
    const otpInput = page.locator(
      'input[name*="otp"], input[name*="pin"], input[name*="codigo"], ' +
      'input[id*="otp"], input[id*="pin"], input[placeholder*="código"], ' +
      'input[maxlength="6"]'
    ).first()

    if (await otpInput.isVisible({ timeout: 10_000 }).catch(() => false)) {
      // Si quedan menos de 5s para que expire, esperar al siguiente período
      const restantes = segundosRestantesTOTP()
      if (restantes < 5) {
        logger.log(`Esperando ${restantes + 2}s para nuevo período TOTP`)
        await new Promise(r => setTimeout(r, (restantes + 2) * 1000))
      }
      const otp = generarTOTP(cfg.totpSecret)
      await otpInput.fill(otp)
      logger.log('Código TOTP introducido')

      const btnConfirmar = page.getByRole('button', { name: /confirmar|enviar|aceptar|siguiente/i })
        .or(page.locator('input[type="submit"]'))
      await btnConfirmar.first().click().catch(() => {})
      await page.waitForLoadState('networkidle', { timeout: 20_000 }).catch(() => {})
      await capturarPantalla(page, jobId, 'auth-04-autenticado', logger)
      logger.log('Autenticación Cl@ve Permanente completada')
    } else {
      logger.log('Campo OTP no detectado — posible sesión ya activa o flujo diferente')
    }

    await page.close()
    return context

  } catch (err) {
    await capturarPantalla(page, jobId, 'auth-error', logger).catch(() => {})
    await page.close()
    throw new Error(`Error en autenticación Cl@ve: ${String(err)}`)
  }
}

// Dominios que requieren el certificado FNMT durante el flujo de autenticación
const DOMINIOS_CERT = [
  'https://sede.mjusticia.gob.es',
  'https://sede2.mjusticia.gob.es',
  'https://pasarela.clave.gob.es',
  'https://clave.gob.es',
]

/**
 * Crea un contexto con certificado PKCS#12 (FNMT) si está configurado.
 * Registra el certificado en todos los dominios del flujo MJ + Cl@ve.
 * Fallback: contexto estándar sin autenticación.
 */
export async function crearContextoCertificado(
  browser: Browser,
  logger: JobLogger,
  _urlOrigen: string,
): Promise<BrowserContext> {
  const p12Base64 = process.env.CERT_P12_BASE64?.trim()
  const p12Pass   = process.env.CERT_P12_PASSWORD?.trim()

  if (p12Base64 && p12Pass) {
    logger.log('Cargando certificado FNMT en contexto (dominios: MJ + Cl@ve)')
    const pfxBuffer = Buffer.from(p12Base64, 'base64')

    try {
      const context = await browser.newContext({
        locale: 'es-ES',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36',
        clientCertificates: DOMINIOS_CERT.map(origin => ({
          origin,
          pfx: pfxBuffer,
          passphrase: p12Pass,
        })),
      })
      logger.log('Contexto FNMT creado para todos los dominios del flujo Cl@ve')
      return context
    } catch (err) {
      logger.log(`Advertencia: no se pudo cargar el certificado FNMT (${String(err)}) — continuando sin autenticación`)
    }
  }

  return browser.newContext({
    locale: 'es-ES',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36',
  })
}

/**
 * Detecta si estamos en la pasarela Cl@ve y navega con certificado.
 * Hace clic en "Acceder DNIe / Certificado electrónico" y espera la redirección.
 */
export async function manejarPasarelaClave(
  page: import('playwright-core').Page,
  logger: JobLogger,
): Promise<boolean> {
  const url = page.url()
  if (!url.includes('pasarela.clave.gob.es') && !url.includes('clave.gob.es')) return false

  logger.log('Pasarela Cl@ve detectada — seleccionando DNIe/Certificado')

  // Buscar el botón de acceso con certificado
  const botonesCert = [
    'Acceder DNIe / Certificado electrónico',
    'DNIe / Certificado electrónico',
    'Certificado electrónico',
    'DNIe',
  ]

  for (const texto of botonesCert) {
    const btn = page.getByRole('button', { name: new RegExp(texto, 'i') })
      .or(page.getByRole('link', { name: new RegExp(texto, 'i') }))
    if (await btn.first().isVisible({ timeout: 4_000 }).catch(() => false)) {
      await btn.first().click()
      logger.log(`Click en "${texto}"`)
      await page.waitForLoadState('domcontentloaded', { timeout: 30_000 }).catch(() => {})
      await new Promise(r => setTimeout(r, 1_000))
      logger.log(`URL tras auth certificado: ${page.url()}`)
      return true
    }
  }

  logger.log('Botón de certificado no encontrado en Cl@ve — puede haber seleccionado automáticamente')
  return false
}
