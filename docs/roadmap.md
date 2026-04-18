# Roadmap – CertiDocs

> Este archivo es la fuente de verdad del estado del proyecto. Claude debe leerlo al inicio de cada sesión y actualizarlo al final.

---

## Estado actual: v0.12 – UX landing, admin, búsqueda catálogo

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

### v0.7 – Pulido y estabilidad ✅
- [x] Vitest + 3 suites de tests unitarios (certificados, planes, apikeys) — 20 tests
- [x] `vitest.config.ts` con alias `@/*` y coverage con v8
- [x] Tests integrados en CI workflow (`npm test` en cada PR)
- [x] Flujo completo reset contraseña: forgot → email → reset → login
  - Modelo `PasswordResetToken` (token, expires, used)
  - `POST /api/auth/forgot-password` — genera token, envía email
  - `POST /api/auth/reset-password` — valida token, actualiza hash
  - Páginas `/auth/forgot-password` y `/auth/reset-password`
  - Enlace "¿Olvidaste la contraseña?" en login
- [x] `not-found.tsx` — página 404 global
- [x] `error.tsx` — página de error global con botón reintentar
- [x] `dashboard/loading.tsx` — skeleton de carga para el dashboard
- [x] `/privacidad` — política de privacidad (RGPD compliant)
- [x] `/terminos` — términos y condiciones

### v0.12 – UX landing, admin paginado, búsqueda catálogo ✅
- [x] Paginación real en panel admin (25 por página, 100 era el límite anterior)
- [x] Búsqueda en tiempo real en `/solicitar` con `CatalogoBusqueda` (filtro instantáneo)
- [x] `GET /api/stats` — stats públicas con `revalidate=3600` para social proof
- [x] Landing page: sección social proof con stats reales (tramitados, usuarios, tipos)
- [x] Landing page: sección `/precios` comparativa de los 3 planes con feature list
- [x] Enlace "Precios" en nav de la landing
- [x] Landing como async Server Component con stats del día

### v0.11 – Rate limiting, seguridad, tests ✅
- [x] `src/lib/ratelimit.ts` — rate limiter en memoria (sin Redis) con limpieza automática
- [x] Rate limiting en `POST /api/auth/registro` (5 req/10min por IP)
- [x] Rate limiting en `POST /api/auth/forgot-password` (3 req/15min por IP, silencioso)
- [x] Rate limiting en `GET/POST /api/v1/solicitudes` (60 req/min por IP)
- [x] `src/__tests__/lib/ratelimit.test.ts` — 4 tests para el rate limiter
- [x] `src/__tests__/lib/factura.test.ts` — 6 tests para TIPO_LABEL, EMPRESA y cálculo de IVA
- [x] Corrección: test de certificados actualizado de 6 a 8 tipos
- [x] Security headers en `next.config.js`: CSP, HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy
- [x] 5 suites / 32 tests — todos passing

### v0.10 – Perfil, onboarding, exportación CSV ✅
- [x] `sendBienvenida()` — email de bienvenida con tips y CTA al registro
- [x] Integración en `POST /api/auth/registro` — dispara email automáticamente
- [x] `PATCH /api/user/perfil` — actualizar nombre + cambiar contraseña
- [x] `/dashboard/perfil` — página con estadísticas personales (total pagado, tipos frecuentes, plan)
- [x] `FormularioPerfil` — componente con formularios de edición y cambio de clave
- [x] Nombre en header del dashboard enlaza a `/dashboard/perfil`
- [x] `GET /api/admin/solicitudes/export` — exportación CSV con BOM UTF-8 (compatible Excel)
- [x] Botón "Exportar CSV" en panel admin principal
- [x] Notificación admin mejorada con nº de factura y plan del cliente

### v0.9 – Analytics admin + Stripe Customer Portal ✅
- [x] `GET /api/admin/analytics` — KPIs, ingresos diarios, tipos, MRR, usuarios por mes
- [x] `/admin/analytics` — dashboard con KPIs, gráfico de ingresos (recharts LineChart), distribución por tipo (CSS bars), usuarios nuevos por mes (BarChart)
- [x] Enlace "Analytics" en nav del admin
- [x] `POST /api/suscripcion/portal` — crea sesión Stripe Billing Portal
- [x] `BotonPortal` — botón en `/dashboard/plan` para usuarios PRO/ENTERPRISE con suscripción activa
- [x] Vars EMPRESA_* en `.env.example` para datos fiscales del emisor

