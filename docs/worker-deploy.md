# 🚀 Despliegue del Worker de Automatización

## 📋 Requisitos Previos

1. **Cuenta en Railway** (railway.app) o Render (render.com)
2. **Proyecto Supabase** configurado con bucket "certificados"
3. **Proyecto Sentry** para monitoreo
4. **Base de datos PostgreSQL** (Neon o Supabase)

## 🏗️ Configuración del Despliegue

### 1. Railway (Recomendado)

1. **Crear proyecto en Railway:**
   - Ve a [railway.app](https://railway.app)
   - Conecta tu repositorio GitHub
   - Railway detectará automáticamente el `Dockerfile.worker`

2. **Variables de entorno:**
   ```bash
   DATABASE_URL=postgresql://...
   DIRECT_URL=postgresql://...
   NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=tu-service-role-key
   SENTRY_DSN=https://tu-dsn@sentry.io/project-id
   NODE_ENV=production
   ```

3. **Configurar health check:**
   - Railway detectará automáticamente el puerto (no expone ninguno)
   - El worker no necesita puerto expuesto

### 2. Render

1. **Crear Web Service:**
   - Ve a [render.com](https://render.com)
   - Crea un "Web Service" desde tu repo
   - Selecciona "Docker" como runtime

2. **Configuración:**
   - **Dockerfile Path:** `Dockerfile.worker`
   - **Health Check Path:** `/health` (no aplica, pero requerido)
   - Variables de entorno igual que arriba

## 🗄️ Configuración de Supabase

1. **Crear bucket:**
   ```sql
   -- En Supabase SQL Editor
   INSERT INTO storage.buckets (id, name, public)
   VALUES ('certificados', 'certificados', true);
   ```

2. **Política de acceso:**
   ```sql
   -- Permitir acceso público a PDFs
   CREATE POLICY "Public Access" ON storage.objects
   FOR SELECT USING (bucket_id = 'certificados');
   ```

## 📊 Monitoreo con Sentry

1. **Crear proyecto en Sentry:**
   - Ve a [sentry.io](https://sentry.io)
   - Crea un proyecto Node.js
   - Copia el DSN

2. **Alertas configuradas:**
   - Errores en scraping
   - Jobs que requieren intervención manual
   - Fallos de conexión a DB/Supabase

## 🚦 Verificación del Despliegue

### Ejecutar test de producción:
```bash
npm run test:production
```

### Verificar logs en Railway/Render:
- Deberías ver: `Worker worker-... started`
- Jobs procesándose automáticamente

### Verificar en Supabase:
- PDFs subidos al bucket "certificados"
- Documentos creados en tabla `documentos`

## 🔧 Comandos Útiles

```bash
# Ejecutar worker localmente
npm run worker

# Test de producción
npm run test:production

# Ver logs del worker
# En Railway: railway logs
# En Render: render logs
```

## 📈 Escalado

- **Railway:** Auto-escala basado en uso
- **Render:** Configura instancias manualmente
- Para alta carga: múltiples instancias del worker

## 🆘 Troubleshooting

### Worker no inicia:
- Verificar variables de entorno
- Revisar conexión a DB
- Verificar credenciales Supabase

### PDFs no se suben:
- Verificar bucket "certificados" existe
- Revisar SUPABASE_SERVICE_ROLE_KEY
- Verificar permisos del bucket

### Errores en Sentry:
- Revisar logs detallados
- Verificar scraping funciona (npm run mj:test)

¡El sistema está listo para producción! 🎉