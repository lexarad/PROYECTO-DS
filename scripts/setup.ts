#!/usr/bin/env tsx

import { cpSync, existsSync } from 'fs'
import { join } from 'path'
import { execSync } from 'child_process'

const PROJECT_ROOT = join(__dirname, '..')
const ENV_FILE = join(PROJECT_ROOT, '.env')
const ENV_EXAMPLE = join(PROJECT_ROOT, '.env.example')

function main() {
  console.log('🚀 CertiDocs Setup\n')

  if (!existsSync(ENV_FILE)) {
    if (existsSync(ENV_EXAMPLE)) {
      console.log('📋 Copiando .env.example → .env')
      cpSync(ENV_EXAMPLE, ENV_FILE)
    } else {
      console.log('❌ No hay .env.example')
      process.exit(1)
    }
  } else {
    console.log('✅ .env ya existe')
  }

  console.log('\n📦 Instalando dependecias...')
  try {
    execSync('npm install', { cwd: PROJECT_ROOT, stdio: 'inherit' })
  } catch {
    console.log('   (hazlo manualmente)')
  }

  console.log('\n🗄️ Generando Prisma Client...')
  try {
    execSync('npx prisma generate', { cwd: PROJECT_ROOT, stdio: 'inherit' })
  } catch {
    console.log('   (verifica DATABASE_URL)')
  }

  console.log('\n✅ Setup completado!')
  console.log('\nComandos:')
  console.log('  npm run dev        → Servidor dev')
  console.log('  npm run db:studio  → Prisma Studio')
  console.log('  npm test           → Tests')
}

main()