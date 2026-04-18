/**
 * inspectar-formulario.ts — Inspecciona los campos del formulario MJ nacimiento (paso 1)
 */
import { chromium } from 'playwright-core'
import { writeFileSync, mkdirSync } from 'fs'
import { join } from 'path'

async function main() {
  const browser = await chromium.launch({ headless: true })
  const context = await browser.newContext({ locale: 'es-ES',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36'
  })
  const page = await context.newPage()

  const url = 'https://sede.mjusticia.gob.es/sereci/initDatosGenerales?idMateria=NAC&idtramite=102&lang=es_es&idpagina=1215197884559'
  console.log(`\nInspeccionando formulario: ${url}\n`)

  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30_000 })
  await new Promise(r => setTimeout(r, 1000))

  // Todos los selects
  const selects = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('select')).map(s => ({
      name: s.name || s.id || '(sin nombre)',
      label: s.closest('div, td, label')?.querySelector('label')?.textContent?.trim()
        || s.getAttribute('aria-label') || '',
      options: Array.from(s.options).map(o => ({ value: o.value, text: o.text.trim() }))
    }))
  })

  console.log('=== SELECTS EN EL FORMULARIO ===')
  for (const sel of selects) {
    console.log(`\nSELECT: name="${sel.name}"  label="${sel.label}"`)
    for (const opt of sel.options) {
      console.log(`  [${opt.value}] ${opt.text}`)
    }
  }

  // Todos los inputs
  const inputs = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('input, textarea')).map(el => ({
      type: (el as HTMLInputElement).type || 'text',
      name: (el as HTMLInputElement).name || el.id || '(sin nombre)',
      placeholder: (el as HTMLInputElement).placeholder || '',
      label: el.closest('div, td')?.querySelector('label')?.textContent?.trim() || '',
    }))
  })

  console.log('\n=== INPUTS EN EL FORMULARIO ===')
  for (const inp of inputs) {
    if (inp.type === 'hidden') continue
    console.log(`  [${inp.type}] name="${inp.name}"  label="${inp.label}"  placeholder="${inp.placeholder}"`)
  }

  // Screenshot
  const dir = join(__dirname, '..', 'evidencias')
  mkdirSync(dir, { recursive: true })
  await page.screenshot({ path: join(dir, 'formulario-paso1.png'), fullPage: true })
  console.log('\n📸 Screenshot: evidencias/formulario-paso1.png')

  await browser.close()
}

main().catch(err => { console.error(err); process.exit(1) })