### v0.8 – Facturación automática ✅
- [x] Modelo `Factura` en Prisma (numero FAC-YYYY-NNNN, IVA 21%, relación con User y Solicitud)
- [x] `src/lib/factura.ts` — generador de número correlativo + `crearFactura(solicitudId)`
- [x] `src/lib/factura-pdf.tsx` — template PDF profesional con `@react-pdf/renderer`
- [x] `GET /api/facturas` — lista facturas del usuario autenticado
- [x] `GET /api/facturas/[id]/pdf` — descarga PDF (acceso owner o admin)
- [x] `GET /api/admin/facturas` — listado global admin con búsqueda y paginación
- [x] Webhook Stripe genera factura automáticamente tras pago confirmado
- [x] Email al cliente incluye enlace de descarga de factura PDF
- [x] `sendFacturaEmail()` — email dedicado con enlace directo al PDF
- [x] `/dashboard/facturas` — listado de facturas del usuario con descarga y total pagado
- [x] `/admin/facturas` — panel admin con búsqueda, paginación e ingresos por página
- [x] Enlace "Facturas" en header del dashboard y nav del admin

---

## Decisiones técnicas
- **Next.js 14 App Router** sobre Pages Router: mejor DX y RSC para dashboard
- **JWT sessions** sobre database sessions: menor latencia
- **Prisma** como ORM principal: migraciones tipadas y seguras
- **bcryptjs** con 12 rondas para hashing de contraseñas
- Referencia de solicitud formato `CD-{timestamp}-{random}` para ser legible

---

### v0.13 — Motor de automatización production-hardening ✅
- [x] Race condition fix — atomic job claim con `updateMany WHERE estado IN (PENDIENTE, FALLIDO)`
- [x] Dead browser recovery — `getBrowser()` comprueba `isConnected()` antes de reusar instancia
- [x] Dry-run mode — `AUTOMATION_DRY_RUN=true` para testing local sin enviar formularios a MJ
- [x] Per-job timeout de 240s con `withTimeout()` + `Promise.race`
- [x] 21 tests nuevos para schemas Zod (nacimiento, matrimonio, defuncion, fallecido, validarDatos)
- [x] `GET /api/admin/automatizacion/health` — health check de conectividad MJ + estado de jobs
- [x] `docs/progress.md` — log detallado de cada gap resuelto
- [x] 8 suites / 77 tests — todos passing

---

### v0.14 — Live Job Monitoring ✅
- [x] `JobLogger` con flush periódico — callback `flushFn` escribe logs a DB cada N entradas (default 5), evitando pérdida de logs en crashes/timeouts
- [x] `GET /api/admin/automatizacion/[jobId]/status` — endpoint ligero de polling para el detalle de job
- [x] `JobLiveMonitor` — componente cliente que hace polling cada 3s cuando el job está EN_CURSO: muestra estado, logs actualizados, error y screenshots en tiempo real. Se detiene automáticamente al alcanzar estado terminal
- [x] Página `/admin/automatizacion/[jobId]` refactorizada para usar `JobLiveMonitor`
- [x] 3 tests nuevos para flush en `JobLogger` — 8 suites / 80 tests passing

---

### v0.15 — Production Deploy ✅
- [x] `next.config.js` — `outputFileTracingExcludes` excluye `@playwright/test` del bundle (evita superar 250MB de Vercel), `webpack externals` para `playwright-core`
- [x] `vercel.json` — `buildCommand` añade `prisma migrate deploy`, `functions` con `maxDuration` explícito para cron y webhook
- [x] `.env.example` — completado con todas las vars de producción: `DIRECT_URL`, `ADMIN_EMAIL`, `CHROMIUM_REMOTE_EXEC_PATH`, `AUTOMATION_DRY_RUN`
- [x] `.github/workflows/deploy.yml` — step de `prisma migrate deploy` antes del build, con secrets `DATABASE_URL` y `DIRECT_URL`
- [x] `prisma/migrations/migration_lock.toml` + `20260417000000_init/migration.sql` — migration inicial completa con todos los modelos, enums, índices y FKs
- [x] `docs/deploy.md` — guía paso a paso: Neon, Stripe (API keys + productos + webhook), Resend, Vercel (env vars + CI tokens), Chromium, primer usuario admin, checklist post-deploy, troubleshooting
- [x] 80 tests passing — TypeScript limpio

