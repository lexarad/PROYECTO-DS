# Roadmap – CertiDocs

> Este archivo es la fuente de verdad del estado del proyecto. Claude debe leerlo al inicio de cada sesión y actualizarlo al final.

---

## Estado actual: v0.3 – Panel de administración

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

### v0.4 – Experiencia de usuario
- [ ] Página de seguimiento público por referencia (`/seguimiento/[ref]`)
- [ ] Notificaciones por email en cada cambio de estado
- [ ] Historial de estados en la solicitud

### v0.5 – SaaS para profesionales
- [ ] Planes de suscripción (gestor, abogado, empresa)
- [ ] API key por usuario para integración
- [ ] Multi-tenant básico

### v0.6 – Optimización y escala
- [ ] Tests (Vitest + Testing Library)
- [ ] CI/CD con GitHub Actions
- [ ] Despliegue en Vercel con DB en Railway/Supabase
- [ ] SEO y meta tags por página

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
- **2026-04-16**: v0.3 completo — Panel admin con filtros, cambio de estado, gestión de documentos, lista de usuarios. Siguiente paso: v0.4 seguimiento público + notificaciones.
