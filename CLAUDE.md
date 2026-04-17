# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

**CertiDocs** — SaaS de tramitación online de certificados y documentos legales en España (certidocs-xi.vercel.app).
Responsable: Víctor Heredia Hernández, Via Laietana 59 4.º 1.ª, 08003 Barcelona.

## Stack

- **Frontend/Backend**: Next.js 14 (App Router) + TypeScript + Tailwind CSS
- **ORM**: Prisma v5 + PostgreSQL (Supabase)
- **Auth**: NextAuth v4, Credentials provider, JWT sessions
- **Payments**: Stripe Checkout Sessions + Webhooks
- **Email**: Resend (`src/lib/email.ts` + `src/lib/tramitacion/index.ts`)
- **Deploy**: Vercel (serverless) — usar `vercel --prod` para desplegar

## Commands

```bash
npm run dev          # Servidor de desarrollo en localhost:3000
npm run build        # Build de producción
npx tsc --noEmit     # Type check (siempre antes de desplegar)
vercel --prod        # Deploy a producción

npm run db:push      # Sync schema → DB (desarrollo, sin migración)
npm run db:studio    # GUI visual de la base de datos
```

## Critical infra notes

- **DATABASE_URL** debe usar el pooler de Supabase (port 6543, `?pgbouncer=true`) para compatibilidad con Vercel serverless. La conexión directa (5432) falla en Vercel por IPv6.
- **DIRECT_URL** puede ser la conexión directa (5432) — usada solo por Prisma Migrate.
- **Prisma singleton** en `src/lib/prisma.ts` cachea en `global.prisma` para evitar conexiones excesivas.

## Architecture

```
src/
├── app/
│   ├── api/
│   │   ├── auth/              # NextAuth + registro + reset password
│   │   ├── invitado/checkout  # Checkout sin cuenta (POST: crea solicitud + Stripe session)
│   │   ├── pagos/
│   │   │   ├── checkout/      # Checkout autenticado (POST: crea Stripe session para solicitud existente)
│   │   │   └── webhook/       # Stripe webhook: marca pagado, envía email, notifica admin
│   │   ├── admin/solicitudes/ # PATCH estado, POST documentos (requiere ADMIN role)
│   │   ├── solicitudes/       # CRUD solicitudes autenticadas
│   │   ├── v1/solicitudes     # API pública con API key (PRO/ENTERPRISE)
│   │   └── keys/              # Gestión API keys
│   ├── admin/
│   │   ├── page.tsx           # Lista solicitudes + KPIs de ingresos
│   │   ├── tramitacion/       # Cola de pedidos a tramitar + quick actions
│   │   ├── solicitudes/[id]/  # Detalle con historial, documentos, cambio estado
│   │   └── usuarios/          # Lista de usuarios registrados
│   ├── dashboard/             # Panel usuario (solicitudes, plan, api-keys)
│   ├── solicitar/[tipo]/      # Formulario dinámico por tipo de certificado
│   ├── seguimiento/[ref]/     # Seguimiento público por referencia
│   ├── pago/exito/            # Confirmación post-pago (invitado vs registrado)
│   ├── privacidad/            # Política RGPD + LOPDGDD
│   └── terminos/              # T&C LSSI-CE + TRLGDCU
├── components/
│   ├── forms/FormularioSolicitud.tsx   # Client: agrupa campos por sección, guest/auth flow
│   ├── admin/
│   │   ├── SelectorEstado.tsx          # Client: cambia estado + nota + email automático
│   │   ├── AccionesTramitacion.tsx     # Client: marcar completada desde cola de tramitación
│   │   ├── FormularioDocumento.tsx     # Client: subir documentos a una solicitud
│   │   └── FiltrosAdmin.tsx            # Client: filtros de búsqueda en admin
│   └── ui/                             # EstadoBadge, TimelineEstado, BotonPago
├── lib/
│   ├── certificados.ts         # Catálogo completo con campos, precios y secciones
│   ├── tramitacion/index.ts    # Email admin al recibir pago (con labels legibles)
│   ├── email.ts                # sendConfirmacionPago + sendCambioEstado (Resend)
│   ├── auth.ts                 # authOptions NextAuth
│   ├── prisma.ts               # Singleton PrismaClient
│   ├── stripe.ts               # Cliente Stripe
│   └── planes.ts               # Configuración FREE/PRO/ENTERPRISE + descuentos
└── types/index.ts              # CertificadoConfig, CampoFormulario, extensiones next-auth
```

### Key patterns

- **Formularios dinámicos**: `src/lib/certificados.ts` define todos los campos por tipo de certificado, con `seccion` para agrupación visual. `FormularioSolicitud.tsx` agrupa los campos por sección y muestra headers.
- **Flujo invitado**: POST a `/api/invitado/checkout` → crea solicitud con `userId: null, emailInvitado` → Stripe session → webhook marca pagado → email con tracking link.
- **Flujo autenticado**: POST a `/api/solicitudes` (crea solicitud) → POST a `/api/pagos/checkout` (crea Stripe session) → webhook.
- **Tramitación**: al recibir pago, webhook llama a `notificarNuevaTramitacion()` que envía email al admin con todos los datos y enlace al organismo oficial. La cola en `/admin/tramitacion` muestra todos los EN_PROCESO con botón "Marcar como completada".
- **Cambio de estado**: `PATCH /api/admin/solicitudes/[id]/estado` → actualiza DB + añade historial + envía email al cliente.
- **Certificados disponibles**: NACIMIENTO, MATRIMONIO, DEFUNCION, EMPADRONAMIENTO, ANTECEDENTES_PENALES, VIDA_LABORAL, ULTIMAS_VOLUNTADES, SEGUROS_FALLECIMIENTO.
- **Tailwind classes**: `.btn-primary`, `.btn-secondary`, `.input`, `.label`, `.card` definidas en `globals.css`.

### Añadir un nuevo certificado

1. Añadir el valor al enum `TipoCertificado` en `prisma/schema.prisma`
2. Ejecutar `npm run db:push`
3. Añadir entrada en `CERTIFICADOS` en `src/lib/certificados.ts` (tipo, label, descripcion, precio, campos con seccion)
4. Añadir TIEMPOS/ORGANISMOS en `src/app/solicitar/page.tsx` y `src/app/solicitar/[tipo]/page.tsx`
5. Añadir enlace en `ENLACES_ORGANISMO` (`app/admin/tramitacion/page.tsx`) y `ENLACES_TRAMITACION` (`lib/tramitacion/index.ts`)
