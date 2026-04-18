import { describe, it, expect } from 'vitest'

// Tests de lógica de los crons — sin instanciar Resend
describe('cron recordatorios — ventanas de tiempo', () => {
  it('primera ventana: solicitudes entre 24h y 36h', () => {
    const desde = 24
    const hasta = 36
    // Solicitud de hace 30h → dentro de la ventana
    const msHace30h = Date.now() - 30 * 60 * 60 * 1000
    const createdAt = new Date(msHace30h)
    const enVentana = createdAt >= new Date(Date.now() - hasta * 3_600_000)
                   && createdAt <= new Date(Date.now() - desde * 3_600_000)
    expect(enVentana).toBe(true)
  })

  it('segunda ventana: solicitudes entre 72h y 84h', () => {
    const desde = 72
    const hasta = 84
    const msHace78h = Date.now() - 78 * 60 * 60 * 1000
    const createdAt = new Date(msHace78h)
    const enVentana = createdAt >= new Date(Date.now() - hasta * 3_600_000)
                   && createdAt <= new Date(Date.now() - desde * 3_600_000)
    expect(enVentana).toBe(true)
  })

  it('fuera de ventana: solicitud de hace 5h → no envía', () => {
    const desde = 24
    const hasta = 36
    const msHace5h = Date.now() - 5 * 60 * 60 * 1000
    const createdAt = new Date(msHace5h)
    const enVentana = createdAt >= new Date(Date.now() - hasta * 3_600_000)
                   && createdAt <= new Date(Date.now() - desde * 3_600_000)
    expect(enVentana).toBe(false)
  })
})

describe('cron seguimiento-tramitados — umbrales', () => {
  const DIAS_AVISO_CLIENTE  = 15
  const DIAS_ALERTA_URGENTE = 30

  it('día 16 → dentro del umbral de aviso al cliente', () => {
    const diasEspera = 16
    const enUmbral = diasEspera >= DIAS_AVISO_CLIENTE && diasEspera < DIAS_AVISO_CLIENTE + 2
    expect(enUmbral).toBe(true)
  })

  it('día 31 → dentro del umbral urgente', () => {
    const diasEspera = 31
    const urgente = diasEspera >= DIAS_ALERTA_URGENTE && diasEspera < DIAS_ALERTA_URGENTE + 2
    expect(urgente).toBe(true)
  })

  it('día 10 → fuera de ambos umbrales', () => {
    const diasEspera = 10
    const enUmbral15 = diasEspera >= DIAS_AVISO_CLIENTE && diasEspera < DIAS_AVISO_CLIENTE + 2
    const enUmbral30 = diasEspera >= DIAS_ALERTA_URGENTE && diasEspera < DIAS_ALERTA_URGENTE + 2
    expect(enUmbral15).toBe(false)
    expect(enUmbral30).toBe(false)
  })
})

describe('cron limpiar-abandonadas', () => {
  it('solicitud de hace 8 días → supera el umbral de 7 días', () => {
    const DIAS_EXPIRAR = 7
    const hace8d = new Date(Date.now() - 8 * 24 * 60 * 60 * 1000)
    const limite = new Date(Date.now() - DIAS_EXPIRAR * 24 * 60 * 60 * 1000)
    expect(hace8d.getTime()).toBeLessThanOrEqual(limite.getTime())
  })

  it('solicitud de hace 5 días → NO supera el umbral', () => {
    const DIAS_EXPIRAR = 7
    const hace5d = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)
    const limite = new Date(Date.now() - DIAS_EXPIRAR * 24 * 60 * 60 * 1000)
    expect(hace5d.getTime()).toBeGreaterThan(limite.getTime())
  })
})
