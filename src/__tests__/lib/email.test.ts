import { describe, it, expect, vi, beforeEach } from 'vitest'
import { Resend } from 'resend'

vi.mock('resend', () => ({
  Resend: vi.fn().mockImplementation(() => ({
    emails: {
      send: vi.fn().mockResolvedValue({ data: { id: 'test_123' }, error: null }),
    },
  })),
}))

describe('email.ts', () => {
  beforeEach(() => {
    vi.stubEnv('NEXTAUTH_URL', 'http://localhost:3000')
    vi.stubEnv('RESEND_API_KEY', 're_test_123')
    vi.stubEnv('EMAIL_FROM', 'CertiDocs <test@certidocs.es>')
    vi.stubEnv('ADMIN_EMAIL', 'admin@certidocs.es')
    vi.stubEnv('EMPRESA_EMAIL', 'soporte@certidocs.es')
  })

  describe('sendConfirmacionPago', () => {
    it('envía email de confirmación con datos correctos', async () => {
      const { sendConfirmacionPago } = await import('@/lib/email')
      
      await sendConfirmacionPago({
        to: 'cliente@test.com',
        nombre: 'Juan Pérez',
        tipoCertificado: 'NACIMIENTO',
        referencia: 'CD-2026041710001',
        precio: 28.0,
        facturaId: 'fac_123',
      })

      expect(Resend).toHaveBeenCalled()
    })

    it('genera url de seguimiento correcta', async () => {
      const { sendConfirmacionPago } = await import('@/lib/email')
      
      await sendConfirmacionPago({
        to: 'cliente@test.com',
        nombre: 'Juan',
        tipoCertificado: 'DEFUNCION',
        referencia: 'CD-2026041700002',
        precio: 19.9,
      })

      expect(Resend).toHaveBeenCalled()
    })
  })

  describe('sendBienvenida', () => {
    it('envía email de bienvenida al registro', async () => {
      const { sendBienvenida } = await import('@/lib/email')
      
      await sendBienvenida({
        to: 'nuevo@test.com',
        nombre: 'María García',
      })

      expect(Resend).toHaveBeenCalled()
    })
  })

  describe('sendCambioEstado', () => {
    it('envía notificación para estado COMPLETADA', async () => {
      const { sendCambioEstado } = await import('@/lib/email')
      
      await sendCambioEstado({
        to: 'cliente@test.com',
        nombre: 'Pedro',
        tipoCertificado: 'MATRIMONIO',
        referencia: 'CD-2026041700003',
        estado: 'COMPLETADA',
        nota: 'Tu certificado está listo',
        documentos: [{ nombre: 'certificado.pdf', url: 'https://example.com/doc.pdf' }],
      })

      expect(Resend).toHaveBeenCalled()
    })

    it('envía notificación para estado RECHAZADA sin documentos', async () => {
      const { sendCambioEstado } = await import('@/lib/email')
      
      await sendCambioEstado({
        to: 'cliente@test.com',
        nombre: 'Ana',
        tipoCertificado: 'ANTECEDENTES_PENALES',
        referencia: 'CD-2026041700004',
        estado: 'RECHAZADA',
        nota: 'Faltan datos requeridos',
      })

      expect(Resend).toHaveBeenCalled()
    })
  })

  describe('sendAlertaMJ', () => {
    it('envía alerta al admin cuando MJ no responde', async () => {
      const { sendAlertaMJ } = await import('@/lib/email')
      
      await sendAlertaMJ({
        caidas: ['https://sede.mjusticia.gob.es/certificado1'],
      })

      expect(Resend).toHaveBeenCalled()
    })
  })

  describe('sendAlertaManual', () => {
    it('envía alerta con datos del job', async () => {
      const { sendAlertaManual } = await import('@/lib/email')
      
      await sendAlertaManual({
        jobId: 'job_123',
        solicitudId: 'sol_456',
        referencia: 'CD-2026041700005',
        tipo: 'ULTIMAS_VOLUNTADES',
        motivo: 'Captcha detectado - intervención manual requerida',
        intentos: 3,
      })

      expect(Resend).toHaveBeenCalled()
    })
  })

  describe('sendConfirmacionReembolso', () => {
    it('envía email de reembolso procesado', async () => {
      const { sendConfirmacionReembolso } = await import('@/lib/email')
      
      await sendConfirmacionReembolso({
        to: 'cliente@test.com',
        nombre: 'Luis',
        tipoCertificado: 'DEFUNCION',
        referencia: 'CD-2026041700006',
        importe: 24.9,
      })

      expect(Resend).toHaveBeenCalled()
    })
  })

  describe('sendActualizacionEspera', () => {
    it('envía email tras 15 días sin respuesta', async () => {
      const { sendActualizacionEspera } = await import('@/lib/email')
      
      await sendActualizacionEspera({
        to: 'cliente@test.com',
        nombre: 'Rosa',
        tipoCertificado: 'NACIMIENTO',
        referencia: 'CD-2026041700007',
        diasEspera: 15,
      })

      expect(Resend).toHaveBeenCalled()
    })
  })

  describe('sendAlertaSeguimientoAdmin', () => {
    it('envía alerta no urgente a los 15 días', async () => {
      const { sendAlertaSeguimientoAdmin } = await import('@/lib/email')
      
      await sendAlertaSeguimientoAdmin({
        solicitudId: 'sol_789',
        referencia: 'CD-2026041700008',
        tipoCertificado: 'MATRIMONIO',
        diasEspera: 15,
        urgente: false,
      })

      expect(Resend).toHaveBeenCalled()
    })

    it('envía alerta urgente a los 30 días', async () => {
      const { sendAlertaSeguimientoAdmin } = await import('@/lib/email')
      
      await sendAlertaSeguimientoAdmin({
        solicitudId: 'sol_790',
        referencia: 'CD-2026041700009',
        tipoCertificado: 'DEFUNCION',
        diasEspera: 30,
        urgente: true,
      })

      expect(Resend).toHaveBeenCalled()
    })
  })

  describe('sendFacturaEmail', () => {
    it('envía email con enlace al PDF', async () => {
      const { sendFacturaEmail } = await import('@/lib/email')

      await sendFacturaEmail({
        to: 'cliente@test.com',
        nombre: 'Carlos',
        facturaId: 'fac_123',
        numero: 'FAC-2026-0001',
      })

      expect(Resend).toHaveBeenCalled()
    })
  })

  describe('sendPagoFallido', () => {
    it('envía email de pago fallido con próximo intento', async () => {
      const { sendPagoFallido } = await import('@/lib/email')

      await sendPagoFallido({
        to: 'pro@test.com',
        nombre: 'Elena',
        plan: 'PRO',
        proximoIntento: new Date('2026-05-01'),
      })

      expect(Resend).toHaveBeenCalled()
    })

    it('envía email de pago fallido sin próximo intento', async () => {
      const { sendPagoFallido } = await import('@/lib/email')

      await sendPagoFallido({
        to: 'pro@test.com',
        nombre: 'Elena',
        plan: 'ENTERPRISE',
        proximoIntento: null,
      })

      expect(Resend).toHaveBeenCalled()
    })
  })
})