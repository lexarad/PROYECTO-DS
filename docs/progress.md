# Automation Engine — Progress Log

## v0.13 — Engine Production Hardening (2026-04-17)

### Gaps fixed

#### 1. Race condition — atomic job claiming
**File:** `src/lib/automatizacion/runner.ts`

**Problem:** Two concurrent Vercel cron invocations could both `findMany` PENDIENTE jobs
and then both call `procesarJob` on the same job ID, causing a double submission to MJ.

**Fix:** Replaced the initial `update` with an atomic `updateMany WHERE estado IN (PENDIENTE, FALLIDO)`.
PostgreSQL guarantees only one concurrent UPDATE wins. If `claimed.count === 0`, the worker exits immediately.
The rest of the job processing (findUnique, browser execution) happens only after claiming.

---

#### 2. Dead browser recovery
**File:** `src/lib/automatizacion/browser.ts`

**Problem:** The browser singleton `_browser` was reused even after a crash (`.isConnected()` would be false
but the reference was truthy, causing subsequent `.newContext()` calls to throw).

**Fix:** Added `_browser?.isConnected()` check before returning cached instance. Stale reference is reset to null.

---

#### 3. Dry-run mode
**Files:** `src/lib/automatizacion/forms/base.ts`, all 5 form files

**Problem:** No way to test the full execution path (browser launch, MJ connectivity, screenshot upload)
without actually submitting a real form to the Ministerio de Justicia.

**Fix:** Added `isDryRun()` helper checking `AUTOMATION_DRY_RUN=true`. When active:
- `rellenar()`, `seleccionar()` log the action but skip DOM interaction
- `clickBoton()` is skipped entirely
- After the first screenshot (MJ page loaded), forms return `{ ok: true, refOrganismo: 'DRY-RUN' }`

Usage: set `AUTOMATION_DRY_RUN=true` in `.env.local` for local testing.

---

#### 4. Per-job hard timeout (240s)
**File:** `src/lib/automatizacion/runner.ts`

**Problem:** If Playwright hangs (e.g. MJ is slow or returns no response), the job would run
until Vercel kills the function at 300s, with no error logged and no state update.

**Fix:** Added `withTimeout()` wrapping all browser execution in a 240s `Promise.race`.
On timeout, the job transitions to FALLIDO (or REQUIERE_MANUAL if retries exhausted)
with a clear error message.

---

#### 5. Schema validation unit tests
**File:** `src/__tests__/lib/schemas.test.ts` (new — 21 tests)

**Coverage:**
- `nacimientoSchema`: valid data, optional fields, date format, DNI/NIE, phone, CP, uppercase transform
- `matrimonioSchema`: valid data, missing required field, wrong date format
- `defuncionSchema`: valid data, empty name
- `fallecidoSchema`: valid/missing date, invalid/valid NIE
- `validarDatos()`: routing for NACIMIENTO, unsupported types

---

#### 6. MJ health check endpoint
**File:** `src/app/api/admin/automatizacion/health/route.ts` (new)

`GET /api/admin/automatizacion/health` (admin only) returns:
- HTTP reachability of 3 MJ certificate URLs (HEAD request, 8s timeout)
- Current job state counts from DB
- Whether dry-run mode is active

---

### Test suite status
8 test files / **77 tests — all passing**

---

### What's NOT automated (by design)
- `EMPADRONAMIENTO` — per-municipality, no uniform MJ form
- `ANTECEDENTES_PENALES` — requires cl@ve/identity verification of the subject
- `VIDA_LABORAL` — requires Social Security credentials of the subject

These three are handled via the manual tramitación notification (`src/lib/tramitacion/index.ts`).

---

### Next steps (v0.14 candidates)
1. **Live form verification** — run the engine against MJ in dry-run mode to verify current selectors still match
2. **Intermediate log flushing** — periodically save logger state to DB during long jobs
3. **Admin tramitación page** — `/admin/tramitacion` for manual handling of non-automatable types
4. **Deploy to production** — connect real PostgreSQL, configure Vercel env vars, verify Stripe webhook
