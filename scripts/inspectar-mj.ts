/**
 * inspectar-mj.ts — Inspecciona la estructura HTML del MJ para encontrar los selectores correctos
 * Ejecutar: npx tsx scripts/inspectar-mj.ts
 */

import { readFileSync, existsSync, mkdirSync } from 'fs'
import { resolve, join } from 'path'

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

async function main() {
  const browser = await chromium.launch({ headless: true })
  const context = await browser.newContext({
    locale: 'es-ES',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36',
  })
  const page = await context.newPage()

  const url = 'https://sede.mjusticia.gob.es/es/tramites/certificado-nacimiento'
  console.log(`\nInspeccionando: ${url}\n`)

  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30_000 })

  // Aceptar cookies
  const cookies = page.locator('button').filter({ hasText: /aceptar|accept/i })
  if (await cookies.first().isVisible({ timeout: 3_000 }).catch(() => false)) {
    await cookies.first().click()
    await new Promise(r => setTimeout(r, 500))
  }

  // Extraer todos los links y botones
  console.log('=== TODOS LOS LINKS Y BOTONES ===\n')
  const elementos = await page.evaluate(() => {
    const items: { tag: string; text: string; href?: string; id?: string; class?: string }[] = []
    document.querySelectorAll('a, button').forEach(el => {
      const text = el.textContent?.trim().slice(0, 100) ?? ''
      if (text.length < 2) return
      items.push({
        tag: el.tagName.toLowerCase(),
        text,
        href: (el as any).href ?? undefined,
        id: el.id || undefined,
        class: el.className?.slice(0, 80) || undefined,
      })
    })
    return items
  })

  for (const el of elementos) {
    console.log(`[${el.tag}] "${el.text}"`)
    if (el.href && !el.href.includes('javascript')) console.log(`       href: ${el.href}`)
    if (el.id) console.log(`       id: ${el.id}`)
    if (el.class) console.log(`       class: ${el.class}`)
  }

  // Extraer estructura de acordeones / secciones colapsables
  console.log('\n=== ACORDEONES / SECCIONES COLAPSABLES ===\n')
  const acordeones = await page.evaluate(() => {
    const results: { selector: string; text: string; tag: string }[] = []
    const posibles = document.querySelectorAll('[data-toggle], [data-bs-toggle], [aria-expanded], [aria-controls], .accordion, .collapse-toggle, .panel-heading a')
    posibles.forEach(el => {
      results.push({
        selector: el.tagName + (el.id ? '#' + el.id : '') + (el.className ? '.' + el.className.split(' ')[0] : ''),
        text: el.textContent?.trim().slice(0, 100) ?? '',
        tag: el.tagName.toLowerCase(),
      })
    })
    return results
  })

  if (acordeones.length === 0) {
    console.log('No se encontraron elementos colapsables estándar.')
    console.log('Buscando headings y divs con texto relevante...\n')

    const headings = await page.evaluate(() => {
      const results: { tag: string; text: string; parent: string }[] = []
      document.querySelectorAll('h1, h2, h3, h4, h5, h6, .title, .heading').forEach(el => {
        const text = el.textContent?.trim() ?? ''
        if (text.length < 2) return
        results.push({
          tag: el.tagName,
          text: text.slice(0, 120),
          parent: el.parentElement?.tagName + '.' + (el.parentElement?.className?.split(' ')[0] ?? ''),
        })
      })
      return results
    })

    for (const h of headings) {
      console.log(`[${h.tag}] "${h.text}" (en: ${h.parent})`)
    }
  } else {
    for (const a of acordeones) {
      console.log(`[${a.tag}] "${a.text}"`)
      console.log(`       selector: ${a.selector}`)
    }
  }

  // Guardar HTML completo para inspección
  const html = await page.content()
  const dir = join(__dirname, '..', 'evidencias')
  mkdirSync(dir, { recursive: true })
  const htmlPath = join(dir, 'mj-nacimiento.html')
  const { writeFileSync } = await import('fs')
  writeFileSync(htmlPath, html)
  console.log(`\n✅ HTML completo guardado en: ${htmlPath}`)
  console.log('   Ábrelo en el navegador para inspeccionar la estructura completa.')

  await browser.close()
}

main().catch(err => {
  console.error('Error:', err)
  process.exit(1)
})
