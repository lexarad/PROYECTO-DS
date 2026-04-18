#!/usr/bin/env node

// Script para testing en producción: simular flujo completo
// Uso: node scripts/test-production.js

const { PrismaClient } = require('@prisma/client')
const { crearJob } = require('../src/lib/automatizacion/runner')

const prisma = new PrismaClient()

async function testFlujoCompleto() {
  console.log('🧪 Iniciando test de flujo completo en producción...')

  try {
    // 1. Crear una solicitud de prueba
    const solicitud = await prisma.solicitud.create({
      data: {
        tipo: 'NACIMIENTO',
        datos: {
          nombre: 'Juan',
          apellido1: 'Pérez',
          apellido2: 'García',
          fechaNacimiento: '1990-01-01',
          lugarNacimiento: 'Madrid',
          provinciaNacimiento: 'Madrid',
          paisNacimiento: 'España'
        },
        precio: 15.00,
        pagado: true,
        referencia: 'TEST-' + Date.now(),
        emailInvitado: 'test@example.com'
      }
    })

    console.log(`✅ Solicitud creada: ${solicitud.referencia}`)

    // 2. Crear job de automatización
    const job = await crearJob(solicitud.id, 'NACIMIENTO')
    if (!job) {
      throw new Error('No se pudo crear el job')
    }

    console.log(`✅ Job creado: ${job.id}`)

    // 3. Esperar procesamiento (simular)
    console.log('⏳ Esperando procesamiento del job...')
    await new Promise(resolve => setTimeout(resolve, 5000)) // 5 segundos

    // 4. Verificar estado del job
    const jobActualizado = await prisma.automatizacionJob.findUnique({
      where: { id: job.id },
      include: { solicitud: { include: { documentos: true } } }
    })

    console.log(`📊 Estado del job: ${jobActualizado.estado}`)
    console.log(`📄 Documentos generados: ${jobActualizado.solicitud.documentos.length}`)

    if (jobActualizado.estado === 'COMPLETADO') {
      console.log('🎉 ¡Flujo completo exitoso!')
    } else if (jobActualizado.estado === 'REQUIERE_MANUAL') {
      console.log('⚠️ Job requiere intervención manual')
    } else {
      console.log('⏳ Job aún en proceso')
    }

    // 5. Limpiar datos de test
    await prisma.documento.deleteMany({ where: { solicitudId: solicitud.id } })
    await prisma.automatizacionJob.delete({ where: { id: job.id } })
    await prisma.solicitud.delete({ where: { id: solicitud.id } })

    console.log('🧹 Datos de test limpiados')

  } catch (error) {
    console.error('❌ Error en test:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

testFlujoCompleto()