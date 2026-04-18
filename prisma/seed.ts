import { PrismaClient, Role, Plan, TipoCertificado, EstadoSolicitud } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting seed...')

  const adminPassword = await bcrypt.hash('admin123', 12)
  const userPassword = await bcrypt.hash('user123', 12)

  const admin = await prisma.user.upsert({
    where: { email: 'admin@certidocs.es' },
    update: {},
    create: {
      email: 'admin@certidocs.es',
      name: 'Admin',
      password: adminPassword,
      role: Role.ADMIN,
      plan: Plan.ENTERPRISE,
    },
  })
  console.log(`✅ Created admin: ${admin.email}`)

  const user = await prisma.user.upsert({
    where: { email: 'test@user.com' },
    update: {},
    create: {
      email: 'test@user.com',
      name: 'Test User',
      password: userPassword,
      role: Role.USER,
      plan: Plan.PRO,
    },
  })
  console.log(`✅ Created user: ${user.email}`)

  const promo1 = await prisma.codigoPromo.upsert({
    where: { codigo: 'WELCOME20' },
    update: {},
    create: {
      codigo: 'WELCOME20',
      descuento: 20,
      maxUsos: 100,
    },
  })
  console.log(`✅ Created promo: ${promo1.codigo}`)

  const promo2 = await prisma.codigoPromo.upsert({
    where: { codigo: 'LAUNCH50' },
    update: {},
    create: {
      codigo: 'LAUNCH50',
      descuento: 50,
      maxUsos: 50,
    },
  })
  console.log(`✅ Created promo: ${promo2.codigo}`)

  const sol1 = await prisma.solicitud.create({
    data: {
      userId: user.id,
      tipo: TipoCertificado.NACIMIENTO,
      estado: EstadoSolicitud.PENDIENTE,
      datos: {
        nombre: 'Juan',
        apellido1: 'García',
        apellido2: 'López',
        fechaNacimiento: '2020-05-15',
        provincia: 'Madrid',
      },
      precio: 28.0,
      pagado: false,
      referencia: 'CD-2026041710001',
    },
  })
  console.log(`✅ Created solicitud: ${sol1.referencia}`)

  const sol2 = await prisma.solicitud.create({
    data: {
      userId: user.id,
      tipo: TipoCertificado.MATRIMONIO,
      estado: EstadoSolicitud.PENDIENTE,
      datos: {
       nombre: 'María',
        apellido1: 'Pérez',
        fechaMatrimonio: '2024-06-20',
        provincia: 'Barcelona',
      },
      precio: 28.0,
      pagado: true,
      referencia: 'CD-2026041710002',
    },
  })
  console.log(`✅ Created solicitud: ${sol2.referencia}`)

  await prisma.historialEstado.create({
    data: {
      solicitudId: sol2.id,
      estado: EstadoSolicitud.PENDIENTE,
      nota: 'Solicitud creada',
    },
  })

  await prisma.historialEstado.create({
    data: {
      solicitudId: sol2.id,
      estado: EstadoSolicitud.EN_PROCESO,
      nota: 'Pago confirmado - en tramitación',
    },
  })

  await prisma.webhookEndpoint.create({
    data: {
      userId: user.id,
      url: 'https://example.com/webhook',
      secret: 'whsec_testrandom24byteshere',
      activo: true,
      eventos: ['solicitud.estado_cambiado'],
    },
  })
  console.log(`✅ Created webhook endpoint`)

  console.log('🎉 Seed completed!')
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })