#!/usr/bin/env node
/**
 * Script interactivo para generar el .env y subir variables a Vercel.
 * Ejecutar con: node scripts/setup-env.js
 */
const { execSync } = require('child_process')
const readline = require('readline')
const fs = require('fs')
const crypto = require('crypto')
const path = require('path')

const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
const ask = (q) => new Promise((res) => rl.question(q, res))

async function main() {
  console.log('\n🚀 CertiDocs — Setup de entorno y despliegue\n')

  const db = await ask('📦 DATABASE_URL de Supabase: ')
  const stripeSk = await ask('💳 STRIPE_SECRET_KEY (sk_test_...): ')
  const stripeWh = await ask('💳 STRIPE_WEBHOOK_SECRET (whsec_...): ')
  const stripePk = await ask('💳 STRIPE_PUBLISHABLE_KEY (pk_test_...): ')
  const resend = await ask('📧 RESEND_API_KEY (re_...): ')
  const emailFrom = await ask('📧 EMAIL_FROM [CertiDocs <noreply@certidocs.es>]: ') || 'CertiDocs <noreply@certidocs.es>'

  const secret = crypto.randomBytes(32).toString('base64')

  const env = `# Generado automáticamente por setup-env.js
DATABASE_URL="${db}"
NEXTAUTH_SECRET="${secret}"
NEXTAUTH_URL="http://localhost:3000"
STRIPE_SECRET_KEY="${stripeSk}"
STRIPE_WEBHOOK_SECRET="${stripeWh}"
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="${stripePk}"
STRIPE_PRICE_PRO=""
STRIPE_PRICE_ENTERPRISE=""
RESEND_API_KEY="${resend}"
EMAIL_FROM="${emailFrom}"
`

  fs.writeFileSync(path.join(__dirname, '../.env'), env)
  console.log('\n✅ .env creado\n')

  console.log('📊 Aplicando schema a la base de datos...')
  try {
    execSync('npx prisma db push', { stdio: 'inherit', cwd: path.join(__dirname, '..') })
    console.log('✅ Base de datos lista\n')
  } catch {
    console.error('❌ Error al aplicar el schema. Revisa DATABASE_URL y reintenta.')
    rl.close()
    process.exit(1)
  }

  const deploy = await ask('¿Desplegar en Vercel ahora? (s/n): ')
  if (deploy.toLowerCase() !== 's') {
    console.log('\nPuedes desplegar más tarde con: vercel --prod')
    rl.close()
    return
  }

  console.log('\n🔗 Vinculando proyecto con Vercel...')
  try {
    execSync('vercel link --yes', { stdio: 'inherit', cwd: path.join(__dirname, '..') })
  } catch {}

  console.log('\n⚙️  Subiendo variables de entorno a Vercel (producción)...')
  const vars = [
    ['DATABASE_URL', db],
    ['NEXTAUTH_SECRET', secret],
    ['STRIPE_SECRET_KEY', stripeSk],
    ['STRIPE_WEBHOOK_SECRET', stripeWh],
    ['NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY', stripePk],
    ['RESEND_API_KEY', resend],
    ['EMAIL_FROM', emailFrom],
  ]

  for (const [k, v] of vars) {
    try {
      execSync(`vercel env add ${k} production`, {
        input: v + '\n',
        stdio: ['pipe', 'inherit', 'inherit'],
        cwd: path.join(__dirname, '..')
      })
      console.log(`  ✓ ${k}`)
    } catch {
      console.log(`  ⚠ ${k} — ya existe o error, actualiza manualmente en vercel.com`)
    }
  }

  console.log('\n🚀 Desplegando a producción...')
  execSync('vercel --prod', { stdio: 'inherit', cwd: path.join(__dirname, '..') })

  console.log('\n✅ Deploy completado.')
  console.log('👉 Actualiza NEXTAUTH_URL en Vercel con tu URL de producción.')
  console.log('👉 Actualiza el webhook de Stripe con la URL real.')
  rl.close()
}

main().catch((e) => { console.error(e); process.exit(1) })