### v0.16 — Alertas operacionales ✅
- [x] `sendAlertaManual()` en `email.ts` — email al admin con job ID, referencia, tipo, motivo y links directos al job y a la solicitud
- [x] `sendAlertaMJ()` en `email.ts` — email al admin cuando la sede electrónica del MJ no responde
- [x] `runner.ts` — `sendAlertaManual` enganchado en los 4 puntos de transición a `REQUIERE_MANUAL`: límite de intentos, validación fallida, resultado fallido agotado, excepción (captcha o agotado)
- [x] `GET /api/cron/health-check` — cron cada 2h que comprueba MJ y dispara `sendAlertaMJ` si hay caídas
- [x] `vercel.json` — cron `health-check` añadido (`0 */2 * * *`)
- [x] 80 tests passing — TypeScript limpio

### v0.17 — Automatización de procesos de negocio ✅
- [x] `GET /api/cron/seguimiento-tramitados` — cron diario (09:00): detecta solicitudes TRAMITADO >15d → email proactivo al cliente + alerta admin; >30d → alerta urgente + nota automática en historial
- [x] `GET /api/cron/limpiar-abandonadas` — cron nocturno (03:00): solicitudes PENDIENTE sin pagar >7 días → RECHAZADA + entrada de historial automática
- [x] `sendActualizacionEspera()` + `sendAlertaSeguimientoAdmin()` — dos nuevas plantillas de email
- [x] Cron `recordatorios` mejorado: dos ventanas (24h + 72h), segundo aviso más urgente con copy diferente y banner rojo
- [x] `sendRecordatorioPago` acepta parámetro `segundo` para diferenciar el tono del email
- [x] `vercel.json` — 5 crons configurados: automatizacion (*/15), recordatorios (10:00), health-check (*/2h), seguimiento-tramitados (09:00), limpiar-abandonadas (03:00)
- [x] 9 suites / 88 tests — todos passing, TypeScript limpio

### v0.18 — Reembolsos y mejoras de navegación admin ✅
- [x] `sendConfirmacionReembolso()` — email al cliente confirmando el reembolso con importe y plazo bancario
- [x] `POST /api/admin/solicitudes/[id]/reembolso` — llama a Stripe Refunds API, actualiza estado a RECHAZADA, añade nota al historial, envía email al cliente
- [x] Webhook `charge.refunded` — detecta reembolsos iniciados directamente desde el dashboard de Stripe y los procesa igual
- [x] `BotonReembolso` — componente con confirmación en dos pasos (previene clicks accidentales)
- [x] Badge rojo `REQUIERE_MANUAL` en el nav del admin (desktop + mobile) — visible en todo momento sin abrir el panel
- [x] `AdminMobileMenu` refactorizado con array de links + badges genéricos
- [x] 88 tests passing — TypeScript limpio

### v0.19 — API v1 completa + Webhooks salientes + Disputas ✅
- [x] `GET /api/v1/solicitudes/[id]` — detalle de solicitud por ID o referencia, con historial y documentos
- [x] `GET/POST /api/v1/webhooks` — gestión de endpoints de webhook para clientes PRO/ENTERPRISE
- [x] `PATCH/DELETE /api/v1/webhooks/[id]` — activar/desactivar/borrar endpoints
- [x] `src/lib/webhooks-salientes.ts` — motor de delivery HMAC-SHA256 firmado, 3 reintentos con backoff (30s/2min/10min), log en `WebhookDelivery`
- [x] `generarSecretWebhook()` — prefijo `whsec_` + 24 bytes aleatorios
- [x] Prisma: modelos `WebhookEndpoint` + `WebhookDelivery` + migration SQL `20260417000001`
- [x] Cambios de estado → `dispararEvento()` enganchado en el handler PATCH de estado admin
- [x] Webhook Stripe `charge.dispute.created` — email urgente al admin con link directo a Stripe, recordatorio de 7 días
- [x] 10 suites / 93 tests — todos passing, TypeScript limpio

---

