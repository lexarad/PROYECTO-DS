# Workflow de Mejora Iterativa — CertiDocs

> Ejecutar una iteración cada vez que trabajes en el proyecto. Cada iteración = ~5 minutos de trabajo real.

---

## Iteración N.º: 2 | Fecha: 2026-04-17 | Tiempo invertido: ~15min

### 1. Revisión rápida del estado (30s)

```
npm run lint
npm run typecheck 2>&1 | head -20
npm test -- --run 2>&1 | tail -10
```

- [x] Lint pasa (con warnings)
- [x] TypeScript compila
- [x] Tests passando (93)

### 2. Escoger tarea de mejora (1min)

**Elegir una de esta lista priorizada:**

- [x] ~~**Bug:**~~ ~~Ningún error en producción?~~
- [x] ~~**Test coverage:**~~ ~~Añadir test para función sin cobertura~~
- [ ] **Type safety:** any -> tipo concreto
- [ ] **UX:** Mejora visual o de flujo
- [ ] **Seguridad:** Validación adicional, headers
- [x] **Tech debt:** Crear configuración ESLint (.eslintrc.json) ✅
- [ ] **Documentación:** README, comentarios, typos

### 3. Implementar cambios (3min)

```
# Hacer el cambio mínimo necesario
# Commit atómico si funciona
```

### 4. Verificar (30s)

```
npm run lint && npm run typecheck && npm test -- --run
```

- [x] Todo verde → **Listo**

### Resultado de la iteración

**Cambio realizado (iter 1):**
- Creado `.eslintrc.json` con config básica + reglas relajadas para `any`, unused vars

**Cambio realizado (iter 2):**
- `.gitignore` completo actualizado
- `docker-compose.yml` con Redis añadido
- Script `scripts/setup.ts` para setup automático
- Prisma `seed.ts` con datos de ejemplo
- Tests de email.ts añadidos (12 tests)

---

## Historial de iteraciones

| Iter | Fecha | Tests | Cambios |
|------|-------|-------|---------|
| 1 | 2026-04-17 | 93 | ESLint config |
| 2 | 2026-04-17 | 105 | .gitignore, docker-compose, setup, seed, email tests |

---

## Tareas pendientes por hacer

### Alta prioridad
- [ ] Conectar PostgreSQL real y ejecutar `prisma db push`
- [ ] Verificar selectors MJ en dry-run mode
- [ ] Desplegar a producción (Vercel + vars)
- [ ] Crear página `/admin/tramitacion` para manuales

### Media prioridad
- [ ] Test coverage para automation runner
- [ ] Test coverage para webhook delivery
- [ ] Mejora de rendimiento en queries grandes
- [ ] Cacheo de stats en `/api/stats`

### Baja prioridad
- [ ] Animaciones en transitions de estado
- [ ] Modo oscuro
- [ ] Exportación a JSON/XML
- [ ] Webhooks de entrada (Stripe, Resend)

---

## Commands útiles

```bash
# Desarrollo
npm run dev

# Tests
npm test              # unitarios
npm run test:e2e     # e2e (Playwright)
npm run test:watch   # watch mode

# Calidad
npm run lint
npm run build

# BD
npm run db:studio
npm run db:push

# Deploy
git add . && git commit -m "fix: ..." && git push
```

---

## Checklist de release

Antes de hacer release/tag:
- [ ] `npm run lint` sin errores
- [ ] `npm run typecheck` sin errores
- [ ] `npm test -- --run` passando
- [ ] `npm run build` succeeding
- [ ] `.env.example` actualizado si hay nuevas vars
- [ ] `docs/roadmap.md` actualizado con cambios
- [ ] `docs/progress.md` actualizado si es fix notable

---

*Iterar: completar →push → próxima iteración.*