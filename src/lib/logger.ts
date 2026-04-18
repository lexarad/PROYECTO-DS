/**
 * Logger PRODUCCIÓN
 * Solo muestra warnings y errores en producción
 * Deshabilita logs en Vercel Edge Functions para evitar costes
 */

const IS_PRODUCTION = process.env.NODE_ENV === 'production'
const LOG_LEVEL = process.env.LOG_LEVEL ?? (IS_PRODUCTION ? 'warn' : 'debug')

const LEVELS = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
  silent: 4,
}

const levelValue = LEVELS[LOG_LEVEL as keyof typeof LEVELS] ?? LEVELS.info

function shouldLog(level: keyof typeof LEVELS): boolean {
  return LEVELS[level] >= levelValue
}

export const logger = {
  debug: (...args: unknown[]) => {
    if (shouldLog('debug')) console.debug(`[DEBUG]`, ...args)
  },
  info: (...args: unknown[]) => {
    if (shouldLog('info')) console.info(`[INFO]`, ...args)
  },
  warn: (...args: unknown[]) => {
    if (shouldLog('warn')) console.warn(`[WARN]`, ...args)
  },
  error: (...args: unknown[]) => {
    if (shouldLog('error')) console.error(`[ERROR]`, ...args)
  },
}

/**
 * Captura de errores global producción
 */
export function captureError(error: unknown, context?: Record<string, unknown>) {
  logger.error('ERROR CAPTURADO', error, context)

  if (IS_PRODUCTION && process.env.SENTRY_DSN) {
    // Integrar Sentry aquí cuando esté configurado
  }
}