### v0.20 — Adjuntos del cliente (Vercel Blob) ✅
- [x] Modelo `Adjunto` en Prisma (id, solicitudId, nombre, url, blobPathname, tipo, tamanio, createdAt)
- [x] Migration SQL `20260418000000_adjuntos`
- [x] `POST /api/solicitudes/[id]/adjuntos` — upload a Vercel Blob (máx 10 MB, 5 archivos, PDF/JPG/PNG/WEBP)
- [x] `DELETE /api/solicitudes/[id]/adjuntos/[adjuntoId]` — borra de Blob + DB (owner o admin)
- [x] `GET /api/solicitudes/[id]/adjuntos` — lista adjuntos del owner
- [x] `AdjuntosCliente` — componente con upload inline, progreso, lista con eliminación
- [x] Dashboard `/dashboard/solicitudes/[id]` — sección adjuntos visible cuando pagado y no cerrada
- [x] Admin `/admin/solicitudes/[id]` — sección "Documentos del cliente" visible si hay adjuntos
- [x] `.env.example` — `BLOB_READ_WRITE_TOKEN` documentado
- [x] 12 tests nuevos (validación tipo/tamaño/límite + formatBytes) — 12 suites / 117 tests passing

### v0.25 — Búsqueda global Cmd+K ✅
- [x] `GET /api/admin/buscar?q=` — busca en solicitudes (referencia/email), usuarios (name/email) y facturas (numero); devuelve 5 resultados por categoría
- [x] `BusquedaGlobal` — modal activado con Cmd+K / Ctrl+K, debounce 300ms, resultados categorizados con navegación directa, tecla Esc para cerrar
- [x] Integrado en header del admin layout con botón visible + atajo de teclado mostrado

### v0.24 — Audit log de acciones admin ✅
- [x] Modelo `AuditLog` en Prisma (adminId, adminEmail, accion, entidad, entidadId, resumen, ip, createdAt) + migration SQL `20260418000002`
- [x] `src/lib/audit.ts` — `registrarAudit()` helper best-effort con captura de IP desde headers
- [x] `GET /api/admin/audit` — paginado (50/pág), filtrable por accion, q (resumen/admin/entidadId)
- [x] `/admin/audit` — página con tabla, filtros y paginación; colores por tipo de acción
- [x] 6 puntos de enganche: PATCH estado, POST documentos, POST reembolso, POST confirmar-pago, POST mensajes admin, PATCH bulk
- [x] Enlace "Audit" añadido en nav del admin
- [x] 15 suites / 151 tests passing

### v0.23 — RGPD: exportación y eliminación de cuenta ✅
- [x] `GET /api/user/exportar-datos` — descarga JSON con usuario, solicitudes, facturas, API keys, mensajes y notificaciones
- [x] `DELETE /api/user/cuenta` — anonimiza datos personales (email→deleted-{id}@certidocs.invalid, name, password, imagen) + cancela suscripción Stripe activa; conserva solicitudes pagadas para obligaciones fiscales
- [x] `AccionesRGPD` — componente con botón descarga JSON y eliminación en dos pasos (confirmación explícita)
- [x] Integrado en `/dashboard/perfil`
- [x] Admins protegidos contra auto-eliminación

### v0.22 — Notificaciones in-app ✅
- [x] Modelo `Notificacion` en Prisma (userId, tipo, titulo, cuerpo, enlace?, leida, createdAt) + migration SQL `20260418000001`
- [x] `src/lib/notificaciones.ts` — `crearNotificacion()` helper best-effort con límite de 200 por usuario
- [x] `GET /api/notificaciones` — lista últimas 50, incluye `noLeidas` count
- [x] `PATCH /api/notificaciones` — marca todas como leídas
- [x] `DELETE /api/notificaciones` — limpia todas
- [x] `NotificationBell` — campana con badge rojo, dropdown con las últimas 5, polling cada 30s, marcar leídas / limpiar
- [x] `/dashboard/notificaciones` — centro completo (últimas 100), marca leídas al abrir
- [x] Dashboard header — `NotificationBell` integrada junto a "Salir"
- [x] 4 puntos de enganche: PATCH estado admin, POST mensajes admin, POST documentos admin, checkout.session.completed
- [x] 14 suites / 141 tests passing

