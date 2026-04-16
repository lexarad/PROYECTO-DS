# Roadmap – CertiDocs

> Este archivo es la fuente de verdad del estado del proyecto. Claude debe leerlo al inicio de cada sesión y actualizarlo al final.

---

## Estado actual: v0.6 – CI/CD, Docker, SEO ✅ — PRODUCTO COMPLETO MVP

### Completado ✅
- [x] Estructura Next.js 14 (App Router) + Tailwind
- [x] Schema Prisma: User, Account, Session, Solicitud, Documento
- [x] NextAuth con Credentials provider (email + password)
- [x] API: registro de usuario (`POST /api/auth/registro`)
- [x] API: CRUD solicitudes (`GET/POST /api/solicitudes`)
- [x] Landing page con catálogo de certificados
- [x] Página de selección de certificados (`/solicitar`)
- [x] Formulario dinámico por tipo de certificado (`/solicitar/[tipo]`)
- [x] Dashboard de usuario con listado de solicitudes
- [x] Catálogo de 6 certificados con campos configurados
- [x] Componente `EstadoBadge`
- [x] `.env.example` documentado

---

## Próximas iteraciones

### v0.2 – Funcionalidad core ✅
- [x] Página de detalle de solicitud (`/dashboard/solicitudes/[id]`)
- [x] Flujo de pago con Stripe (Checkout Session → `/api/pagos/checkout`)
- [x] Webhook Stripe → marcar solicitud como `pagado: true` + estado `EN_PROCESO`
- [x] Email de confirmación tras pago (Resend via `/src/lib/email.ts`)
- [x] Página de éxito (`/pago/exito`) y cancelación
- [x] Dashboard enlaza a detalle, muestra badge "Pago pendiente"
- [x] Campo `stripeSessionId` en schema Prisma
- [ ] Conectar PostgreSQL real y ejecutar `prisma db push` (pendiente del desarrollador)

### v0.3 – Panel de administración ✅
- [x] Middleware protege `/admin` — redirige si `role !== ADMIN`
- [x] Listado de solicitudes con filtros por estado, tipo y búsqueda libre
- [x] Resumen por estado (4 tarjetas con conteos)
- [x] Cambiar estado desde panel con `SelectorEstado` (PATCH `/api/admin/...`)
- [x] Añadir documentos (URL) desde `FormularioDocumento` (POST `/api/admin/...`)
- [x] Lista de usuarios `/admin/usuarios`
- [x] Layout admin con navegación lateral

### v0.4 – Experiencia de usuario ✅
- [x] Modelo `HistorialEstado` en Prisma (estado + nota + timestamp)
- [x] Página pública `/seguimiento/[ref]` con timeline y documentos disponibles
- [x] Email `sendCambioEstado` disparado en cada PATCH de estado desde admin
- [x] `SelectorEstado` ampliado con campo de nota opcional
- [x] `TimelineEstado` — componente de timeline reutilizable
- [x] Historial visible en `/dashboard/solicitudes/[id]` y en panel admin
- [x] Webhook Stripe registra primer entrada en historial al confirmar pago

### v0.5 – SaaS para profesionales ✅
- [x] Enum `Plan` (FREE / PRO / ENTERPRISE) en User + `stripeCustomerId/SubscriptionId`
- [x] Modelo `ApiKey` con hash SHA-256, prefix visible, activa/inactiva, lastUsedAt
- [x] `src/lib/planes.ts` — config de planes, precios, descuentos, límites
- [x] `src/lib/apikeys.ts` — generación y hash de API keys (`cd_...`)
- [x] API REST pública `/api/v1/solicitudes` (GET/POST) autenticada por Bearer key
- [x] `src/lib/validateApiKey.ts` — middleware de validación reutilizable
- [x] `/api/suscripcion/checkout` — Stripe Subscription Checkout
- [x] `/api/suscripcion/webhook` — activa plan en BD + cancela si subscription deleted
- [x] `/dashboard/plan` — página comparativa de planes con upgrade CTA
- [x] `/dashboard/api-keys` — gestión completa de keys (crear, copiar, activar, revocar)
- [x] Descuento de plan aplicado en solicitudes web y vía API
- [x] Dashboard muestra plan activo y enlace a API keys

### v0.6 – Optimización y escala ✅
- [x] GitHub Actions: workflow `ci.yml` (lint + typecheck en cada PR)
- [x] GitHub Actions: workflow `deploy.yml` (deploy automático a Vercel en push a main)
- [x] `Dockerfile` multistage (deps → builder → runner) con Next.js standalone
- [x] `docker-compose.yml` con PostgreSQL 16 para desarrollo local
- [x] `vercel.json` configurado con región `mad1` (Madrid) y variables de entorno
- [x] `sitemap.ts` — sitemap dinámico con todas las páginas de certificados
- [x] `robots.ts` — bloquea /dashboard, /admin, /api del indexado
- [x] `generateMetadata` en páginas de solicitud (title + description por certificado)

---

## Decisiones técnicas
- **Next.js 14 App Router** sobre Pages Router: mejor DX y RSC para dashboard
- **JWT sessions** sobre database sessions: menor latencia
- **Prisma** como ORM principal: migraciones tipadas y seguras
- **bcryptjs** con 12 rondas para hashing de contraseñas
- Referencia de solicitud formato `CD-{timestamp}-{random}` para ser legible

---

## Notas de sesión
- **2026-04-16**: Scaffolding inicial completo (v0.1).
- **2026-04-16**: v0.2 completo — Stripe Checkout, webhook, email Resend, detalle de solicitud, dashboard mejorado.
- **2026-04-16**: v0.3 completo — Panel admin con filtros, cambio de estado, gestión de documentos, lista de usuarios.
- **2026-04-16**: v0.4 completo — Historial de estados, seguimiento público, notificaciones email en cada cambio.
- **2026-04-16**: v0.5 completo — Planes FREE/PRO/ENTERPRISE, Stripe subscriptions, API keys, API REST pública /v1/, descuentos por plan.
- **2026-04-16**: v0.6 completo — CI/CD GitHub Actions, Dockerfile multistage, docker-compose, vercel.json, sitemap, robots, SEO metadata. MVP COMPLETO.
