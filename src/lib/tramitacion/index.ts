import { Resend } from 'resend'
import { TipoCertificado } from '@prisma/client'
import { getCertificado } from '@/lib/certificados'

let resendInstance: Resend | null = null

function getResend() {
  if (!resendInstance) {
    resendInstance = new Resend(process.env.RESEND_API_KEY || 're_placeholder_for_build')
  }
  return resendInstance
}

const FROM = process.env.EMAIL_FROM ?? 'CertiDocs <noreply@certidocs.es>'
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? 'info@certidocs.es'
const BASE_URL = process.env.NEXTAUTH_URL ?? 'https://certidocs-xi.vercel.app'

// URLs de tramitación de cada organismo
const ENLACES_TRAMITACION: Record<TipoCertificado, { url: string; organismo: string; instrucciones: string }> = {
  NACIMIENTO: {
    url: 'https://sede.mjusticia.gob.es/tramites/certificado-nacimiento',
    organismo: 'Ministerio de Justicia — Registro Civil',
    instrucciones: 'Accede al formulario, selecciona "Certificado Literal" y rellena los datos del solicitante.',
  },
  MATRIMONIO: {
    url: 'https://sede.mjusticia.gob.es/tramites/certificado-matrimonio',
    organismo: 'Ministerio de Justicia — Registro Civil',
    instrucciones: 'Accede al formulario y rellena los datos de ambos cónyuges tal como aparecen en el pedido.',
  },
  DEFUNCION: {
    url: 'https://sede.mjusticia.gob.es/tramites/certificado-defuncion',
    organismo: 'Ministerio de Justicia — Registro Civil',
    instrucciones: 'Accede al formulario y rellena los datos del fallecido. Indica la dirección de CertiDocs como dirección de envío.',
  },
  EMPADRONAMIENTO: {
    url: 'https://www.google.com/search?q=certificado+empadronamiento+online+ayuntamiento',
    organismo: 'Ayuntamiento del municipio indicado',
    instrucciones: 'Busca la sede electrónica del ayuntamiento del municipio indicado en los datos. Cada ayuntamiento tiene su propio trámite.',
  },
  ANTECEDENTES_PENALES: {
    url: 'https://sede.mjusticia.gob.es/tramites/certificado-antecedentes-penales',
    organismo: 'Ministerio de Justicia',
    instrucciones: 'Accede al formulario con los datos del solicitante. Este certificado requiere identificación del interesado.',
  },
  VIDA_LABORAL: {
    url: 'https://portal.seg-social.gob.es/wps/portal/importass/importass/Ciudadanos/vidaLaboral',
    organismo: 'Seguridad Social',
    instrucciones: 'Este trámite requiere las credenciales del interesado (CL@VE). Contactar con el cliente para obtener autorización o solicitar que lo gestione él mismo.',
  },
  ULTIMAS_VOLUNTADES: {
    url: 'https://sede.mjusticia.gob.es/tramites/certificado-ultimas-voluntades',
    organismo: 'Ministerio de Justicia — Registro General de Actos de Última Voluntad',
    instrucciones: 'Accede al formulario con los datos del fallecido. Necesaria la fecha de defunción. El certificado se emite en 15 días hábiles.',
  },
  SEGUROS_FALLECIMIENTO: {
    url: 'https://sede.mjusticia.gob.es/tramites/certificado-contratos-seguros',
    organismo: 'Ministerio de Justicia — Registro de Contratos de Seguros de Cobertura de Fallecimiento',
    instrucciones: 'Accede al formulario con los datos del fallecido. Necesaria la fecha de defunción. El certificado se emite en 15 días hábiles.',
  },
}

interface DatosTramitacion {
  solicitudId: string
  referencia: string
  tipo: TipoCertificado
  datos: Record<string, unknown>
  precio: number
  emailCliente: string | null
  nombreCliente: string | null
  facturaNumero?: string
  planCliente?: string
}

function formatearDatos(datos: Record<string, unknown>, tipo: TipoCertificado): string {
  const config = getCertificado(tipo)
  const labelMap: Record<string, string> = {}
  if (config) {
    for (const campo of config.campos) {
      labelMap[campo.nombre] = campo.label
    }
  }
  return Object.entries(datos)
    .map(([k, v]) => {
      const label = labelMap[k] ?? k.replace(/([A-Z])/g, ' $1').toLowerCase()
      return `<tr><td style="padding:4px 12px 4px 0;color:#6b7280;font-size:13px">${label}</td><td style="padding:4px 0;font-size:13px;font-weight:600">${v ?? '—'}</td></tr>`
    })
    .join('')
}

