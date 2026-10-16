# Proposal

## Why

Los tests (Vitest + Playwright) corren hoy contra SQLite local en archivo (`dev.db` / `e2e.db` / tmp), mientras producción en Vercel usará Turso remoto. Esa divergencia oculta errores de adapter, latencia y entorno justo antes de subir a Vercel. Hay que probar ya contra la DB de test de Turso, con prod separada e intocable.

## What Changes

- El entorno local de pruebas usa la DB de **test** de Turso (URL + token ya configurados en `.env`, partiendo vacía).
- El esquema `Task` se crea en Turso-test con un único `prisma db push` (sin migraciones, sin importar `dev.db`).
- El harness de Vitest (`lib/tasks.test.ts`, `lib/mcp.test.ts`) construye el cliente con `@libsql/client` + `@prisma/adapter-libsql` cuando hay `TURSO_*`, y aísla cada test con `DELETE FROM Task`.
- Playwright usa la misma DB de test con limpieza por tablas (ya no `rm -f e2e.db`).
- La DB de **prod** de Turso (segunda URL) queda reservada para Vercel y ningún test la toca.
- Sin cambios funcionales de UI ni de tools MCP: mismo CRUD, validación y reglas de `fechaCulminada`.

## Capabilities

### New Capabilities

- `turso-environments`: persistencia remota por entornos en Turso (test vs prod), selección de cliente por variables `TURSO_*`, esquema inicial vacío vía `db push`, y aislamiento de pruebas por limpieza de tablas.

### Modified Capabilities

- Ninguna. `todo-tasks` y `mcp-tasks` no cambian comportamiento observable.

## Impact

- Afecta: `lib/db.ts` (ya con switch Turso, sin cambios funcionales), `lib/tasks.test.ts`, `lib/mcp.test.ts`, `playwright.config.ts`, `.env` / `.env.example`, docs de deploy Vercel.
- Dependencias ya instaladas: `@libsql/client`, `@prisma/adapter-libsql` (sin nuevas).
- Riesgo principal: latencia red en tests y tokens con caducidad; mitigado con DB de test dedicada y limpieza por tablas.
