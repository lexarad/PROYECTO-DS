# Roadmap – CertiDocs

> Este archivo es la fuente de verdad del estado del proyecto. Claude debe leerlo al inicio de cada sesión y actualizarlo al final.

---

## Estado actual: MVP v0.1 – Scaffolding completo

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

### v0.2 – Funcionalidad core
- [ ] Conectar PostgreSQL real y ejecutar `prisma db push`
- [ ] Página de detalle de solicitud (`/dashboard/solicitudes/[id]`)
- [ ] Flujo de pago con Stripe (Checkout Session)
- [ ] Webhook Stripe → marcar solicitud como `pagado: true`
- [ ] Email de confirmación tras pago (Resend / Nodemailer)

### v0.3 – Panel de administración
- [ ] Ruta protegida `/admin` solo para `role: ADMIN`
- [ ] Listar todas las solicitudes con filtros por estado
- [ ] Cambiar estado de solicitud desde el panel
- [ ] Subir documentos generados y asociarlos a la solicitud

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
- **2026-04-16**: Scaffolding inicial completo. Siguiente paso: configurar DB y ejecutar `prisma db push`.
