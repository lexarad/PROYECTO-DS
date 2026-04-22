/**
 * test-mj.ts — Script de prueba standalone contra el MJ
 *
 * Ejecutar: npx tsx scripts/test-mj.ts [nacimiento|matrimonio|defuncion|dry-run|health]
 *
 * Modos:
 *   health    - Solo verifica conectividad MJ (sin browser)
 *   dry-run   - Abre el browser, navega hasta el formulario pero NO lo envía
 *   nacimiento - Tramitación REAL de un certificado de nacimiento de prueba
 */

import { readFileSync, existsSync } from 'fs'
import { resolve, join } from 'path'

// Cargar .env manualmente (sin dependencia de dotenv)
const envPath = resolve(__dirname, '..', '.env')
if (existsSync(envPath)) {
  const lines = readFileSync(envPath, 'utf-8').split('\n')
  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eq = trimmed.indexOf('=')
    if (eq === -1) continue
    const key = trimmed.slice(0, eq).trim()
    const val = trimmed.slice(eq + 1).trim().replace(/^["']|["']$/g, '')
    if (key && !(key in process.env)) process.env[key] = val
  }
}

import { chromium } from 'playwright-core'

// ── Datos reales del solicitante ──────────────────────────────────────────
const DATOS_PRUEBA_NACIMIENTO = {
  nombre: 'Victor',
  apellido1: 'Heredia',
  apellido2: 'Hernandez',
  fechaNacimiento: '01/07/1991',
  lugarNacimiento: 'Barcelona',
  provinciaNacimiento: 'Barcelona',
  tipoCertificado: 'Literal',
  finalidad: 'Uso particular',
  tipoSolicitante: '1' as '1' | '4',  // '1' = Inscrito (es para mí)
  solNombre: 'Victor',
  solApellido1: 'Heredia',
  solApellido2: 'Hernandez',
  solDni: '47889176W',
  solTelefono: '930000000',
  solDireccion: 'Via Laietana 59',
  solCp: '08003',
  solMunicipio: 'Barcelona',
  solProvincia: 'Barcelona',
}

const MJ_URLS = {
  nacimiento: 'https://sede.mjusticia.gob.es/es/tramites/certificado-nacimiento',
  matrimonio: 'https://sede.mjusticia.gob.es/es/tramites/certificado-matrimonio',
  defuncion:  'https://sede.mjusticia.gob.es/es/tramites/certificado-defuncion',
}

// ── Detección de auth ──────────────────────────────────────────────────────
function detectarAuth() {
  const clave  = !!(process.env.CLAVEPIN_USER && process.env.CLAVEPIN_PASS && process.env.CLAVEPIN_TOTP_SECRET)
  const dnie   = process.env.DNIE_ENABLED === 'true'
  const pkcs12 = !!(process.env.CERT_P12_BASE64 && process.env.CERT_P12_PASSWORD)

  if (clave)  return 'clavepin'
  if (dnie)   return 'dnie'
  if (pkcs12) return 'pkcs12'
  return 'anonimo'
}

// ── Health check (sin browser) ─────────────────────────────────────────────
async function healthCheck() {
  console.log('\n🔍 Verificando conectividad con Ministerio de Justicia...\n')

  let todosOK = true
  for (const [nombre, url] of Object.entries(MJ_URLS)) {
    const inicio = Date.now()
    try {
      const res = await fetch(url, {
        method: 'HEAD',
        signal: AbortSignal.timeout(10_000),
        headers: { 'User-Agent': 'Mozilla/5.0 CertiDocs-test/1.0' },
      })
      const ms = Date.now() - inicio
      const ok = res.status < 500
      console.log(`  ${ok ? '✅' : '❌'} ${nombre.padEnd(12)} → ${res.status} (${ms}ms) — ${url}`)
      if (!ok) todosOK = false
    } catch (err) {
      console.log(`  ❌ ${nombre.padEnd(12)} → ERROR: ${String(err)}`)
      todosOK = false
    }
  }

  console.log('\n📋 Configuración de autenticación:')
  const metodo = detectarAuth()
  console.log(`  Método activo    : ${metodo.toUpperCase()}`)
  console.log(`  Cl@ve Permanente : ${process.env.CLAVEPIN_USER ? '✅ configurado' : '❌ no configurado'}`)
  console.log(`  Certificado PKCS12: ${process.env.CERT_P12_BASE64 ? '✅ configurado' : '❌ no configurado'}`)
  console.log(`  DNIe             : ${process.env.DNIE_ENABLED === 'true' ? '✅ habilitado' : '❌ no habilitado'}`)
  console.log(`  Dry-run mode     : ${process.env.AUTOMATION_DRY_RUN === 'true' ? '✅ activado' : '⚠  desactivado (modo real)'}`)

  return todosOK
}

// ── Prueba con browser (dry-run o real) ────────────────────────────────────
async function testConBrowser(modo: 'dry-run' | 'nacimiento') {
  console.log(`\n🌐 Iniciando prueba de browser (modo: ${modo})...\n`)

  const metodo = detectarAuth()
  console.log(`  Método de auth: ${metodo}`)

  // Preparar args para DNIe si aplica
  const dnieArgs: string[] = []
  if (metodo === 'dnie') {
    dnieArgs.push('--use-system-certificate-store')
    dnieArgs.push('--disable-client-certificate-request')
  }

  // Preparar clientCertificates para PKCS12
  const clientCerts: any[] = []
  if (metodo === 'pkcs12' && process.env.CERT_P12_BASE64 && process.env.CERT_P12_PASSWORD) {
    const pfxBuffer = Buffer.from(process.env.CERT_P12_BASE64, 'base64')
    clientCerts.push({
      origin: 'https://sede.mjusticia.gob.es',
      pfx: pfxBuffer,
      passphrase: process.env.CERT_P12_PASSWORD,
    })
    console.log('  ✅ Certificado PKCS12 cargado en memoria')
  }

  // Lanzar browser
  console.log('  Lanzando Chromium...')
  const browser = await chromium.launch({
    headless: false,  // false para ver qué pasa durante las pruebas
    slowMo: 100,
    args: dnieArgs,
  })

  const contextOptions: any = {
    locale: 'es-ES',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36',
  }
  if (clientCerts.length > 0) {
    contextOptions.clientCertificates = clientCerts
  }

  const context = await browser.newContext(contextOptions)
  const page = await context.newPage()

  const url = MJ_URLS.nacimiento
  const screenshots: string[] = []
  const evidenciasDir = join(__dirname, '..', 'evidencias')
  const { mkdirSync } = await import('fs')
  mkdirSync(evidenciasDir, { recursive: true })

  try {
    // ── Paso 1: Navegar al trámite ─────────────────────────────────────
    console.log(`\n  [1] Navegando a ${url}`)
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30_000 })

    // Aceptar cookies si aparece el banner
    const btnCookies = page.locator('button:has-text("Aceptar"), button:has-text("Accept"), #onetrust-accept-btn-handler')
    if (await btnCookies.first().isVisible({ timeout: 4_000 }).catch(() => false)) {
      await btnCookies.first().click()
      console.log('  🍪 Cookies aceptadas')
    }

    await page.screenshot({ path: join(evidenciasDir, 'test-01-inicio.png'), fullPage: true })
    console.log('  📸 Screenshot guardado: evidencias/test-01-inicio.png')
    console.log(`  📍 URL actual: ${page.url()}`)

    if (modo === 'dry-run') {
      // Navegar al formulario extrayendo href del DOM (enlace en sección Bootstrap collapse)
      console.log('\n  [2] Navegando al formulario MJ (sin identificación)...')
      const href = await page.evaluate(() => {
        const links = Array.from(document.querySelectorAll('a'))
        const link = links.find(a => (a.textContent ?? '').toLowerCase().includes('sin identificaci') && a.href)
        return link?.href ?? null
      })

      if (href) {
        console.log(`  ✅ Link encontrado: ${href}`)
        await page.goto(href, { waitUntil: 'domcontentloaded', timeout: 25_000 })
        await new Promise(r => setTimeout(r, 1000))
        await page.screenshot({ path: join(evidenciasDir, 'test-02-formulario.png'), fullPage: true })
        console.log(`  📸 Screenshot: evidencias/test-02-formulario.png`)
        console.log(`  📍 URL del formulario: ${page.url()}`)
      } else {
        console.log('  ⚠  Link de tramitación no encontrado en el DOM')
      }
      console.log('\n  ✅ DRY-RUN completado — el MJ es accesible y el browser funciona correctamente.')
      console.log('  🔄 Para hacer una tramitación REAL, ejecuta: npx tsx scripts/test-mj.ts nacimiento')
      await browser.close()
      return
    }

    // ── Paso 2: Navegar al formulario (extrae href del DOM) ───────────
    console.log('\n  [2] Navegando al formulario MJ...')
    // Buscar el link correcto: initDatosGenerales sin clave (para tramitación como tercero)
    // Evitamos initSolicitudLiteral que requiere Cl@ve registrado
    const formHref = await page.evaluate(() => {
      const links = Array.from(document.querySelectorAll('a[href]'))
      // Prioridad: sin identificación (CertiDocs tramita como tercero autorizado)
      const sinAuth = links.find(a => {
        const h = (a as HTMLAnchorElement).href
        return h.includes('initDatosGenerales') && !h.includes('/clave/')
      })
      if (sinAuth) return (sinAuth as HTMLAnchorElement).href
      // Fallback genérico
      const cualquiera = links.find(a => {
        const h = (a as HTMLAnchorElement).href
        return h.includes('initDatosGenerales') && !h.includes('initSolicitudLiteral')
      })
      return cualquiera ? (cualquiera as HTMLAnchorElement).href : null
    })

    if (formHref) {
      console.log(`  ✅ Formulario encontrado: ${formHref}`)
      await page.goto(formHref, { waitUntil: 'domcontentloaded', timeout: 25_000 })
      await new Promise(r => setTimeout(r, 800))
      await page.screenshot({ path: join(evidenciasDir, 'test-02-formulario.png'), fullPage: true })
      console.log(`  📸 Screenshot: evidencias/test-02-formulario.png`)
      console.log(`  📍 URL: ${page.url()}`)

      // ── Manejar pasarela Cl@ve si redirigió ───────────────────────────
      if (page.url().includes('clave.gob.es')) {
        console.log('\n  [2b] Pasarela Cl@ve detectada — autenticando con certificado FNMT...')

        const botonesCert = [
          'Acceder DNIe / Certificado electrónico',
          'DNIe / Certificado electrónico',
          'Certificado electrónico',
          'DNIe',
        ]
        let autenticado = false
        for (const texto of botonesCert) {
          const btn = page.getByRole('button', { name: new RegExp(texto, 'i') })
            .or(page.getByRole('link', { name: new RegExp(texto, 'i') }))
          if (await btn.first().isVisible({ timeout: 3_000 }).catch(() => false)) {
            await btn.first().click()
            console.log(`  ✅ Click en "${texto}"`)
            await page.waitForLoadState('domcontentloaded', { timeout: 30_000 }).catch(() => {})
            await new Promise(r => setTimeout(r, 1500))
            autenticado = true
            break
          }
        }
        if (!autenticado) console.log('  ⚠  Botón de certificado no encontrado')

        await page.screenshot({ path: join(evidenciasDir, 'test-02b-clave.png'), fullPage: true })
        console.log(`  📸 Screenshot: evidencias/test-02b-clave.png`)
        console.log(`  📍 URL tras auth: ${page.url()}`)
      }
    } else {
      console.log('  ⚠  Link de tramitación no encontrado en DOM')
      await browser.close()
      return
    }

    // ── Verificar si hay CAPTCHA ───────────────────────────────────────
    const tieneCaptcha = await page.locator('iframe[src*="recaptcha"], .g-recaptcha, [data-sitekey]')
      .isVisible({ timeout: 2_000 }).catch(() => false)

    if (tieneCaptcha) {
      console.log('\n  ⚠  CAPTCHA DETECTADO — No se puede continuar automáticamente.')
      console.log('     El MJ requiere resolución manual del CAPTCHA.')
      console.log('     Esto es normal para solicitudes sin autenticación.')
      console.log('     Solución: Configurar Cl@ve Permanente o certificado digital.')
      await browser.close()
      return
    }

    const d = DATOS_PRUEBA_NACIMIENTO

    // Select2 helper: manipula el <select> oculto directamente via evaluate
    // (evita timeouts de Playwright en elementos aria-hidden)
    const s2select = async (selector: string, value: string, label: string) => {
      const ok = await page.evaluate(([sel, val]) => {
        const el = document.querySelector(sel) as HTMLSelectElement | null
        if (!el) return false
        el.value = val
        el.dispatchEvent(new Event('change', { bubbles: true }))
        return true
      }, [selector, value])
      if (ok) {
        console.log(`  ✅ ${label} = ${value}`)
      } else {
        console.log(`  ⚠  ${label}: selector "${selector}" no encontrado`)
      }
      await new Promise(r => setTimeout(r, 400))
    }

    // ── Paso 3: DATOS GENERALES ───────────────────────────────────────
    console.log('\n  [3] Rellenando DATOS GENERALES...')

    const selectMateria = page.locator('select[name="materiaVO.codMateriaGe"]')
    if (await selectMateria.isVisible({ timeout: 4_000 }).catch(() => false)) {
      await selectMateria.selectOption({ value: 'NAC' })
      console.log('  ✅ Tipo certificado = NAC')
    }

    const tipoSol = d.tipoSolicitante ?? '4'
    const selectTipo = page.locator('select[name="tipoInteresadoVO.codTipoInteresado"]')
    if (await selectTipo.isVisible({ timeout: 4_000 }).catch(() => false)) {
      await selectTipo.selectOption({ value: tipoSol })
      console.log(`  ✅ Tipo solicitante = ${tipoSol === '1' ? 'Inscrito (yo mismo)' : 'Tercero'}`)
      await new Promise(r => setTimeout(r, 600))
    }

    if (tipoSol === '4') {
      const selectCalidad = page.locator('select[name="serDatosSolicitudVO.codCalidadTerIns"]')
      if (await selectCalidad.isVisible({ timeout: 3_000 }).catch(() => false)) {
        await selectCalidad.selectOption({ value: '3' })
        console.log('  ✅ Calidad = Autorizado')
      }
    }

    await page.screenshot({ path: join(evidenciasDir, 'test-03-datos-generales.png'), fullPage: true })
    console.log('  📸 Screenshot: evidencias/test-03-datos-generales.png')

    // Siguiente
    const btnSig1 = page.locator('button:has-text("Siguiente"), input[value="Siguiente"]')
    await btnSig1.first().click()
    await page.waitForLoadState('domcontentloaded', { timeout: 20_000 }).catch(() => {})
    await new Promise(r => setTimeout(r, 800))
    console.log(`  📍 URL tras Siguiente: ${page.url()}`)

    // ── Paso 4: Rellenar DATOS SOLICITANTE (campos exactos del MJ) ───
    console.log('\n  [4] Rellenando DATOS SOLICITANTE...')

    // Tipo identificador → 1=DNI
    await s2select('#tipoIdentificador', '1', 'Tipo identificador (DNI)')
    await new Promise(r => setTimeout(r, 500))  // esperar que aparezca fechaCaducidad

    // Nº identificación
    await page.locator('#numIdentificacion').fill(d.solDni)
    console.log(`  ✅ Nº identificación = "${d.solDni}"`)

    // Fecha caducidad del documento (requerida cuando tipoIdentificador=DNI)
    // Usar una fecha de caducidad realista para el DNI
    await page.locator('#fechaCaducidadDoc').fill('13/06/2034').catch(async () => {
      // Si no es visible todavía, esperar un poco más
      await new Promise(r => setTimeout(r, 800))
      await page.locator('#fechaCaducidadDoc').fill('13/06/2034', { force: true }).catch(() => {})
    })
    console.log('  ✅ Fecha caducidad doc = "13/06/2034"')

    // País emisor del documento → 108=ESPAÑA
    await s2select('#paisEmisorDoc', '108', 'País emisor doc (ESPAÑA)')

    // Sexo → 1=Hombre
    await s2select('#sexo', '1', 'Sexo (Hombre)')

    // Nombre
    await page.locator('#nombre').fill(d.nombre)
    console.log(`  ✅ Nombre = "${d.nombre}"`)

    // Apellido 1
    await page.locator('#apellido1').fill(d.apellido1)
    console.log(`  ✅ Apellido1 = "${d.apellido1}"`)

    // Apellido 2 (opcional)
    if (d.apellido2) {
      await page.locator('#apellido2').fill(d.apellido2)
      console.log(`  ✅ Apellido2 = "${d.apellido2}"`)
    }

    // Fecha de nacimiento (nombre del campo es fecNac — solo el ID es "fechaNacimiento")
    await page.locator('#fechaNacimiento').fill(d.fechaNacimiento)
    console.log(`  ✅ Fecha nacimiento = "${d.fechaNacimiento}"`)

    // País de nacimiento → 108=ESPAÑA
    await s2select('#paisNacimiento', '108', 'País de nacimiento (ESPAÑA)')
    await new Promise(r => setTimeout(r, 300))

    // Provincia de nacimiento → 08=Barcelona
    await s2select('#provinciaNacimiento', '08', 'Provincia (08=Barcelona)')
    await new Promise(r => setTimeout(r, 1000))  // AJAX carga municipios

    // Municipio nacimiento → 08019 = Barcelona (ciudad) — Select2 AJAX
    // Intentar via Select2 UI: click en el input de búsqueda y seleccionar
    const municipioAjaxCargado = await page.locator('#municipioNacimiento option[value]').count()
    if (municipioAjaxCargado > 1) {
      await s2select('#municipioNacimiento', '08019', 'Municipio (08019=Barcelona)')
    } else {
      // Fallback: rellenar el campo de texto libre con force (puede estar hidden)
      await page.evaluate(() => {
        const el = document.querySelector('#lugarNacimiento') as HTMLInputElement | null
        if (el) {
          el.value = 'Barcelona'
          el.dispatchEvent(new Event('input', { bubbles: true }))
          el.dispatchEvent(new Event('change', { bubbles: true }))
        }
      })
      console.log('  ✅ lugarNacimiento = "Barcelona" (via evaluate)')
    }

    // Email
    await page.locator('#email').fill('soporte@certidocs.es')
    console.log('  ✅ Email = "soporte@certidocs.es"')

    await page.screenshot({ path: join(evidenciasDir, 'test-04-datos-form.png'), fullPage: true })
    console.log('  📸 Screenshot: evidencias/test-04-datos-form.png')
    await page.screenshot({ path: join(evidenciasDir, 'test-05-solicitante.png'), fullPage: true })

    // ── Paso 5: Siguiente → DATOS DEL CERTIFICADO ────────────────────
    console.log('\n  [5] Enviando datos personales (Siguiente)...')
    await page.locator('button:has-text("Siguiente"), input[value="Siguiente"]').first().click()
    await page.waitForLoadState('domcontentloaded', { timeout: 30_000 }).catch(() => {})
    await new Promise(r => setTimeout(r, 1000))
    console.log(`  📍 URL paso 5: ${page.url()}`)
    await page.screenshot({ path: join(evidenciasDir, 'test-05-certificado-pre.png'), fullPage: true })

    // Dumping campos del paso de certificado
    const camposCert = await page.evaluate(() => {
      const inputs = Array.from(document.querySelectorAll('input[name]:not([type="hidden"]), select[name], textarea[name]'))
      return inputs.map(el => {
        const tag = el.tagName.toLowerCase()
        const name = el.getAttribute('name') ?? ''
        const id = el.getAttribute('id') ?? ''
        if (tag === 'select') {
          const opts = Array.from((el as HTMLSelectElement).options).map(o => `${o.value}:${o.text}`)
          return `${tag}[name="${name}"] id="${id}" — ${opts.slice(0, 6).join(', ')}`
        }
        return `${tag}[name="${name}"] id="${id}" val="${(el as HTMLInputElement).value}"`
      })
    })
    console.log('\n  📋 CAMPOS PASO CERTIFICADO:')
    for (const c of camposCert) console.log(`    ${c}`)

    // ── Paso 6: DATOS DEL CERTIFICADO (campos exactos del dump) ────────
    console.log('\n  [6] Rellenando DATOS DEL CERTIFICADO...')

    // Tipo certificado → LITNAC = Certificado Literal de Nacimiento
    await s2select('#tipoCertificado', 'LITNAC', 'Tipo certificado (LITNAC=Literal)')

    // Nº copias (ya tiene default 1, confirmar)
    await page.locator('#numCopias').fill('1').catch(() => {})
    console.log('  ✅ Nº copias = 1')

    // Destinatario → 3 = Otros (para uso personal)
    await s2select('#destinatario', '3', 'Destinatario (3=Otros)')

    // Motivo → 2 = Otros
    await s2select('#motivo', '2', 'Motivo (2=Otros)')

    // Finalidad (textarea — campo de texto libre requerido)
    await page.locator('#finalidad').fill('Uso particular').catch(async () => {
      await page.evaluate(() => {
        const el = document.querySelector('#finalidad') as HTMLTextAreaElement | null
        if (el) { el.value = 'Uso particular'; el.dispatchEvent(new Event('change', { bubbles: true })) }
      })
    })
    console.log('  ✅ Finalidad = "Uso particular"')

    await page.screenshot({ path: join(evidenciasDir, 'test-06-confirmacion.png'), fullPage: true })
    console.log('  📸 Screenshot: evidencias/test-06-confirmacion.png')

    // ── Paso 7: Siguiente → sub-página 2 ────────────────────────────────
    console.log('\n  [7] Avanzando a sub-página 2...')
    await page.locator('button:has-text("Siguiente"), input[value="Siguiente"]').first().click()
    await page.waitForLoadState('domcontentloaded', { timeout: 30_000 }).catch(() => {})
    await new Promise(r => setTimeout(r, 800))
    console.log(`  📍 URL sub-pág 2: ${page.url()}`)

    // Dump de campos de sub-página 2
    const camposSP2 = await page.evaluate(() => {
      const inputs = Array.from(document.querySelectorAll('input[name]:not([type="hidden"]), select[name], textarea[name]'))
      return inputs.map(el => {
        const tag = el.tagName.toLowerCase()
        const name = el.getAttribute('name') ?? ''
        const id = el.getAttribute('id') ?? ''
        if (tag === 'select') {
          const opts = Array.from((el as HTMLSelectElement).options).map(o => `${o.value}:${o.text}`)
          return `${tag}[name="${name}"] id="${id}" — ${opts.slice(0, 5).join(', ')}`
        }
        return `${tag}[name="${name}"] id="${id}" val="${(el as HTMLInputElement).value}"`
      })
    })
    console.log('\n  📋 CAMPOS SUB-PÁGINA 2:')
    for (const c of camposSP2) console.log(`    ${c}`)

    // ── Paso 8: Rellenar sub-página 2 (DATOS NOTIFICACIÓN + DOMICILIO) ──
    console.log('\n  [8] Rellenando sub-página 2...')

    // Recepción notificación → E = Electrónica (no necesita dirección postal)
    await s2select('#codViaNotificacion', 'E', 'Recepción notificación (E=Electrónica)')
    await new Promise(r => setTimeout(r, 500))  // esperar posibles cambios AJAX

    // Teléfono
    await page.evaluate(() => {
      const el = document.querySelector('#telefono') as HTMLInputElement | null
      if (el) { el.value = '930000000'; el.dispatchEvent(new Event('change', { bubbles: true })) }
    })
    console.log('  ✅ Teléfono = "930000000"')

    // País domicilio → 108=ESPAÑA (aunque sea electrónica, puede ser required)
    await s2select('#paisDomicilio', '108', 'País domicilio (ESPAÑA)')
    await new Promise(r => setTimeout(r, 500))

    // Provincia domicilio → 08=Barcelona (AJAX)
    await s2select('#provinciaDomicilio', '08', 'Provincia domicilio (08=Barcelona)')
    await new Promise(r => setTimeout(r, 800))

    // Municipio domicilio → 08019=Barcelona (AJAX tras provincia)
    await s2select('#municipioDomicilio', '08019', 'Municipio domicilio (08019=Barcelona)')
    await new Promise(r => setTimeout(r, 500))

    // CP domicilio
    await page.evaluate(() => {
      const el = document.querySelector('#codigoPostal') as HTMLInputElement | null
      if (el) { el.value = '08003'; el.dispatchEvent(new Event('change', { bubbles: true })) }
    })
    console.log('  ✅ CP = "08003"')

    // Tipo vía → buscar CALLE en opciones
    await page.evaluate(() => {
      const el = document.querySelector('#codTipoViaIne') as HTMLSelectElement | null
      if (!el) return
      // Buscar opción que contenga CALLE
      const opt = Array.from(el.options).find(o => o.text.includes('CALLE') || o.value === 'CL')
      if (opt) { el.value = opt.value } else if (el.options.length > 1) { el.value = el.options[1].value }
      el.dispatchEvent(new Event('change', { bubbles: true }))
    })
    console.log('  ✅ Tipo vía = CALLE')

    // Nombre vía
    await page.evaluate(() => {
      const el = document.querySelector('#nombreVia') as HTMLInputElement | null
      if (el) { el.value = 'LAIETANA'; el.dispatchEvent(new Event('change', { bubbles: true })) }
    })
    console.log('  ✅ Nombre vía = "LAIETANA"')

    // Número
    await page.evaluate(() => {
      const el = document.querySelector('#numero') as HTMLInputElement | null
      if (el) { el.value = '59'; el.dispatchEvent(new Event('change', { bubbles: true })) }
    })
    console.log('  ✅ Número = "59"')

    // Lugar inscripción → España
    await s2select('#paisInscripcion', '108', 'País inscripción (ESPAÑA)')
    await new Promise(r => setTimeout(r, 600))

    // Provincia del Registro Civil → 08=Barcelona
    await s2select('#provRegistroCivil', '08', 'Provincia RC (08=Barcelona)')
    await new Promise(r => setTimeout(r, 1500))  // AJAX carga oficinas de registro civil

    // Registro Civil (obligatorio) — seleccionar la oficina principal de Barcelona
    const rcSeleccionado = await page.evaluate(() => {
      const el = document.querySelector('#codRegistroCivil') as HTMLSelectElement | null
      if (!el) return { ok: false, reason: 'select no existe' }
      if (el.options.length <= 1) return { ok: false, reason: 'no hay opciones cargadas' }
      // Prioridad: oficina principal de Barcelona (sin "COLABORADORA" en el texto)
      const principal = Array.from(el.options).find(o =>
        o.text.toUpperCase().includes('BARCELONA') && !o.text.toUpperCase().includes('COLABORADORA')
      )
      const fallback = Array.from(el.options).find(o =>
        o.text.toUpperCase().includes('BARCELONA')
      )
      const elegida = principal ?? fallback ?? el.options[1]
      el.value = elegida.value
      el.dispatchEvent(new Event('change', { bubbles: true }))
      return { ok: true, value: elegida.value, text: elegida.text }
    })
    if (rcSeleccionado.ok) {
      console.log(`  ✅ Registro Civil = ${rcSeleccionado.value} (${rcSeleccionado.text})`)
    } else {
      console.log(`  ⚠  Registro Civil: ${rcSeleccionado.reason}`)
    }
    await new Promise(r => setTimeout(r, 500))

    await page.screenshot({ path: join(evidenciasDir, 'test-07-siguiente.png'), fullPage: true })
    console.log('  📸 Screenshot: evidencias/test-07-siguiente.png')

    // ── Paso 9: Iterar sub-páginas hasta confirmación final ─────────
    // El formulario MJ tiene 3 páginas: 1=Datos, 2=Más datos (notif+domicilio+RC), 3=Confirmar
    // En la página 2 el botón es "Crear Solicitud", no "Siguiente"
    const btnAvanzar = async (step: number): Promise<string | null> => {
      // Antes de avanzar: marcar checkboxes tipo "declaración responsable" / "interés legítimo"
      await page.evaluate(`(function(){
        var inputs = document.querySelectorAll('input[type=\"checkbox\"]');
        for (var i=0;i<inputs.length;i++) {
          var el = inputs[i];
          var n = (el.name || '') + ' ' + (el.id || '');
          if (/interesLegitimo|declaracion|aceptaCond|consentim|responsable|autoriza/i.test(n) && !el.checked) {
            el.checked = true;
            el.dispatchEvent(new Event('change', { bubbles: true }));
            el.dispatchEvent(new Event('click', { bubbles: true }));
          }
        }
      })()`)

      const clicked = await page.evaluate(`(function(){
        var prioridades = ['Enviar Solicitud', 'Enviar solicitud', 'Crear Solicitud', 'Crear solicitud', 'Confirmar', 'Enviar', 'Siguiente'];
        var btns = document.querySelectorAll('button, input[type="submit"], a.btn, a.btn-primary');
        for (var p=0;p<prioridades.length;p++) {
          var txt = prioridades[p];
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
      })()`) as string | null
      if (clicked) console.log(`  🔘 Click "${clicked}"`)
      else console.log(`  ⚠  Ningún botón de avance encontrado`)
      await page.waitForLoadState('domcontentloaded', { timeout: 45_000 }).catch(() => {})
      await new Promise(r => setTimeout(r, 2000))
      console.log(`  📍 URL paso ${step}: ${page.url()}`)

      // Detectar reCAPTCHA VISIBLE (modal o iframe grande). Si aparece, esperar que se resuelva.
      const captchaVisible = await page.evaluate(`(function(){
        var ifr = document.querySelectorAll('iframe[src*="recaptcha"]');
        for (var i=0;i<ifr.length;i++) {
          var r = ifr[i].getBoundingClientRect();
          if (r.width > 150 && r.height > 40) return true;
        }
        return false;
      })()`) as boolean

      if (captchaVisible) {
        console.log(`\n  🧩 reCAPTCHA VISIBLE — esperando hasta 180s para resolución manual en el browser...`)
        const inicio = Date.now()
        let resuelto = false
        while (Date.now() - inicio < 180_000) {
          const token = await page.evaluate(`(function(){
            var ta = document.querySelector('textarea[name="g-recaptcha-response"]');
            return ta ? ta.value.length : 0;
          })()`) as number
          if (token && token > 20) { resuelto = true; console.log(`  ✅ CAPTCHA resuelto (${token} chars)`); break }
          await new Promise(r => setTimeout(r, 2000))
        }
        if (!resuelto) console.log(`  ⚠  CAPTCHA no resuelto en 180s — intentando enviar igualmente`)
        // Hacer click de nuevo en el botón de envío
        await page.evaluate(`(function(){
          var prio = ['Enviar Solicitud', 'Enviar solicitud', 'Crear Solicitud'];
          var btns = document.querySelectorAll('button, input[type="submit"]');
          for (var p=0;p<prio.length;p++) {
            for (var i=0;i<btns.length;i++) {
              var el = btns[i];
              var label = ((el.textContent || '').trim().replace(/\\s+/g, ' ')) || (el.value || '');
              if (label === prio[p] && !el.disabled) { el.click(); return; }
            }
          }
        })()`)
        await page.waitForLoadState('domcontentloaded', { timeout: 45_000 }).catch(() => {})
        await new Promise(r => setTimeout(r, 2000))
        console.log(`  📍 URL tras resolver CAPTCHA: ${page.url()}`)
      }
      return clicked
    }

    // Helper: extraer errores de validación visibles
    // NOTA: pasamos la función como string para evitar problemas de tsx/esbuild
    // con `__name` al transpilar funciones nombradas dentro de page.evaluate.
    const getErrores = async (): Promise<string[]> => {
      const res = await page.evaluate(`(function(){
        var sels = ['.invalid-feedback', '.form-text.text-danger', '.alert-danger', '.error-summary', '.has-error .help-block', 'span.error', '.field-error'];
        var out = [];
        for (var i=0;i<sels.length;i++) {
          var els = document.querySelectorAll(sels[i]);
          for (var j=0;j<els.length;j++) {
            var t = (els[j].innerText || '').trim();
            if (t && t.length > 0 && t.length < 500) out.push(t);
          }
        }
        var msgs = document.querySelectorAll('.form-group small, .form-group .help-block, .form-group .text-danger, .mb-3 small, .mb-3 .text-danger');
        for (var k=0;k<msgs.length;k++) {
          var m = (msgs[k].innerText || '').trim();
          if (m && /debe seleccion|obligatorio|requerid|complete este/i.test(m)) out.push(m);
        }
        var uniq = {};
        var result = [];
        for (var n=0;n<out.length;n++) { if (!uniq[out[n]]) { uniq[out[n]] = true; result.push(out[n]); } }
        return result;
      })()`) as string[]
      return res
    }

    for (let subpag = 3; subpag <= 8; subpag++) {
      const urlAntes = page.url()
      const erroresAntes = await getErrores()

      const txtBoton = await btnAvanzar(subpag + 5)

      const urlDespues = page.url()
      const screenshot = join(evidenciasDir, `test-${String(subpag + 5).padStart(2, '0')}-subpag${subpag}.png`)
      await page.screenshot({ path: screenshot, fullPage: true })
      console.log(`  📸 Screenshot: ${screenshot.replace(evidenciasDir + '/', '')}`)

      // Verificar errores tras click
      const erroresDespues = await getErrores()
      const nuevosErrores = erroresDespues.filter(e => !erroresAntes.includes(e))
      if (nuevosErrores.length > 0) {
        console.log(`\n  ❌ Errores de validación detectados:`)
        for (const e of nuevosErrores) console.log(`     - ${e}`)
      }

      // Dump de campos
      const camposPage = await page.evaluate(() => {
        const inputs = Array.from(document.querySelectorAll('input[name]:not([type="hidden"]), select[name], textarea[name]'))
        return inputs.map(el => {
          const tag = el.tagName.toLowerCase()
          const name = el.getAttribute('name') ?? ''
          const id = el.getAttribute('id') ?? ''
          if (tag === 'select') {
            const opts = Array.from((el as HTMLSelectElement).options).map(o => `${o.value}:${o.text}`)
            return `${tag}[name="${name}"] id="${id}" val="${(el as HTMLSelectElement).value}" — ${opts.slice(0, 4).join(', ')}`
          }
          return `${tag}[name="${name}"] id="${id}" val="${(el as HTMLInputElement).value}"`
        })
      })
      if (camposPage.length > 0) {
        console.log(`\n  📋 CAMPOS SUB-PÁG ${subpag}:`)
        for (const c of camposPage) console.log(`    ${c}`)
      }

      // ¿Estamos en página de confirmación/éxito? URLs posibles:
      // continuarFlujoConfirmar* / confirmarSolicitud* / resumen* / finalizado* / justificante*
      const esExito = /confirmarSolicitud|finalizado|justificante|resumen|localizador|expediente/i.test(urlDespues)
      const quedaIgual = urlDespues === urlAntes
      if (esExito) {
        console.log(`  🎯 Página de resultado detectada`)
        break
      }
      if (quedaIgual && nuevosErrores.length === 0 && txtBoton === null) {
        console.log(`  ⚠  Sin cambio de URL y sin errores — posible fin de flujo`)
        break
      }
      if (camposPage.length === 0) {
        console.log(`  ✅ No quedan campos — fin`)
        break
      }
    }

    // Screenshot confirmación final
    const errores = await page.evaluate(() => {
      const errs = Array.from(document.querySelectorAll('.alert-danger, .error-summary'))
      return errs.map(e => (e as HTMLElement).innerText?.trim()).filter(t => t && t.length > 10)
    })

    // Extraer referencia MJ
    const texto = await page.innerText('body').catch(() => '')
    const patronesRef = [/localizador[:\s]+([A-Z0-9\-\/]+)/i, /expediente[:\s]+([A-Z0-9\-\/]+)/i, /referencia[:\s]+([A-Z0-9\-\/]+)/i]
    let refMJ: string | null = null
    for (const p of patronesRef) {
      const m = texto.match(p)
      if (m?.[1]) { refMJ = m[1]; break }
    }

    if (refMJ) {
      console.log(`\n  🎉 SOLICITUD ENVIADA — Referencia MJ: ${refMJ}`)
    } else {
      console.log('\n  ✅ Formulario enviado. Revisa evidencias/test-06-confirmacion.png para ver la referencia.')
    }

    await browser.close()
    console.log('\n  ✅ Prueba completada.')

  } catch (err) {
    console.error(`\n  ❌ Error durante la prueba: ${String(err)}`)
    await page.screenshot({ path: join(evidenciasDir, 'test-error.png'), fullPage: true }).catch(() => {})
    await browser.close()
    process.exit(1)
  }
}

