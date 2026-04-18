import { Browser, BrowserContext } from 'playwright-core'
import { JobLogger } from '../logger'

/**
 * Autenticación con DNI electrónico (tarjeta física + lector).
 *
 * Requisitos del entorno donde corre el bot:
 *  - Middleware DNIe instalado (https://www.dnielectronico.es/PortalDNIe/)
 *    · Windows: instala el certificado en el almacén de Windows automáticamente
 *    · Linux:   requiere OpenSC + pcscd; lib en /usr/lib/x86_64-linux-gnu/opensc-pkcs11.so
 *    · macOS:   OpenSC o middleware oficial; lib en /Library/OpenSC/lib/opensc-pkcs11.so
 *  - Lector de tarjetas conectado con la tarjeta insertada
 *  - PIN configurado (ver DNIE_PIN en .env)
 *
 * Limitación crítica:
 *  El DNIe NO puede usarse en servidores cloud (Vercel, Railway) porque requiere
 *  hardware físico. Funciona en servidores on-premise o en desarrollo local.
 *
 * Mecanismo:
 *  1. Chromium se lanza con --use-system-certificate-store (Windows/macOS)
 *     o con NSS + módulo PKCS#11 cargado (Linux).
 *  2. Al acceder a la sede MJ con autenticación de certificado, el navegador
 *     selecciona automáticamente el certificado del DNIe del almacén del sistema.
 *  3. Si aparece diálogo de PIN (solo modo no-headless o con middleware que
 *     permite caché), se autocompletará con DNIE_PIN si está configurado.
 *  4. En headless puro, el middleware DNIe 3.0+ soporta PIN caching en sesión:
 *     el usuario debe desbloquear la tarjeta una vez antes de lanzar el bot.
 */

export interface ConfigDnie {
  pin?: string
  pkcs11LibPath?: string  // Solo Linux/macOS — ruta a la lib PKCS#11 del middleware
}

export function tieneConfigDnie(): boolean {
  return process.env.DNIE_ENABLED === 'true'
}

export function getConfigDnie(): ConfigDnie | null {
  if (!tieneConfigDnie()) return null
  return {
    pin: process.env.DNIE_PIN || undefined,
    pkcs11LibPath: process.env.DNIE_PKCS11_LIB || undefined,
  }
}

/**
 * Argumentos de lanzamiento de Chromium necesarios para DNIe.
 * Se pasan a chromium.launch({ args }).
 */
export function getArgsDnie(): string[] {
  const args: string[] = []

  if (process.platform === 'win32' || process.platform === 'darwin') {
    // Windows y macOS: el middleware DNIe registra el cert en el almacén del SO
    args.push('--use-system-certificate-store')
  } else {
    // Linux: configurar NSS para cargar el módulo PKCS#11 del middleware DNIe
    const libPath = process.env.DNIE_PKCS11_LIB
      ?? '/usr/lib/x86_64-linux-gnu/opensc-pkcs11.so'
    // NSS requiere una base de datos; aquí usamos la del perfil de Chrome
    args.push(`--nss-module-directory=${libPath}`)
    args.push('--use-system-certificate-store')
  }

  // En headless, Chromium no muestra el selector de certificados —
  // si solo hay un cert de cliente para el dominio, lo selecciona automáticamente.
  // Forzar selección automática sin diálogo:
  args.push('--disable-client-certificate-request')  // evita el picker si hay uno solo

  return args
}

/**
 * Crea un contexto de navegador estándar para DNIe.
 * El certificado se gestiona a nivel de browser (no de context), por lo que
 * no se pasan clientCertificates aquí — el browser ya lo tiene en el almacén.
 */
export async function crearContextoDnie(
  browser: Browser,
  logger: JobLogger,
): Promise<BrowserContext> {
  logger.log('Creando contexto DNIe (certificado vía almacén del sistema)')
  return browser.newContext({
    locale: 'es-ES',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36',
  })
}

/**
 * Intenta manejar el diálogo de PIN del DNIe si aparece como diálogo web.
 * Algunos middlewares modernos muestran el PIN via prompt() de JavaScript.
 * El diálogo nativo del SO (Win32 CAPI) no puede interceptarse con Playwright.
 */
export function instalarHandlerPin(page: import('playwright-core').Page, logger: JobLogger) {
  const cfg = getConfigDnie()
  if (!cfg?.pin) return

  page.on('dialog', async (dialog) => {
    const msg = dialog.message().toLowerCase()
    if (msg.includes('pin') || msg.includes('contraseña') || msg.includes('password')) {
      logger.log('Diálogo de PIN DNIe detectado — introduciendo PIN automáticamente')
      await dialog.accept(cfg.pin!)
    }
  })
}
