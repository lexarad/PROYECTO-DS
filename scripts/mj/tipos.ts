import { Page } from 'playwright'

export interface DatosSolicitud {
  id: string
  referencia: string
  tipo: string
  datos: Record<string, string>
  precio: number
  emailCliente: string | null
  nombreCliente: string | null
}

export interface ResultadoTramitacion {
  ok: boolean
  referenciaMJ?: string   // número de justificante del MJ
  error?: string
}

export interface TramitadorCertificado {
  tramitar(page: Page, solicitud: DatosSolicitud): Promise<ResultadoTramitacion>
}

// Helpers comunes
export async function esperarYClickar(page: Page, selector: string, timeout = 10000) {
  await page.waitForSelector(selector, { timeout })
  await page.click(selector)
}

export async function rellenarCampo(page: Page, selector: string, valor: string) {
  await page.waitForSelector(selector, { timeout: 10000 })
  await page.fill(selector, valor)
}

// Formatea fecha de "YYYY-MM-DD" a "DD/MM/YYYY" que usa el MJ
export function formatFechaMJ(fechaIso: string): string {
  if (!fechaIso) return ''
  const [y, m, d] = fechaIso.split('-')
  return `${d}/${m}/${y}`
}

// Pausa visible para que el usuario pueda resolver captchas o revisar
export async function pausaUsuario(page: Page, mensaje: string, segundos = 60) {
  console.log(`\n⏸️  ${mensaje}`)
  console.log(`   Tienes ${segundos} segundos. Pulsa Intro para continuar antes si ya está listo.`)
  await Promise.race([
    page.waitForTimeout(segundos * 1000),
    new Promise<void>((resolve) => {
      process.stdin.once('data', () => resolve())
    }),
  ])
}
