import { prisma } from '@/lib/prisma'
import { JsonLd } from '@/components/ui/JsonLd'
import { HomeContent } from '@/components/HomeContent'
import { CERTIFICADOS } from '@/lib/certificados'
import type { Metadata } from 'next'

export const revalidate = 3600

export const metadata: Metadata = {
  title: 'CertiDocs — Certificados legales online en España',
  description: 'Tramitamos tus certificados del Registro Civil, Seguridad Social y Ministerio de Justicia de forma rápida y segura. Sin desplazamientos ni colas.',
  openGraph: {
    title: 'CertiDocs — Certificados legales online en España',
    description: 'Nacimiento, matrimonio, antecedentes penales, vida laboral y más. Desde 9,90 €. Entrega en 24-72h.',
    url: 'https://certidocs-xi.vercel.app',
    siteName: 'CertiDocs',
    locale: 'es_ES',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'CertiDocs — Certificados legales online en España',
    description: 'Tramitamos tus certificados sin colas ni desplazamientos. Desde 9,90 €.',
  },
}

async function getStats() {
  try {
    const [tramitados, usuarios] = await Promise.all([
      prisma.solicitud.count({ where: { pagado: true } }),
      prisma.user.count(),
    ])
    return { tramitados, usuarios }
  } catch {
    return { tramitados: 0, usuarios: 0 }
  }
}

export default async function HomePage() {
  const stats = await getStats()

  const organizationLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'CertiDocs',
    url: 'https://certidocs-xi.vercel.app',
    description: 'Plataforma online para tramitar certificados legales en España',
    address: {
      '@type': 'PostalAddress',
      streetAddress: 'Via Laietana 59, 4.º 1.ª',
      addressLocality: 'Barcelona',
      postalCode: '08003',
      addressCountry: 'ES',
    },
  }

  const serviceLd = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: 'Tramitación de certificados legales online',
    provider: { '@type': 'Organization', name: 'CertiDocs' },
    areaServed: { '@type': 'Country', name: 'España' },
    serviceType: 'Gestión documental',
    offers: CERTIFICADOS.map((c) => ({
      '@type': 'Offer',
      name: c.label,
      price: c.precio.toFixed(2),
      priceCurrency: 'EUR',
    })),
  }

  return (
    <>
      <JsonLd data={organizationLd} />
      <JsonLd data={serviceLd} />
      <HomeContent stats={stats} />
    </>
  )
}
