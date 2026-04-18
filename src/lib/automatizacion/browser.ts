import { chromium, Browser } from 'playwright-core'
import { tieneConfigDnie, getArgsDnie } from './auth/dnie'

let _browser: Browser | null = null

export async function getBrowser(): Promise<Browser> {
  // Reuse only if still connected; reset stale reference otherwise
  if (_browser?.isConnected()) return _browser
  if (_browser) _browser = null

  // Args adicionales si se usa DNIe (almacén del sistema)
  const dnieArgs = tieneConfigDnie() ? getArgsDnie() : []

  if (process.env.NODE_ENV === 'production') {
    // Vercel production: usar @sparticuz/chromium-min
    const chromiumPkg = await import('@sparticuz/chromium-min' as string).catch(() => null)
    if (chromiumPkg) {
      const execPath = await chromiumPkg.default.executablePath(
        process.env.CHROMIUM_REMOTE_EXEC_PATH ??
        'https://github.com/Sparticuz/chromium/releases/download/v131.0.0/chromium-v131.0.0-pack.tar'
      )
      _browser = await chromium.launch({
        args: [...chromiumPkg.default.args, ...dnieArgs],
        executablePath: execPath,
        headless: true,
      })
      return _browser
    }
  }

  // Desarrollo: usar Chromium de @playwright/test
  _browser = await chromium.launch({
    headless: process.env.AUTOMATION_HEADLESS !== 'false',
    slowMo: process.env.AUTOMATION_SLOW_MO ? parseInt(process.env.AUTOMATION_SLOW_MO) : 50,
    args: dnieArgs,
  })

  return _browser
}

export async function closeBrowser() {
  if (_browser) {
    await _browser.close()
    _browser = null
  }
}
