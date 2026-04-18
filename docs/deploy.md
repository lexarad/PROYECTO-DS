# Guía de deploy a producción — CertiDocs

## Requisitos previos
- Cuenta en [Vercel](https://vercel.com)
- Cuenta en [Neon](https://neon.tech) o [Supabase](https://supabase.com) (PostgreSQL)
- Cuenta en [Stripe](https://dashboard.stripe.com)
- Cuenta en [Resend](https://resend.com) con dominio verificado
- Cuenta en [GitHub](https://github.com) con el repositorio del proyecto

---

## 1. PostgreSQL en Neon (recomendado)

1. Crea un proyecto en [neon.tech](https://neon.tech)
2. En **Dashboard > Connection Details**, selecciona el driver **Prisma**
3. Copia las dos URLs:
   - `DATABASE_URL` → la URL con pooler (puerto **6543**)
   - `DIRECT_URL` → la URL directa sin pooler (puerto **5432**)
4. Guárdalas — las necesitarás en los pasos siguientes

---

## 2. Stripe

### API Keys
1. Ve a [dashboard.stripe.com/apikeys](https://dashboard.stripe.com/apikeys)
2. Copia `Secret key` → `STRIPE_SECRET_KEY`
3. Copia `Publishable key` → `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`

### Productos y precios
1. Ve a **Products > Add product**
2. Crea **CertiDocs PRO** con precio recurrente mensual → copia el `price_...` → `STRIPE_PRICE_PRO`
3. Crea **CertiDocs Enterprise** con precio recurrente mensual → `STRIPE_PRICE_ENTERPRISE`

### Webhook (tras el deploy inicial)
1. Ve a **Developers > Webhooks > Add endpoint**
2. URL: `https://tu-dominio.vercel.app/api/pagos/webhook`
3. Eventos a escuchar:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
4. Copia el **Signing secret** → `STRIPE_WEBHOOK_SECRET`

---

## 3. Resend

1. Ve a [resend.com/domains](https://resend.com/domains) y verifica tu dominio
2. Ve a [resend.com/api-keys](https://resend.com/api-keys) → **Create API Key**
3. Copia la key → `RESEND_API_KEY`
4. `EMAIL_FROM` = `"CertiDocs <noreply@tu-dominio.es>"`

---

## 4. Vercel

### Crear el proyecto
1. Ve a [vercel.com/new](https://vercel.com/new) → importa el repositorio de GitHub
2. Framework: **Next.js** (se detecta automáticamente)

### Variables de entorno
En **Settings > Environment Variables**, añade todas las vars de `.env.example` con los valores reales:

| Variable | Descripción |
|---|---|
| `DATABASE_URL` | URL con pooler de Neon (puerto 6543) |
| `DIRECT_URL` | URL directa de Neon (puerto 5432) |
| `NEXTAUTH_SECRET` | Genera con `openssl rand -base64 32` |
| `NEXTAUTH_URL` | `https://tu-dominio.vercel.app` |
| `STRIPE_SECRET_KEY` | sk_live_... |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | pk_live_... |
| `STRIPE_WEBHOOK_SECRET` | whsec_... (paso 2.3) |
| `STRIPE_PRICE_PRO` | price_... |
| `STRIPE_PRICE_ENTERPRISE` | price_... |
| `RESEND_API_KEY` | re_... |
| `EMAIL_FROM` | CertiDocs \<noreply@tu-dominio.es\> |
| `ADMIN_EMAIL` | tu-email@tu-dominio.es |
| `CRON_SECRET` | Genera con `openssl rand -base64 32` |
| `CHROMIUM_REMOTE_EXEC_PATH` | Ver sección 5 |
| `EMPRESA_NOMBRE` | CertiDocs SL |
| `EMPRESA_NIF` | B12345678 |
| `EMPRESA_DIRECCION` | Tu dirección fiscal |
| `EMPRESA_EMAIL` | soporte@tu-dominio.es |

### Vercel Token para CI/CD
1. Ve a [vercel.com/account/tokens](https://vercel.com/account/tokens) → **Create Token**
2. En GitHub: **Settings > Secrets > Actions** → añade `VERCEL_TOKEN`
3. Añade también `DATABASE_URL` y `DIRECT_URL` como secrets de GitHub (para el step de migrate)

---

## 5. Chromium para el motor de automatización

El motor de automatización usa `@sparticuz/chromium-min` con un binario remoto.

**En Vercel**, añade esta variable:
```
CHROMIUM_REMOTE_EXEC_PATH=https://github.com/Sparticuz/chromium/releases/download/v131.0.0/chromium-v131.0.0-pack.tar
```

> La versión del tarball debe coincidir con `@sparticuz/chromium-min` instalado.
> Versión actual: `147.x` → usa el tarball `v131.0.0` (compatibilidad interna del paquete).

---

## 6. Primer deploy

### Opción A — Via GitHub Actions (recomendado)
```bash
git push origin main
```
El workflow `.github/workflows/deploy.yml` se encarga de:
1. Ejecutar `prisma migrate deploy` (aplica la migration inicial)
2. Build con Vercel CLI
3. Deploy a producción

### Opción B — Manual desde Vercel dashboard
Si es el primer deploy y prefieres el dashboard:
1. Vercel ejecutará `prisma generate && prisma migrate deploy && next build`
2. La migration inicial crea todas las tablas automáticamente

---

## 7. Primer usuario admin

Tras el deploy, crea tu usuario admin directamente en la DB:

```sql
-- En Neon dashboard > SQL Editor
UPDATE users SET role = 'ADMIN' WHERE email = 'tu-email@ejemplo.com';
```

O regístrate normalmente y luego:
```bash
# Con psql o el SQL editor de Neon/Supabase
UPDATE users SET role = 'ADMIN' WHERE email = 'tu-email@ejemplo.com';
```

---

## 8. Verificación post-deploy

- [ ] `https://tu-dominio.vercel.app` carga la landing
- [ ] `/auth/login` funciona y devuelve token JWT
- [ ] `/solicitar` muestra el catálogo de certificados
- [ ] Flujo Stripe: solicitar → pagar → recibir email de confirmación
- [ ] `/admin` accesible con usuario ADMIN
- [ ] `/api/admin/automatizacion/health` devuelve `{ ok: true }`
- [ ] Cron de automatización (`/api/cron/automatizacion`) responde 200 con `Authorization: Bearer <CRON_SECRET>`
- [ ] Webhook Stripe: enviar un test event desde el dashboard → verificar en `/admin/webhooks`

---

## 9. Dominios personalizados

1. En Vercel: **Settings > Domains** → añade tu dominio
2. Actualiza `NEXTAUTH_URL` con el dominio final
3. Actualiza la URL del webhook de Stripe con el dominio final
4. Re-verifica el dominio en Resend si cambias el subdominio de email

---

## Troubleshooting

**"Prisma migration failed"**
→ Verifica que `DIRECT_URL` apunta al puerto 5432 (directo, sin pooler)

**"Chromium not found"**
→ Verifica `CHROMIUM_REMOTE_EXEC_PATH` en las env vars de Vercel
→ En cold start el primer job tardará ~30s en descargar el binario

**"Stripe webhook signature invalid"**
→ Asegúrate de que `STRIPE_WEBHOOK_SECRET` es el del endpoint de **producción** (whsec_live_...), no el de test

**"CRON_SECRET unauthorized"**
→ Vercel añade `Authorization: Bearer <CRON_SECRET>` automáticamente si la var está configurada
→ Comprueba que el valor en Vercel coincide exactamente con el del handler
