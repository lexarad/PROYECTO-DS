import { Page } from 'playwright'
import { DatosSolicitud, ResultadoTramitacion, TramitadorCertificado, formatFechaMJ, pausaUsuario } from './tipos'

const URL_TRAMITE = 'https://sede.mjusticia.gob.es/tramites/certificado-matrimonio'

export const tramitadorMatrimonio: TramitadorCertificado = {
  async tramitar(page: Page, solicitud: DatosSolicitud): Promise<ResultadoTramitacion> {
    const d = solicitud.datos
    console.log(`  → Abriendo formulario MJ Matrimonio...`)

    try {
      await page.goto(URL_TRAMITE, { waitUntil: 'domcontentloaded', timeout: 30000 })

      const btnOnline = page.locator('a:has-text("Solicitar online"), a:has-text("Tramitar online"), a:has-text("Tramitar")')
      if (await btnOnline.first().isVisible({ timeout: 5000 }).catch(() => false)) {
        await btnOnline.first().click()
        await page.waitForLoadState('domcontentloaded')
      }

      // Tipo de certificado
      const tipoMap: Record<string, string> = {
        'Literal': 'literal', 'Extracto': 'extracto', 'Plurilingüe (Extracto)': 'plurilingue',
      }
      const tipoValor = tipoMap[d.tipoCertificado] ?? 'literal'
      const radioTipo = page.locator(`input[type="radio"][value*="${tipoValor}"]`)
      if (await radioTipo.first().isVisible({ timeout: 5000 }).catch(() => false)) await radioTipo.first().click()
      await pulsarSiguiente(page)

      // Datos del matrimonio
      console.log(`  → Datos del matrimonio y cónyuges`)
      await rellenarMJ(page, ['c1Nombre', 'nombreConyuge1', 'nombre1'],       d.c1Nombre ?? '')
      await rellenarMJ(page, ['c1Apellido1', 'apellido1Conyuge1'],            d.c1Apellido1 ?? '')
      await rellenarMJ(page, ['c1Apellido2', 'apellido2Conyuge1'],            d.c1Apellido2 ?? '')
      await rellenarMJ(page, ['c2Nombre', 'nombreConyuge2', 'nombre2'],       d.c2Nombre ?? '')
      await rellenarMJ(page, ['c2Apellido1', 'apellido1Conyuge2'],            d.c2Apellido1 ?? '')
      await rellenarMJ(page, ['c2Apellido2', 'apellido2Conyuge2'],            d.c2Apellido2 ?? '')
      await rellenarMJ(page, ['fechaMatrimonio', 'fecha'],                    formatFechaMJ(d.fechaMatrimonio ?? ''))
      await rellenarMJ(page, ['lugarMatrimonio', 'municipio', 'localidad'],   d.lugarMatrimonio ?? '')
      await rellenarMJ(page, ['provinciaMatrimonio', 'provincia'],            d.provinciaMatrimonio ?? '')

      const selectFinalidad = page.locator('select[name*="finalidad"], select[id*="finalidad"]')
      if (await selectFinalidad.isVisible({ timeout: 3000 }).catch(() => false)) {
        await selectFinalidad.selectOption({ label: d.finalidad }).catch(() => {})
      }
      await pulsarSiguiente(page)

      // Solicitante
      console.log(`  → Datos del solicitante`)
      await rellenarSolicitante(page, d)
      await pulsarSiguiente(page)

      // Captcha
      if (await page.locator('iframe[src*="recaptcha"], .captcha').isVisible({ timeout: 3000 }).catch(() => false)) {
        await pausaUsuario(page, 'Hay un CAPTCHA. Resuélvelo y pulsa Intro para continuar.', 120)
      }

      // Enviar
      const btnEnviar = page.locator('button[type="submit"]:has-text("Enviar"), button:has-text("Confirmar"), input[type="submit"]')
      if (await btnEnviar.first().isVisible({ timeout: 5000 }).catch(() => false)) {
        await btnEnviar.first().click()
        await page.waitForLoadState('domcontentloaded', { timeout: 20000 })
      }

      const referenciaMJ = await capturarReferenciaMJ(page)
      console.log(`  ✅ Enviado. Referencia MJ: ${referenciaMJ ?? '(no capturada)'}`)
      await page.screenshot({ path: `evidencias/${solicitud.referencia}-confirmacion.png`, fullPage: true })

      return { ok: true, referenciaMJ: referenciaMJ ?? undefined }
    } catch (err) {
      const mensaje = err instanceof Error ? err.message : String(err)
      await page.screenshot({ path: `evidencias/${solicitud.referencia}-error.png`, fullPage: true }).catch(() => {})
      return { ok: false, error: mensaje }
    }
  },
}

async function rellenarMJ(page: Page, posiblesNombres: string[], valor: string) {
  if (!valor) return
  for (const nombre of posiblesNombres) {
    const el = page.locator(`input[name="${nombre}"], input[id="${nombre}"]`).first()
    if (await el.isVisible({ timeout: 1500 }).catch(() => false)) { await el.fill(valor); return }
  }
}

async function rellenarSolicitante(page: Page, d: Record<string, string>) {
  await rellenarMJ(page, ['nombreSolicitante', 'solNombre'],      d.solNombre ?? '')
  await rellenarMJ(page, ['apellido1Solicitante', 'solApellido1'], d.solApellido1 ?? '')
  await rellenarMJ(page, ['apellido2Solicitante', 'solApellido2'], d.solApellido2 ?? '')
  await rellenarMJ(page, ['dniSolicitante', 'nif', 'dni', 'solDni'], d.solDni ?? '')
  await rellenarMJ(page, ['telefonoSolicitante', 'telefono'],     d.solTelefono ?? '')
  await rellenarMJ(page, ['direccion', 'domicilio'],              d.solDireccion ?? '')
  await rellenarMJ(page, ['codigoPostal', 'cp'],                  d.solCp ?? '')
  await rellenarMJ(page, ['municipioSolicitante', 'localidad'],   d.solMunicipio ?? '')
  await rellenarMJ(page, ['provinciaSolicitante', 'provincia'],   d.solProvincia ?? '')
}

async function pulsarSiguiente(page: Page) {
  const btn = page.locator('button:has-text("Siguiente"), button:has-text("Continuar"), input[value="Siguiente"]')
  if (await btn.first().isVisible({ timeout: 5000 }).catch(() => false)) {
    await btn.first().click()
    await page.waitForLoadState('domcontentloaded', { timeout: 15000 })
    await page.waitForTimeout(1000)
  }
}

async function capturarReferenciaMJ(page: Page): Promise<string | null> {
  const texto = await page.textContent('body').catch(() => '')
  if (!texto) return null
  const match = texto.match(/justificante[:\s#]+([A-Z0-9/-]+)/i)
    ?? texto.match(/referencia[:\s]+([A-Z0-9/-]+)/i)
  return match ? match[1].trim() : null
}
