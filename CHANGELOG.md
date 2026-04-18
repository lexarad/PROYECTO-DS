# Changelog — CertiDocs

Todos los cambios notables de este proyecto se documentan aquí.

El formato se basa en [Keep a Changelog](https://keepachangelog.com/es-ES/1.0.0/).
Este proyecto adhere a [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [0.19.0] — 2026-04-17

### Added
- `GET /api/v1/solicitudes/[id]` — detalle de solicitud por ID o referencia
- `GET/POST /api/v1/webhooks` — gestión de endpoints de webhook
- `PATCH/DELETE /api/v1/webhooks/[id]` — activar/desactivar/borrar endpoints
- `src/lib/webhooks-salientes.ts` — motor de delivery HMAC-SHA256 firmado con 3 reintentos
- `generarSecretWebhook()` — prefijo `whsec_` + 24 bytes aleatorios
- Webhook Stripe `charge.dispute.created` — email urgente al admin

### Changed
- Modelos Prisma: `WebhookEndpoint` + `WebhookDelivery` con índices optimizados

---

## [0.18.0] — 2026-04-17

### Added
- `sendConfirmacionReembolso()` — email de confirmación de reembolso
- `POST /api/admin/solicitudes/[id]/reembolso` — Stripe Refunds API
- Webhook `charge.refunded` — procesa reembolsos desde dashboard Stripe
- `BotonReembolso` — componente con confirmación en dos pasos
- Badge rojo `REQUIERE_MANUAL` en nav del admin (desktop + mobile)
- `AdminMobileMenu` refactorizado con array de links + badges genéricos

---

## [0.17.0] — 2026-04-17

### Added
- `GET /api/cron/seguimiento-tramitados` — cron diario (09:00): detecta solicitudes TRAMITADO >15d → email proactivo; >30d → alerta urgente
- `GET /api/cron/limpiar-abandonadas` — cron nocturno (03:00):>PENDIENTE sin pagar >7 días → RECHAZADA
- `sendActualizacionEspera()` + `sendAlertaSeguimientoAdmin()` — plantillas de email
- Cron `recordatorios` mejorado: dos ventanas (24h + 72h)
- `sendRecordatorioPago` con parámetro `segundo`
- 5 crons configurados en `vercel.json`

---

## [0.16.0] — 2026-04-17

### Added
- `sendAlertaManual()` — email al admin con job ID, referencia, tipo, motivo
- `sendAlertaMJ()` — email al admin cuando MJ no responde
- `GET /api/cron/health-check` — cron cada 2h comprueba MJ + dispara alertas

---

## [0.15.0] — 2026-04-17

### Added
- `next.config.js` — `outputFileTracingExcludes` excluye Playwright del bundle
- `vercel.json` — buildCommand con `prisma migrate deploy`
- `.env.example` completado con vars de producción
- GitHub workflow `deploy.yml` con migrate step
- `prisma/migrations/20260417000000_init` — migration SQL completa
- `docs/deploy.md` — guía de despliegue producción

---

## [0.14.0] — 2026-04-17

### Added
- `JobLogger` con flush periódico — callback `flushFn` cada N entradas
- `GET /api/admin/automatizacion/[jobId]/status` — endpoint de polling
- `JobLiveMonitor` — componente con polling cada 3s, muestra logs tiempo real

---

## [0.13.0] — 2026-04-17

### Added
- Race condition fix — atomic job claim con `updateMany`
- Dead browser recovery — `getBrowser()` comprueba `isConnected()`
- Dry-run mode — `AUTOMATION_DRY_RUN=true`
- Per-job timeout 240s con `withTimeout()`
- 21 tests para schemas Zod
- `GET /api/admin/automatizacion/health` — health check MJ

---

## [0.12.0] — 2026-04-17

### Added
- Paginación real en panel admin (25 por página)
- Búsqueda en tiempo real en `/solicitar` con `CatalogoBusqueda`
- `GET /api/stats` — stats públicas con revalidate
- Landing page: sección social proof + sección `/precios`
- Stats del día en Server Component async

---

## [0.11.0] — 2026-04-17

### Added
- `src/lib/ratelimit.ts` — rate limiter en memoria
- Rate limiting en `/api/auth/registro` y `/api/auth/forgot-password`
- Rate limiting en `/api/v1/solicitudes`
- Security headers HTTP en `next.config.js`
- 32 tests pasando

---

## [0.10.0] — 2026-04-17

### Added
- `sendBienvenida()` — email de bienvenida
- `PATCH /api/user/perfil` — actualizar nombre + cambiar contraseña
- `/dashboard/perfil` — página con estadísticas personales
- `GET /api/admin/solicitudes/export` — exportación CSV con BOM UTF-8
- Botón "Exportar CSV" en panel admin

---

## [0.9.0] — 2026-04-17

### Added
- `GET /api/admin/analytics` — KPIs, ingresos, tipos, MRR
- `/admin/analytics` — dashboard con recharts
- `POST /api/suscripcion/portal` — Stripe Billing Portal
- `BotonPortal` — para usuarios PRO/ENTERPRISE

---

## [0.8.0] — 2026-04-17

### Added
- Modelo `Factura` (FAC-YYYY-NNNN, IVA 21%)
- `src/lib/factura.ts` — generador de número + crearFactura()
- `src/lib/factura-pdf.tsx` — template PDF con @react-pdf/renderer
- `GET /api/facturas` y `GET /api/facturas/[id]/pdf`
- Webhook Stripe genera factura tras pago
- `/dashboard/facturas` y `/admin/facturas`

---

## [0.7.0] — 2026-04-17

### Added
- Vitest con 3 suites de tests (20 tests)
- Flujo completo reset contraseña
- `not-found.tsx` y `error.tsx` globales
- `dashboard/loading.tsx` — skeleton de carga
- `/privacidad` y `/terminos`

---

## [0.6.0] — 2026-04-17

### Added
- GitHub Actions: `ci.yml` (lint + typecheck)
- GitHub Actions: `deploy.yml` (deploy automático)
- `Dockerfile` multistage
- `docker-compose.yml` con PostgreSQL 16
- `vercel.json` configurado
- `sitemap.ts` y `robots.ts`
- SEO metadata

---

## [0.5.0] — 2026-04-17

### Added
- Enum `Plan` (FREE/PRO/ENTERPRISE) en User
- Modelo `ApiKey` con hash SHA-256
- `src/lib/planes.ts` — config de planes y precios
- `src/lib/apikeys.ts` — generación de keys
- API REST `/api/v1/solicitudes` autenticada por Bearer
- Stripe Subscription Checkout + Webhook
- `/dashboard/plan` y `/dashboard/api-keys`

---

## [0.4.0] — 2026-04-17

### Added
- Modelo `HistorialEstado`
- Página pública `/seguimiento/[ref]`
- `TimelineEstado` componente
- Notificaciones email en cada cambio de estado

---

## [0.3.0] — 2026-04-17

### Added
- Middleware protege `/admin`
- Listado de solicitudes con filtros
- Resumen por estado (4 tarjetas)
- Cambiar estado desde panel
- Añadir documentos desde admin
- Lista de usuarios `/admin/usuarios`

---

## [0.2.0] — 2026-04-17

### Added
- Página detalle de solicitud
- Stripe Checkout
- Webhook Stripe → pago confirmado
- Email confirmación
- Página éxito y cancelación

---

## [0.1.0] — 2026-04-16

### Added
- Scaffolding inicial Next.js 14 + Tailwind
- Prisma schema: User, Account, Session, Solicitud, Documento
- NextAuth con Credentials
- API: registro, CRUD solicitudes
- Landing page + catálogo
- Formulario dinámico por tipo

---

*Para cambios antiguos, ver `docs/roadmap.md`.*