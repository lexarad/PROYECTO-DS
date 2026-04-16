import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/dashboard/', '/admin/', '/api/'],
    },
    sitemap: `${process.env.NEXTAUTH_URL ?? 'https://certidocs.es'}/sitemap.xml`,
  }
}