export async function notificarNuevaTramitacion(datos: DatosTramitacion) {
  const enlace = ENLACES_TRAMITACION[datos.tipo]
  const urlAdmin = `${BASE_URL}/admin/solicitudes/${datos.solicitudId}`

  await getResend().emails.send({
    from: FROM,
    to: ADMIN_EMAIL,
    subject: `🔔 Nuevo encargo — ${datos.referencia} (${datos.tipo.replace(/_/g, ' ')})`,
    html: `
      <div style="font-family:sans-serif;max-width:620px;margin:0 auto;color:#111">
        <div style="background:#1d4ed8;padding:20px 24px;border-radius:8px 8px 0 0">
          <h2 style="color:#fff;margin:0;font-size:18px">Nuevo encargo de certificado</h2>
          <p style="color:#bfdbfe;margin:4px 0 0;font-size:13px">Pago confirmado · Tramitación pendiente</p>
        </div>

        <div style="background:#f8fafc;padding:20px 24px;border:1px solid #e2e8f0;border-top:none">

          <table style="width:100%;border-collapse:collapse;margin-bottom:16px">
            <tr>
              <td style="padding:4px 12px 4px 0;color:#6b7280;font-size:13px">Referencia</td>
              <td style="padding:4px 0;font-size:14px;font-weight:700;font-family:monospace">${datos.referencia}</td>
            </tr>
            <tr>
              <td style="padding:4px 12px 4px 0;color:#6b7280;font-size:13px">Tipo</td>
              <td style="padding:4px 0;font-size:13px;font-weight:600">${datos.tipo.replace(/_/g, ' ')}</td>
            </tr>
            <tr>
              <td style="padding:4px 12px 4px 0;color:#6b7280;font-size:13px">Importe</td>
              <td style="padding:4px 0;font-size:13px;font-weight:600">${datos.precio.toFixed(2)} €</td>
            </tr>
            <tr>
              <td style="padding:4px 12px 4px 0;color:#6b7280;font-size:13px">Cliente</td>
              <td style="padding:4px 0;font-size:13px">${datos.nombreCliente ?? '—'} · ${datos.emailCliente ?? '—'}</td>
            </tr>
            ${datos.planCliente ? `<tr>
              <td style="padding:4px 12px 4px 0;color:#6b7280;font-size:13px">Plan cliente</td>
              <td style="padding:4px 0;font-size:13px;font-weight:600">${datos.planCliente}</td>
            </tr>` : ''}
            ${datos.facturaNumero ? `<tr>
              <td style="padding:4px 12px 4px 0;color:#6b7280;font-size:13px">Factura</td>
              <td style="padding:4px 0;font-size:13px;font-family:monospace">${datos.facturaNumero}</td>
            </tr>` : ''}
          </table>

          <hr style="border:none;border-top:1px solid #e2e8f0;margin:16px 0"/>

          <h3 style="font-size:14px;color:#374151;margin:0 0 10px">Datos del certificado</h3>
          <table style="width:100%;border-collapse:collapse">
            ${formatearDatos(datos.datos as Record<string, unknown>, datos.tipo)}
          </table>

          <hr style="border:none;border-top:1px solid #e2e8f0;margin:16px 0"/>

          <h3 style="font-size:14px;color:#374151;margin:0 0 8px">Tramitación</h3>
          <p style="font-size:13px;color:#374151;margin:0 0 6px"><strong>Organismo:</strong> ${enlace.organismo}</p>
          <p style="font-size:13px;color:#6b7280;margin:0 0 12px">${enlace.instrucciones}</p>

          <a href="${enlace.url}" target="_blank"
             style="display:inline-block;background:#1d4ed8;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none;font-size:13px;font-weight:600;margin-right:8px">
            Ir al formulario oficial →
          </a>
          <a href="${urlAdmin}"
             style="display:inline-block;background:#f1f5f9;color:#374151;padding:10px 20px;border-radius:6px;text-decoration:none;font-size:13px;font-weight:600">
            Ver en panel admin
          </a>
        </div>

        <p style="font-size:11px;color:#9ca3af;padding:12px 0;text-align:center">
          CertiDocs · Via Laietana 59, 4.º 1.ª, 08003 Barcelona
        </p>
      </div>
    `,
  })
}