### v0.21 — Mensajería interna + Cron reintentos webhooks ✅
- [x] `GET/POST /api/solicitudes/[id]/mensajes` — cliente lee/envía mensajes; marca leídos los del admin automáticamente
- [x] `GET/POST /api/admin/solicitudes/[id]/mensajes` — admin lee/envía; marca leídos los del cliente automáticamente
- [x] `HiloMensajes` — componente chat reutilizable con polling cada 10s, burbuja diferenciada por rol, Ctrl+Enter para enviar, contador de caracteres
- [x] Dashboard `/dashboard/solicitudes/[id]` — sección "Mensajes con CertiDocs" cuando solicitud pagada
- [x] Admin `/admin/solicitudes/[id]` — sección "Mensajes con el cliente" con badge "N sin leer"
- [x] `TablaAdminBulk` — badge rojo de mensajes no leídos del cliente junto al botón "Gestionar"
- [x] Admin `/admin` — query incluye `_count mensajes WHERE autorRol=USER AND leido=false`
- [x] Email al admin al recibir mensaje de cliente (`sendMensajeCliente`)
- [x] Email al cliente al recibir respuesta del admin (`sendRespuestaAdmin`)
- [x] Relaciones `WebhookEndpoint ↔ WebhookDelivery` añadidas al schema Prisma
- [x] `GET /api/cron/reintentar-webhooks` — cron cada 5 min: reintenta deliveries fallidos con `proximoIntento <= now`, HMAC firmado, máx 3 intentos con backoff
- [x] `vercel.json` — cron `reintentar-webhooks` añadido (`*/5 * * * *`)
- [x] 13 tests nuevos (validarMensaje, estados cerrados) — 13 suites / 130 tests passing

---

### v0.31 — Sistema de Referidos ✅
- [x] `referralCode` (único, 8 chars alfanuméricos seguros) + `referidoPorId` añadidos a User
- [x] `CreditoReferido` model — registra acción referral + código promo generado
- [x] Migration SQL `20260418000003_referidos`
- [x] `src/lib/referidos.ts` — `generarReferralCode()`, `obtenerOCrearReferralCode()`, `getStatsReferidos()`, `procesarCreditoReferido()` (crea CodigoPromo 15% un solo uso 90 días)
- [x] `POST /api/auth/registro` — acepta `referralCode`, vincula `referidoPorId`, auto-genera código propio
- [x] `GET /api/referidos` — stats del usuario (referralCode, referralUrl, referidos, créditos)
- [x] Webhook `checkout.session.completed` — `procesarCreditoReferido` + `sendCreditoReferido` al referidor
- [x] `sendCreditoReferido()` — email con código promo visual, link a `/dashboard/referidos`
- [x] `PanelReferidos` — componente cliente con enlace copiable, stats, lista de códigos ganados
- [x] `/dashboard/referidos` — página con explicación del programa y `PanelReferidos`
- [x] `/auth/registro?ref=CODE` — banner de bienvenida al referido, código propagado automáticamente
- [x] Nav del dashboard — enlace "Referidos" añadido
- [x] 9 tests nuevos (generarReferralCode + procesarCreditoReferido) — 17 suites / 182 tests passing

---

### v0.33 — Infraestructura Cl@ve Permanente + Certificado FNMT ✅
- [x] `src/lib/automatizacion/auth/totp.ts` — generador TOTP RFC 6238 puro Node.js (sin dependencias externas): `generarTOTP()`, `segundosRestantesTOTP()`; soporta secrets con espacios y minúsculas, período y dígitos configurables
- [x] `src/lib/automatizacion/auth/clavePin.ts` — `autenticarConClavePin()`: flow Playwright completo (navegar → click Cl@ve → NIF+pass → OTP TOTP → context con cookies); `crearContextoCertificado()`: soporte PKCS#12 via `clientCertificates` Playwright 1.46+; `getConfigClavePin()`, `tieneConfigClavePin()`
- [x] `src/lib/automatizacion/forms/base.ts` — `crearContexto()`: selecciona Cl@ve > cert FNMT > anónimo; `estaAutenticado()`: detecta si hay credenciales configuradas
- [x] Los 6 forms (nacimiento, matrimonio, defunción, últimas voluntades, seguros fallecimiento, antecedentes penales) actualizados: usan `crearContexto()` y seleccionan botón "Con Cl@ve" vs "Sin certificado" según `estaAutenticado()`
- [x] `.env.example` — documentadas: `CLAVEPIN_USER`, `CLAVEPIN_PASS`, `CLAVEPIN_TOTP_SECRET`, `CERT_P12_BASE64`, `CERT_P12_PASSWORD`
- [x] `src/__tests__/lib/totp.test.ts` — 10 tests TOTP: longitud, dígitos, período personalizado, determinismo, spaces, minúsculas
- [x] 18 suites / 192 tests — todos passing, TypeScript limpio