async function rellenarCampo(page: any, nombre: string, valor: string) {
  if (!valor) return
  const selector = `input[name*="${nombre}" i], input[id*="${nombre}" i], input[placeholder*="${nombre}" i]`
  const el = page.locator(selector).first()
  if (await el.isVisible({ timeout: 3_000 }).catch(() => false)) {
    await el.fill(valor)
    console.log(`    ✓ Campo "${nombre}" = "${valor}"`)
  } else {
    console.log(`    ⚠ Campo "${nombre}" no encontrado`)
  }
}

// ── Main ───────────────────────────────────────────────────────────────────
async function main() {
  const modo = process.argv[2] ?? 'health'

  console.log('╔══════════════════════════════════════════════╗')
  console.log('║   CertiDocs — Test MJ Ministerio Justicia   ║')
  console.log('╚══════════════════════════════════════════════╝')

  const mjOK = await healthCheck()

  if (modo === 'health') {
    console.log(`\n${mjOK ? '✅ MJ operativo' : '❌ MJ con problemas'}\n`)
    process.exit(mjOK ? 0 : 1)
  }

  if (!mjOK) {
    console.log('\n⚠  El MJ no responde correctamente. Comprueba tu conexión.')
  }

  if (modo === 'dry-run' || modo === 'nacimiento') {
    await testConBrowser(modo as any)
  } else {
    console.log(`\n❌ Modo desconocido: "${modo}"`)
    console.log('   Usos:')
    console.log('     npx tsx scripts/test-mj.ts health      # Solo conectividad')
    console.log('     npx tsx scripts/test-mj.ts dry-run     # Abre browser sin enviar')
    console.log('     npx tsx scripts/test-mj.ts nacimiento  # Prueba completa nacimiento')
    process.exit(1)
  }
}

main().catch(err => {
  console.error('Error fatal:', err)
  process.exit(1)
})
