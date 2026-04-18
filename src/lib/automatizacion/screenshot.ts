import { Page } from 'playwright-core'
import { put } from '@vercel/blob'
import { JobLogger } from './logger'

export async function capturarPantalla(
  page: Page,
  jobId: string,
  paso: string,
  logger: JobLogger
): Promise<string | null> {
  try {
    const buffer = await page.screenshot({ fullPage: false, type: 'png' })
    const nombre = `automatizacion/${jobId}/${paso}-${Date.now()}.png`

    if (process.env.BLOB_READ_WRITE_TOKEN) {
      const blob = await put(nombre, buffer, { access: 'public' })
      logger.log(`Screenshot guardado: ${blob.url}`)
      return blob.url
    }

    // En desarrollo sin Blob: guardar en /tmp o simplemente loguear
    logger.log(`Screenshot (sin Blob): ${nombre} — ${buffer.length} bytes`)
    return null
  } catch (err) {
    logger.error(`Error capturando screenshot en paso "${paso}": ${err}`)
    return null
  }
}

export async function aceptarCookies(page: Page, logger: JobLogger) {
  try {
    const botones = [
      page.getByRole('button', { name: /aceptar|accept|entendido|agree/i }),
      page.locator('#onetrust-accept-btn-handler'),
      page.locator('.cookie-accept'),
      page.locator('[data-testid="accept-cookies"]'),
    ]
    for (const btn of botones) {
      if (await btn.isVisible({ timeout: 2000 }).catch(() => false)) {
        await btn.click()
        logger.log('Cookies aceptadas')
        return
      }
    }
  } catch {
    // No había banner de cookies
  }
}