### v0.34 — Admin Panel Referidos ✅
- [x] `GET /api/admin/referidos` — KPIs (totalReferidores, totalReferidos, totalCreditos), historial paginado con datos de usuario
- [x] `/admin/referidos` — página con 3 KPIs, top 5 referidores (count + suma crédito), tabla historial paginada
- [x] Enlace "Referidos" añadido al nav del admin

### v0.35 — Automatización Vida Laboral (Seguridad Social) ✅
- [x] `src/lib/automatizacion/forms/vida-laboral.ts` — `tramitarVidaLaboral()`: flujo completo para IMPORTASS/SS; tipo de informe (completo/fecha), método envío (email/postal/descarga); falla gracefully sin auth devolviendo error descriptivo en lugar de lanzar
- [x] `DatosVidaLaboral` añadido a `types.ts`
- [x] `vidaLaboralSchema` añadido a `schemas.ts` + `validarDatos` actualizado
- [x] `VIDA_LABORAL` añadido a `TIPOS_AUTOMATIZABLES` y `ejecutarTramite` en runner
- [x] Test `esAutomatizable('VIDA_LABORAL')` actualizado a `true`
- [x] 18 suites / 192 tests — todos passing, TypeScript limpio

### v0.32 — Panel de Gestión Manual MJ ✅
- [x] `PATCH /api/admin/automatizacion/[jobId]/resolver` — cierra un job REQUIERE_MANUAL como COMPLETADO; acepta `refOrganismo`, `nota`, `actualizarSolicitud` (TRAMITADO/COMPLETADA/null)
- [x] `JOB_RESOLUCION_MANUAL` añadido al tipo `AccionAudit` en `src/lib/audit.ts`
- [x] `ResolverManualModal` — componente cliente con modal: campo ref MJ, nota obligatoria, selector de nuevo estado de solicitud; llama a PATCH resolver, router.refresh() al cerrar
- [x] `/admin/automatizacion/[jobId]` — botón "Resolver manualmente" visible solo cuando estado = REQUIERE_MANUAL, junto a "Reintentar job"
- [x] `/admin/tramitacion` — banner de alerta con lista de todos los jobs REQUIERE_MANUAL: referencia, tipo, error, intentos, enlace "Gestionar →" al job
- [x] `prisma generate` ejecutado — tipos TS actualizados con `referralCode`/`referidoPorId` del v0.31
- [x] 17 suites / 182 tests — todos passing, TypeScript limpio

---

