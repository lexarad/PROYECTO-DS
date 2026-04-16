# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

**CertiDocs** — Plataforma web de tramitación automatizada de certificados y documentos legales en España.
SaaS que permite solicitar certificados del Registro Civil, Seguridad Social y Ministerio de Justicia online.

## Stack

- **Frontend/Backend**: Next.js 14 (App Router) + TypeScript + Tailwind CSS
- **ORM**: Prisma + PostgreSQL
- **Auth**: NextAuth v4 con Credentials provider (JWT sessions)
- **Deploy target**: Vercel + Railway/Supabase para DB

## Commands

```bash
npm run dev          # Servidor de desarrollo en localhost:3000
npm run build        # Build de producción
npm run lint         # ESLint

npm run db:push      # Sync schema → DB sin migraciones (desarrollo)
npm run db:migrate   # Crear migración nombrada (producción)
npm run db:generate  # Regenerar Prisma Client tras cambios en schema
npm run db:studio    # GUI visual de la base de datos
```

**Setup inicial:**
```bash
cp .env.example .env   # Rellenar DATABASE_URL y NEXTAUTH_SECRET
npm install
npm run db:push
npm run dev
```

## Architecture

```
src/
├── app/                    # App Router de Next.js
│   ├── api/                # Route handlers (server)
│   │   ├── auth/           # NextAuth + registro
│   │   └── solicitudes/    # CRUD de solicitudes
│   ├── auth/               # Páginas login y registro (client)
│   ├── dashboard/          # Panel del usuario autenticado (server component)
│   └── solicitar/          # Catálogo + formularios dinámicos
├── components/
│   ├── forms/              # FormularioSolicitud (client, react-hook-form)
│   └── ui/                 # Componentes reutilizables (EstadoBadge, etc.)
├── lib/
│   ├── auth.ts             # authOptions de NextAuth
│   ├── certificados.ts     # Catálogo y configuración de campos por tipo
│   └── prisma.ts           # Singleton de PrismaClient
└── types/
    └── index.ts            # Tipos compartidos + extensiones de next-auth
```

### Key patterns

- **Server components** para páginas con datos (dashboard, listados). Usan `getServerSession` directamente.
- **Client components** para formularios y elementos interactivos. Marcados con `'use client'`.
- **`/lib/certificados.ts`** define el catálogo completo: tipos, precios y campos de formulario. Añadir un certificado nuevo requiere solo añadir una entrada en el array `CERTIFICADOS` y el enum en `prisma/schema.prisma`.
- **Solicitudes**: al crearse se genera una referencia `CD-{timestamp}-{random}` y quedan en estado `PENDIENTE`. El pago (Stripe, pendiente de implementar) las pasará a `pagado: true`.
- **Tailwind classes reutilizables** definidas en `globals.css`: `.btn-primary`, `.btn-secondary`, `.input`, `.label`, `.card`.

## Roadmap

Ver `docs/roadmap.md` — leerlo al inicio de cada sesión y actualizarlo al terminar.
Estado actual: **v0.1 completo**. Próximo paso: integrar Stripe (v0.2).
