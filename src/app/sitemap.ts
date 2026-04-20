import { MetadataRoute } from 'next'
import { CERTIFICADOS } from '@/lib/certificados'

const BASE = process.env.NEXTAUTH_URL ?? 'https://certidocs.es'

export default function sitemap(): MetadataRoute.Sitemap {
  const certificadosUrls = CERTIFICADOS.map((cert) => ({
    url: `${BASE}/solicitar/${cert.tipo.toLowerCase()}`,
    lastModified: new Date(),
    changeFrequency: 'monthly' as const,
    priority: 0.8,
  }))

  return [
    { url: BASE, lastModified: new Date(), changeFrequency: 'weekly', priority: 1 },
    { url: `${BASE}/solicitar`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.9 },
    ...certificadosUrls,
    { url: `${BASE}/seguimiento`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.5 },
    { url: `${BASE}/auth/login`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.3 },
    { url: `${BASE}/auth/registro`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.4 },
    { url: `${BASE}/privacidad`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.2 },
    { url: `${BASE}/terminos`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.2 },
    { url: `${BASE}/estado`, lastModified: new Date(), changeFrequency: 'always', priority: 0.2 },
    { url: `${BASE}/contacto`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.4 },
    { url: `${BASE}/certificado-nacimiento`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.85 },
    { url: `${BASE}/certificado-matrimonio`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.85 },
    { url: `${BASE}/certificado-defuncion`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.85 },
  ]
}
