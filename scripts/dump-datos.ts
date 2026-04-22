import { readFileSync, existsSync } from 'fs'
import { resolve } from 'path'
const envPath = resolve(__dirname, '..', '.env')
if (existsSync(envPath)) {
  const lines = readFileSync(envPath, 'utf-8').split('\n')
  for (const line of lines) {
    const t = line.trim()
    if (!t || t.startsWith('#')) continue
    const eq = t.indexOf('=')
    if (eq === -1) continue
    const k = t.slice(0, eq).trim(), v = t.slice(eq + 1).trim().replace(/^["']|["']$/g, '')
    if (k && !(k in process.env)) process.env[k] = v
  }
}
import { PrismaClient } from '@prisma/client'
const p = new PrismaClient()
async function m() {
  const s = await (p as any).solicitud.findFirst({ where: { referencia: 'CD-1776729959486-UW9C' } })
  console.log('DATOS:', JSON.stringify(s?.datos, null, 2))
  console.log('TIPO:', s?.tipoDocumento)
  await p.$disconnect()
}
m()
