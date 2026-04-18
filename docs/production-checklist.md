# 🚀 Checklist de Despliegue en Producción

## 📋 Paso 1: Preparar Servicios Externos

### Railway (Worker)
1. Ve a [railway.app](https://railway.app) y crea cuenta/login
2. Click "New Project" → "Deploy from GitHub repo"
3. Conecta tu repo `D:\PROYECTO DS`
4. Railway detectará `Dockerfile.worker` automáticamente
5. Configura variables de entorno (ver sección Variables abajo)

### Supabase (Storage + DB)
1. Ve a [supabase.com](https://supabase.com) y crea cuenta/login
2. Click "New Project"
3. Configura:
   - Name: `certidocs-prod`
   - Database Password: [elige seguro]
   - Region: EU West (London) o similar
4. Espera a que se cree el proyecto (~2 minutos)
5. Ve a SQL Editor y ejecuta `scripts/setup-supabase.sql`
6. Ve a Settings → API y copia las URLs/keys

### Sentry (Monitoreo)
1. Ve a [sentry.io](https://sentry.io) y crea cuenta/login
2. Click "Create Project"
3. Elige:
   - Platform: Node.js
   - Project name: `certidocs-worker`
4. Copia el DSN de la página de configuración

## 🔧 Paso 2: Variables de Entorno

### En Railway (Worker):
```
DATABASE_URL=[de Supabase]
DIRECT_URL=[de Supabase, sin pooler]
NEXT_PUBLIC_SUPABASE_URL=[de Supabase]
SUPABASE_SERVICE_ROLE_KEY=[de Supabase]
SENTRY_DSN=[de Sentry]
NODE_ENV=production
```

### En Vercel (API - ya existente):
```
DATABASE_URL=[de Supabase]
DIRECT_URL=[de Supabase]
NEXTAUTH_SECRET=[ya configurado]
NEXTAUTH_URL=https://certidocs-xi.vercel.app
STRIPE_SECRET_KEY=[ya configurado]
STRIPE_WEBHOOK_SECRET=[ya configurado]
NEXT_PUBLIC_SUPABASE_URL=[de Supabase]
RESEND_API_KEY=[ya configurado]
ADMIN_EMAIL=[ya configurado]
```

## 🚀 Paso 3: Despliegue

### Railway:
1. Una vez configuradas las variables, Railway desplegará automáticamente
2. Ve a "Deployments" para ver el progreso
3. Cuando esté "SUCCESS", el worker estará corriendo

### Vercel (si necesitas redeploy):
```bash
git add .
git commit -m "feat: production deployment setup"
git push origin main
```

## 🧪 Paso 4: Testing en Producción

### Ejecutar test local:
```bash
npm run test:production
```

### Verificar en producción:
1. **Railway Logs**: Deberías ver `Worker worker-... started`
2. **Supabase Storage**: PDFs en bucket `certificados`
3. **Sentry**: No errores iniciales
4. **Admin Panel**: Jobs procesándose automáticamente

## 📊 Paso 5: Monitoreo

### Verificar funcionamiento:
- Jobs pasan de `PENDIENTE` → `EN_CURSO` → `COMPLETADO`
- PDFs se generan y suben correctamente
- Emails se envían automáticamente
- Alertas en Sentry solo para errores reales

### Métricas clave:
- ✅ Jobs completados automáticamente: >95%
- ✅ Tiempo de respuesta: <5 minutos
- ✅ PDFs accesibles públicamente
- ✅ Sin intervención manual requerida

## 🆘 Troubleshooting

### Worker no inicia:
- Verificar todas las variables de entorno
- Revisar Railway logs para errores específicos
- Verificar conexión a DB: `npm run db:push`

### PDFs no se suben:
- Verificar bucket `certificados` existe en Supabase
- Revisar `SUPABASE_SERVICE_ROLE_KEY`
- Verificar políticas de storage

### Errores en Sentry:
- Revisar scraping: `npm run mj:test`
- Verificar credenciales de Supabase

## 🎯 Checklist Final

- [ ] Railway project creado y conectado
- [ ] Supabase project configurado con bucket
- [ ] Sentry project creado
- [ ] Variables de entorno configuradas
- [ ] Worker desplegado exitosamente
- [ ] Test de producción pasa
- [ ] Primer job procesado automáticamente
- [ ] PDF generado y accesible

¡El sistema está listo para recibir pagos reales! 🎉