## Notas de sesión
- **2026-04-16**: Scaffolding inicial completo (v0.1).
- **2026-04-16**: v0.2 completo — Stripe Checkout, webhook, email Resend, detalle de solicitud, dashboard mejorado.
- **2026-04-16**: v0.3 completo — Panel admin con filtros, cambio de estado, gestión de documentos, lista de usuarios.
- **2026-04-16**: v0.4 completo — Historial de estados, seguimiento público, notificaciones email en cada cambio.
- **2026-04-16**: v0.5 completo — Planes FREE/PRO/ENTERPRISE, Stripe subscriptions, API keys, API REST pública /v1/, descuentos por plan.
- **2026-04-16**: v0.6 completo — CI/CD GitHub Actions, Dockerfile multistage, docker-compose, vercel.json, sitemap, robots, SEO metadata.
- **2026-04-16**: v0.7 completo — Tests Vitest, reset de contraseña, 404/error globales, loading skeleton, páginas legales RGPD.
- **2026-04-17**: v0.8 completo — Facturación automática: modelo Factura, PDF con @react-pdf/renderer, API routes, webhook Stripe, emails, dashboard y panel admin.
- **2026-04-17**: v0.9 completo — Analytics admin con recharts (ingresos, tipos, usuarios), Stripe Customer Portal para gestión de suscripciones.
- **2026-04-17**: v0.10 completo — Email bienvenida, perfil usuario con stats, PATCH contraseña/nombre, exportación CSV admin.
- **2026-04-17**: v0.11 completo — Rate limiting, security headers HTTP, 32 tests passing.
- **2026-04-17**: v0.12 completo — Paginación admin, búsqueda catálogo, stats landing, sección precios.
- **2026-04-17**: v0.13 completo — Automation hardening: race condition fix, dead browser recovery, dry-run mode, 240s timeout, 21 schema tests, health endpoint. 77 tests passing.
- **2026-04-17**: v0.14 completo — Live job monitoring: flush periódico de logs, endpoint de status, JobLiveMonitor con polling en vivo cada 3s. 80 tests passing.
- **2026-04-17**: v0.15 completo — Production deploy: next.config.js, vercel.json, .env.example, CI workflow, migration SQL, docs/deploy.md.
- **2026-04-17**: v0.16 completo — Alertas operacionales: sendAlertaManual (4 puntos en runner), sendAlertaMJ, cron health-check cada 2h.
- **2026-04-17**: v0.17 completo — Automatización procesos de negocio: seguimiento-tramitados, limpiar-abandonadas, recordatorios doble ventana. 88 tests.
- **2026-04-17**: v0.18 completo — Reembolsos Stripe, BotonReembolso, badge REQUIERE_MANUAL en nav.
- **2026-04-18**: v0.25 completo — Búsqueda global Cmd+K (modal, debounce, 3 categorías). 151 tests.
- **2026-04-18**: v0.24 completo — Audit log: model, helper IP, 6 hooks, página con filtros y paginación.
- **2026-04-18**: v0.23 completo — RGPD exportación JSON + eliminación de cuenta con anonimización y cancelación Stripe.
- **2026-04-18**: v0.22 completo — Notificaciones in-app: model, API, NotificationBell, polling 30s, 4 puntos de enganche. 141 tests.
- **2026-04-18**: v0.21 completo — Mensajería interna cliente↔admin con polling, emails, badge no-leídos en tabla admin, cron reintentos webhooks cada 5min. 130 tests.
- **2026-04-18**: v0.31 completo — Sistema de referidos: referralCode en User, CreditoReferido model, procesarCreditoReferido, email con código 15%, dashboard /referidos, registro con ?ref=. 182 tests.
- **2026-04-18**: v0.32 completo — Gestión Manual MJ: endpoint PATCH resolver, ResolverManualModal (ref MJ + nota + estado), banner REQUIERE_MANUAL en tramitación, prisma generate. 182 tests.
- **2026-04-18**: v0.33 completo — Infraestructura Cl@ve + Cert FNMT: TOTP RFC 6238 (puro Node crypto), autenticarConClavePin (Playwright), crearContextoCertificado (PKCS#12), crearContexto/estaAutenticado en base.ts, todos los 6 forms actualizados, .env.example documentado. 192 tests.
- **2026-04-18**: v0.34 completo — Admin referidos: /admin/referidos con KPIs (referidores, referidos, créditos), top 5 referidores, historial paginado, /api/admin/referidos, enlace en nav admin.
- **2026-04-18**: v0.35 completo — Automatización Vida Laboral (Seguridad Social): tramitarVidaLaboral, DatosVidaLaboral, vidaLaboralSchema, VIDA_LABORAL en runner/schemas/TIPOS_AUTOMATIZABLES. Requiere Cl@ve/cert. 192 tests.
- **2026-04-18**: v0.36 completo — Soporte DNIe: auth/dnie.ts (ConfigDnie, tieneConfigDnie, getArgsDnie, crearContextoDnie, instalarHandlerPin), browser.ts pasa --use-system-certificate-store+NSS al lanzar si DNIE_ENABLED=true, base.ts MetodoAuth enum + detectarMetodoAuth() (prioridad clavepin>dnie>pkcs12>anonimo), health endpoint expone auth.metodo, .env.example documentado con instrucciones por SO. 192 tests.
- **2026-04-18**: v0.20 completo — Adjuntos del cliente: Vercel Blob, upload/delete, AdjuntosCliente, integración dashboard+admin. 117 tests.
- **2026-04-17**: v0.19 completo — API v1 GET by ID, webhooks salientes HMAC firmados con reintentos, disputas Stripe. 93 tests. — Reembolsos Stripe (API + webhook + email), BotonReembolso con confirmación, badge REQUIERE_MANUAL en nav admin. — Automatización procesos de negocio: seguimiento-tramitados (d15+d30), limpiar-abandonadas (7d), recordatorios doble ventana (24h+72h). 88 tests. — Alertas operacionales: sendAlertaManual (4 puntos en runner), sendAlertaMJ, cron health-check cada 2h. — Production deploy: next.config.js (outputFileTracingExcludes Playwright), vercel.json (migrate deploy + maxDuration), .env.example completo, CI workflow con migrate, migration SQL inicial, docs/deploy.md guía completa.
