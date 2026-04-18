import 'dotenv/config'

export const config = {
  apiUrl: process.env.CERTIDOCS_URL ?? 'https://certidocs-xi.vercel.app',
  apiKey: process.env.CERTIDOCS_API_KEY ?? '',
  // Ruta al archivo .p12 del certificado digital (solo necesario para antecedentes penales)
  certPath: process.env.CERT_PATH ?? '',
  certPassword: process.env.CERT_PASSWORD ?? '',
  // true = abrir navegador visible (recomendado para poder resolver captchas)
  headless: process.env.HEADLESS === 'true',
  // Segundos de pausa entre solicitudes para no sobrecargar el servidor
  pauseEntreSolicitudes: 8,
}

if (!config.apiKey) {
  console.error('❌ Falta CERTIDOCS_API_KEY en el archivo .env')
  process.exit(1)
}
