/** @type {import('next').NextConfig} */

const securityHeaders = [
  { key: 'X-DNS-Prefetch-Control', value: 'on' },
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload',
  },
  {
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https:",
      "font-src 'self'",
      "frame-src https://js.stripe.com https://hooks.stripe.com",
      "connect-src 'self' https://api.stripe.com",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join('; '),
  },
]

const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  poweredByHeader: false,
  compress: true,
  generateEtags: true,
  images: {
    domains: [],
    formats: ['image/webp'],
  },
  // Prevent Playwright test runner (~400MB) from being bundled into
  // serverless functions — only playwright-core + chromium-min are needed.
  experimental: {
    outputFileTracingExcludes: {
      '*': [
        'node_modules/@playwright/test/**',
        'node_modules/playwright/**',
        'node_modules/.cache/**',
      ],
    },
  },
  // Webpack: mark playwright-core as external in server bundles so the
  // native binary resolution works correctly on Vercel Lambda.
  webpack(config, { isServer }) {
    if (isServer) {
      config.externals = [...(config.externals ?? []), 'playwright-core']
    }
    return config
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: securityHeaders,
      },
    ]
  },
}

module.exports = nextConfig
