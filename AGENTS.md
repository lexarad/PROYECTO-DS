# CertiDocs — Guía para Agentes

> Este documento sirve como referencia rápida para agentes (Claude Code, AI coding assistants) que trabajan en el proyecto.

---

## Estructura del Proyecto

```
D:\PROYECTO DS\
├── src/
│   ├── app/                    # Next.js 14 App Router
│   │   ├── api/               # API routes
│   │   │   ├── admin/         # Rutas admin (protegidas)
│   │   │   ├── v1/            # API pública REST
│   │   │   ├── auth/          # Autenticación
│   │   │   ├── pagos/         # Stripe
│   │   │   ├── suscripcion/    # Stripe subscriptions
│   │   │   ├── cron/         # Vercel cron jobs
│   │   │   └── cron/         # Webhooks externos
│   │   ├── dashboard/         # Área de usuario autenticado
│   │   ├── admin/            # Panel de administración
│   │   └── (páginas públicas)
│   ├── components/            # Componentes React
│   │   ├── ui/               # Componentes reutilizables
│   │   └── admin/            # Componentes admin
│   ├── lib/                  # Lógica de negocio
│   │   ├── automatizacion/   # Motor de scraper MJ
│   │   ├── auth.ts           # NextAuth config
│   │   ├── prisma.ts        # Cliente Prisma
│   │   ├── certificados.ts  # Catálogo certificados
│   │   ├── factura.ts       # Generación facturas
│   │   ├── email.ts         # Envío emails (Resend)
│   │   ├── stripe.ts        # Stripe SDK
│   │   ├── apikeys.ts      # Gestión API keys
│   │   ├── planes.ts       # Configuración planes SaaS
│   │   └── webhook-salientes.ts  # Webhooks delivery
│   └── __tests__/           # Tests Vitest
├── prisma/
│   └── schema.prisma         # Schema de BD
├── docs/
│   ├── roadmap.md           # Estado completo del proyecto
│   ├── progress.md         # Log de cambios recientes
│   ├── workflow-mejora.md # Workflow iterativo
│   └── deploy.md          # Guía de despliegue producción
├── package.json
└── next.config.js
```

---

## Commands Frecuentes

```bash
# Desarrollo
npm run dev              # Iniciar servidor dev

# Tests
npm test                 # Unitarios (Vitest)
npm run test:watch       # Watch mode
npm run test:e2e        # E2E (Playwright)

# Calidad
npm run lint             # ESLint
npm run build           # Build de producción
npx tsc --noEmit        # TypeScript check

# Base de datos
npm run db:push         # Apply schema a BD
npm run db:studio       # Abrir Prisma Studio
npm run db:generate    # Generar cliente

# Deploy
git add . && git commit -m "fix: ..." && git push
```

---

## Autenticación

- **Provider:** NextAuth con Credentials
- **Modelo User:** `email`, `password` (bcrypt hash), `role` (USER | ADMIN), `plan`, `stripeCustomerId`
- **Sesiones:** JWT (no DB sessions)
- **Middleware:** `src/middleware.ts` protege rutas `/dashboard`, `/admin`, `/api/v1`

---

## Modelos Principales (Prisma)

- **User** — usuario registrado
- **Solicitud** — petición de certificado (estado, tipo, datosJSON)
- **Documento** — documento generado (URL)
- **HistorialEstado** — log de cambios de estado
- **ApiKey** — keys para API REST
- **Job** — jobs de automatización MJ
- **Factura** — facturas generadas
- **WebhookEndpoint** + **WebhookDelivery** — webhooks salientes

---

## Estados de Solicitud

```
PENDIENTE    — Esperando pago
PAGADO      ��� Pagado, sin procesar
EN_PROCESO  — En tramitación automática
TRAMITADO   — Completado
RECHAZADO   — Cancelado/rechazado
REQUIERE_MANUAL — No automatizable
```

---

## Tipos de Certificado

- NACIMIENTO
- MATRIMONIO
- DEFUNCION
- NACIMIENTO_EXTRanjERO
- PARTE_DEFUNCION
- ULTIMAS_VOLUNTADES
- *(EMPADRONAMIENTO, ANTECEDENTES_PENALES, VIDA_LABORAL no automatizados)*

---

## Entornos Requeridos

| Variable | Descripción |
|---------|-------------|
| `DATABASE_URL` | PostgreSQL (Vercel) |
| `DIRECT_URL` | PostgreSQL directo (socket) |
| `NEXTAUTH_SECRET` | Secret para JWT |
| `NEXTAUTH_URL` | URL de producción |
| `STRIPE_SECRET_KEY` | API key Stripe |
| `STRIPE_WEBHOOK_SECRET` | Webhook signing secret |
| `RESEND_API_KEY` | API key Resend |
| `ADMIN_EMAIL` | Email para alertas |
| `CHROMIUM_REMOTE_EXEC_PATH` | Chromium para automation |

---

## Errores Comunes

1. **ESLint interactivo** — ejecutar `npm run lint` requiere config primero: crear `.eslintrc.json`
2. **Prisma client** — tras cambios en schema: `npm run db:generate`
3. **Vercel build** — Playwright excluded del bundle en `next.config.js`

---

## Workflow de Contribución

1. Crear branch feature o fix
2. Hacer cambios
3. `npm run lint` + `npx tsc --noEmit` + `npm test`
4. Commit atómico con mensaje descriptivo
5. Push y PR

---

*Actualizado: 2026-04-17*