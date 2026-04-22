#!/usr/bin/env node

// Script para ejecutar el worker de automatización
// Uso: node scripts/run-worker.js

const { spawn } = require('child_process')
const path = require('path')

console.log('🚀 Iniciando worker de automatización...')

const workerPath = path.join(__dirname, '..', 'src', 'worker', 'index.ts')
const cmd = process.platform === 'win32' ? 'npx.cmd' : 'npx'

const tsx = spawn(cmd, ['tsx', workerPath], {
  stdio: 'inherit',
  cwd: path.join(__dirname, '..'),
  env: { ...process.env, NODE_ENV: 'production' },
})

tsx.on('close', (code) => {
  console.log(`Worker terminó con código ${code}`)
  process.exit(code)
})

tsx.on('error', (err) => {
  console.error('Error al iniciar worker:', err)
  process.exit(1)
})
