import { Page } from 'playwright'
import { DatosSolicitud, ResultadoTramitacion, TramitadorCertificado, formatFechaMJ, pausaUsuario } from './tipos'

// URL del trámite en la sede del MJ
const URL_TRAMITE = 'https://sede.mjusticia.gob.es/tramites/certificado-nacimiento'

export const tramitadorNacimiento: TramitadorCertificado = {
  async tramitar(page: Page, solicitud: DatosSolicitud): Promise<ResultadoTramitacion> {
    const d = solicitud.datos
    console.log(`  → Abriendo formulario MJ Nacimiento...`)

    try {
      await page.goto(URL_TRAMITE, { waitUntil: 'domcontentloaded', timeout: 30000 })

      // Buscar el botón de solicitud online y hacer clic
      // El MJ presenta opciones: online, correo, presencial
      const btnOnline = page.locator('a:has-text("Solicitar online"), button:has-text("Tramitar online"), a:has-text("Tramitar")')
      if (await btnOnline.first().isVisible({ timeout: 5000 }).catch(() => false)) {
        await btnOnline.first().click()
        await page.waitForLoadState('domcontentloaded')
      }

      // ── PASO 1: Tipo de certificado ──────────────────────────────────
      console.log(`  → Paso 1: Tipo de certificado (${d.tipoCertificado ?? 'Literal'})`)

      const tipoMap: Record<string, string> = {
        'Literal':               'literal',
        'Extracto':              'extracto',
        'Plurilingüe (Extracto)':'plurilingue',
      }
      const tipoValor = tipoMap[d.tipoCertificado] ?? 'literal'

      // Intentar radio button o select
      const radioTipo = page.locator(`input[type="radio"][value*="${tipoValor}"]`)
      if (await radioTipo.first().isVisible({ timeout: 5000 }).catch(() => false)) {
        await radioTipo.first().click()
      } else {
        const selectTipo = page.locator('select[name*="tipo"], select[id*="tipo"]')
        if (await selectTipo.isVisible({ timeout: 3000 }).catch(() => false)) {
          await selectTipo.selectOption({ label: d.tipoCertificado ?? 'Literal' })
        }
      }

      await pulsarSiguiente(page)

      // ── PASO 2: Datos del inscrito ───────────────────────────────────
      console.log(`  → Paso 2: Datos del inscrito`)

      await rellenarMJ(page, ['nombre', 'name', 'nombreInscrito'],           d.nombre ?? '')
      await rellenarMJ(page, ['apellido1', 'primerApellido', 'apellidos'],   d.apellido1 ?? '')
      await rellenarMJ(page, ['apellido2', 'segundoApellido'],               d.apellido2 ?? '')
      await rellenarMJ(page, ['fechaNacimiento', 'fecha'],                   formatFechaMJ(d.fechaNacimiento ?? ''))
      await rellenarMJ(page, ['lugarNacimiento', 'municipio', 'localidad'],  d.lugarNacimiento ?? '')
      await rellenarMJ(page, ['provincia', 'provinciaNacimiento'],           d.provinciaNacimiento ?? '')

      if (d.nombrePadre) await rellenarMJ(page, ['nombrePadre', 'padre'],   d.nombrePadre)
      if (d.nombreMadre) await rellenarMJ(page, ['nombreMadre', 'madre'],   d.nombreMadre)

      // Finalidad
      const selectFinalidad = page.locator('select[name*="finalidad"], select[id*="finalidad"]')
      if (await selectFinalidad.isVisible({ timeout: 3000 }).catch(() => false)) {
        await selectFinalidad.selectOption({ label: d.finalidad }).catch(() => {})
      }

      await pulsarSiguiente(page)

      // ── PASO 3: Datos del solicitante ────────────────────────────────
      console.log(`  → Paso 3: Datos del solicitante`)

      await rellenarMJ(page, ['nombreSolicitante', 'solNombre', 'solicitanteNombre'],   d.solNombre ?? '')
      await rellenarMJ(page, ['apellido1Solicitante', 'solApellido1'],                  d.solApellido1 ?? '')
      await rellenarMJ(page, ['apellido2Solicitante', 'solApellido2'],                  d.solApellido2 ?? '')
      await rellenarMJ(page, ['dniSolicitante', 'nif', 'dni', 'solDni'],               d.solDni ?? '')
      await rellenarMJ(page, ['telefonoSolicitante', 'telefono', 'solTelefono'],        d.solTelefono ?? '')
      await rellenarMJ(page, ['emailSolicitante', 'email', 'correo'],                   d.solDireccion ? '' : '')
      await rellenarMJ(page, ['direccion', 'domicilio', 'solDireccion'],               d.solDireccion ?? '')
      await rellenarMJ(page, ['codigoPostal', 'cp', 'solCp'],                          d.solCp ?? '')
      await rellenarMJ(page, ['municipioSolicitante', 'localidadSolicitante', 'solMunicipio'], d.solMunicipio ?? '')
      await rellenarMJ(page, ['provinciaSolicitante', 'solProvincia'],                 d.solProvincia ?? '')

      await pulsarSiguiente(page)

      // ── CAPTCHA ──────────────────────────────────────────────────────
      const tieneCaptcha = await page.locator('iframe[src*="recaptcha"], .captcha, #captcha').isVisible({ timeout: 3000 }).catch(() => false)
      if (tieneCaptcha) {
        await pausaUsuario(page, 'Hay un CAPTCHA. Resuélvelo en el navegador y pulsa Intro aquí para continuar.', 120)
      }

      // ── PASO FINAL: Confirmación ─────────────────────────────────────
      console.log(`  → Confirmando envío...`)
      const btnEnviar = page.locator('button[type="submit"]:has-text("Enviar"), button:has-text("Confirmar"), input[type="submit"]')
      if (await btnEnviar.first().isVisible({ timeout: 5000 }).catch(() => false)) {
        await btnEnviar.first().click()
        await page.waitForLoadState('domcontentloaded', { timeout: 20000 })
      }

      // ── Capturar número de justificante ─────────────────────────────
      const referenciaMJ = await capturarReferenciaMJ(page)
      console.log(`  ✅ Enviado. Referencia MJ: ${referenciaMJ ?? '(no capturada)'}`)

      // Hacer captura de pantalla como evidencia
      await page.screenshot({ path: `evidencias/${solicitud.referencia}-confirmacion.png`, fullPage: true })

      return { ok: true, referenciaMJ: referenciaMJ ?? undefined }

    } catch (err) {
      const mensaje = err instanceof Error ? err.message : String(err)
      console.error(`  ❌ Error: ${mensaje}`)
      await page.screenshot({ path: `evidencias/${solicitud.referencia}-error.png`, fullPage: true }).catch(() => {})
      return { ok: false, error: mensaje }
    }
  },
}

