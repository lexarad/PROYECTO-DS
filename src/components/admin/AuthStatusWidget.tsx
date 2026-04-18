import { detectarMetodoAuth } from '@/lib/automatizacion/forms/base'

const METODO_LABEL: Record<string, string> = {
  clavepin: 'Cl@ve Permanente',
  dnie:     'DNI Electrónico',
  pkcs12:   'Certificado PKCS#12',
  anonimo:  'Sin autenticación',
}

const METODO_COLOR: Record<string, string> = {
  clavepin: 'bg-green-100 text-green-800 border-green-200',
  dnie:     'bg-blue-100 text-blue-800 border-blue-200',
  pkcs12:   'bg-purple-100 text-purple-800 border-purple-200',
  anonimo:  'bg-yellow-100 text-yellow-800 border-yellow-200',
}

interface Credential {
  label: string
  ok: boolean
}

export function AuthStatusWidget() {
  const metodo = detectarMetodoAuth()

  const creds: Credential[] = [
    {
      label: 'CLAVEPIN_USER',
      ok: !!process.env.CLAVEPIN_USER,
    },
    {
      label: 'CLAVEPIN_PASS',
      ok: !!process.env.CLAVEPIN_PASS,
    },
    {
      label: 'CLAVEPIN_TOTP_SECRET',
      ok: !!process.env.CLAVEPIN_TOTP_SECRET,
    },
    {
      label: 'CERT_P12_BASE64',
      ok: !!process.env.CERT_P12_BASE64,
    },
    {
      label: 'CERT_P12_PASSWORD',
      ok: !!process.env.CERT_P12_PASSWORD,
    },
    {
      label: 'DNIE_ENABLED',
      ok: process.env.DNIE_ENABLED === 'true',
    },
  ]

  const dryRun = process.env.AUTOMATION_DRY_RUN === 'true'

  return (
    <div className="card p-4 space-y-3">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-gray-700">Método de autenticación activo</span>
          {dryRun && (
            <span className="text-xs bg-orange-100 text-orange-700 border border-orange-200 px-2 py-0.5 rounded-full font-medium">
              DRY-RUN
            </span>
          )}
        </div>
        <span className={`text-sm font-semibold px-3 py-1 rounded-full border ${METODO_COLOR[metodo]}`}>
          {METODO_LABEL[metodo]}
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-1">
        {creds.map(c => (
          <div key={c.label} className="flex items-center gap-1.5 text-xs text-gray-600">
            <span className={c.ok ? 'text-green-500' : 'text-gray-300'}>
              {c.ok ? '●' : '○'}
            </span>
            <span className="font-mono">{c.label}</span>
          </div>
        ))}
      </div>

      {metodo === 'anonimo' && (
        <p className="text-xs text-yellow-700 bg-yellow-50 border border-yellow-200 rounded px-3 py-2">
          Sin credenciales configuradas. Los trámites con certificado o Cl@ve no podrán ejecutarse automáticamente.
          Configura las variables de entorno para activar la automatización completa.
        </p>
      )}
    </div>
  )
}
