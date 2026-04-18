#!/usr/bin/env node

// Script de pre-despliegue: verifica que todo esté listo
// Uso: node scripts/pre-deploy.js

const fs = require('fs')
const path = require('path')

console.log('🔍 Verificando configuración de despliegue...\n')

const checks = [
  {
    name: 'Dockerfile.worker existe',
    check: () => fs.existsSync('Dockerfile.worker'),
    required: true
  },
  {
    name: 'railway.json existe',
    check: () => fs.existsSync('railway.json'),
    required: true
  },
  {
    name: 'Worker script existe',
    check: () => fs.existsSync('scripts/run-worker.js'),
    required: true
  },
  {
    name: 'Supabase setup script existe',
    check: () => fs.existsSync('scripts/setup-supabase.sql'),
    required: true
  },
  {
    name: 'Test de producción existe',
    check: () => fs.existsSync('scripts/test-production.js'),
    required: true
  },
  {
    name: 'Variables de entorno documentadas',
    check: () => fs.existsSync('docs/production-checklist.md'),
    required: true
  }
]

let allGood = true

checks.forEach(({ name, check, required }) => {
  const result = check()
  const status = result ? '✅' : '❌'
  console.log(`${status} ${name}`)

  if (!result && required) {
    allGood = false
  }
})

console.log('\n' + '='.repeat(50))

if (allGood) {
  console.log('🎉 ¡Todo listo para el despliegue!')
  console.log('\n📋 Siguientes pasos:')
  console.log('1. Crear proyecto en Railway/Render')
  console.log('2. Configurar Supabase con bucket "certificados"')
  console.log('3. Crear proyecto Sentry')
  console.log('4. Setear variables de entorno')
  console.log('5. Desplegar y ejecutar npm run test:production')
} else {
  console.log('❌ Faltan archivos requeridos. Revisa la configuración.')
  process.exit(1)
}