// ── Helpers internos ─────────────────────────────────────────────────────────

async function rellenarMJ(page: Page, posiblesNombres: string[], valor: string) {
  if (!valor) return
  for (const nombre of posiblesNombres) {
    const selector = `input[name="${nombre}"], input[id="${nombre}"], input[placeholder*="${nombre}" i]`
    const el = page.locator(selector).first()
    if (await el.isVisible({ timeout: 1500 }).catch(() => false)) {
      await el.fill(valor)
      return
    }
  }
  // Si no encontramos por nombre, no es error crítico — puede que el campo no exista en este paso
}

async function pulsarSiguiente(page: Page) {
  const siguiente = page.locator('button:has-text("Siguiente"), button:has-text("Continuar"), input[value="Siguiente"]')
  if (await siguiente.first().isVisible({ timeout: 5000 }).catch(() => false)) {
    await siguiente.first().click()
    await page.waitForLoadState('domcontentloaded', { timeout: 15000 })
    await page.waitForTimeout(1000)
  }
}

async function capturarReferenciaMJ(page: Page): Promise<string | null> {
  // Buscar el número de justificante en la página de confirmación
  const patrones = [
    /justificante[:\s#]+([A-Z0-9/-]+)/i,
    /número de referencia[:\s]+([A-Z0-9/-]+)/i,
    /referencia[:\s]+([A-Z0-9/-]+)/i,
    /expediente[:\s]+([A-Z0-9/-]+)/i,
  ]
  const texto = await page.textContent('body').catch(() => '')
  if (!texto) return null
  for (const patron of patrones) {
    const match = texto.match(patron)
    if (match) return match[1].trim()
  }
  return null
}
