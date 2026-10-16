# Design

## Context

Ver `proposal.md` (Why). Estado actual: `lib/db.ts` ya conmuta a Turso si hay `TURSO_DATABASE_URL`; `prisma/schema.prisma` sigue `provider = "sqlite"` (compatible Turso); no hay `prisma/migrations/` (flujo `db push`); tests (`lib/tasks.test.ts`, `lib/mcp.test.ts`) y Playwright acoplados a archivo local con `rm -f` + `datasourceUrl`. `.env` local ya tiene credenciales de test; existe segunda DB para prod reservada a Vercel.

## Goals / Non-Goals

**Goals:**
- Probar Vitest + Playwright contra Turso-test con el mismo código que correrá en prod.
- Aislamiento por `DELETE FROM Task` y arranque desde vacío.
- Dejar prod configurada solo en Vercel, sin tocarla en tests.

**Non-Goals:**
- Cambios funcionales de UI/MCP, validación Zod o reglas de `fechaCulminada`.
- Migrar datos de `dev.db` ni introducir `prisma migrate`.
- Cambiar el provider del schema ni añadir dependencias.

## Decisions

- **Reutilizar switch existente en `lib/db.ts`, extraer helper de test.** Alternativa: duplicar construcción del cliente en cada test. Se descarta por duplicación; un helper `newTestClient()` en tests (o `lib/test-db.ts`) centraliza adapter + limpieza.
- **`db push` del CLI no llega a Turso; se aplica el DDL generado por Prisma.** Alternativa: `migrate deploy` en Vercel. Ambas se descartan porque el CLI valida `url` como `file:` (error P1012 con `libsql://`) y el adapter libsql solo sirve en runtime; el `build` queda en `prisma generate && next build`. El mecanismo es: `prisma migrate diff --from-empty --to-schema-datamodel prisma/schema.prisma --script` (Prisma sigue siendo fuente de verdad) + script `scripts/apply-schema-turso.mjs` que ejecuta ese SQL vía `@libsql/client` con `IF NOT EXISTS` para idempotencia.
- **Mismo nombre de var en cada entorno, distinto valor.** Local `.env` = test, Vercel dashboard = prod, ambos `TURSO_DATABASE_URL` / `TURSO_AUTH_TOKEN`. Alternativa: nombres distintos por entorno (`TURSO_TEST_*`). Se descarta porque obligaría a ramificar `db.ts`; la convención mismo-nombre evita errores de código.
- **Playwright: webServer sin `rm`, con limpieza previa por script.** Alternativa: DB efímera por run. Se descarta (coste/complejidad); `fullyParallel: false` ya serializa, basta limpiar tabla al inicio del run global o en fixture.
- **Timeouts Vitest ya en 30s (`vitest.config.ts`), mantener.** Alternativa: subir timeouts. Solo si la latencia Turso lo exige tras primera corrida.

## Risks / Trade-offs

- [Latencia red hace tests más lentos / flaky] → Mitigación: DB test dedicada, serie (no paralelo), reintentos 0 de momento; medir primera corrida.
- [Token caduca o sin permiso escritura] → Mitigación: token con scope a la DB de test; mensaje claro si `db push` falla con 401; documentar rotación en Vercel + local.
- [Olvidar limpiar y contaminar tests] → Mitigación: `beforeEach DELETE`, más aserción de conteo en humo inicial.
- [Apuntar por error a prod desde local] → Mitigación: nunca poner creds prod en `.env`; verificación previa: `SELECT count(*)` debe ser 0 en test antes del push; prod solo existe en dashboard Vercel.
- [Drift de esquema sin migrations] → Mitigación aceptada: proyecto pequeño, `db push` es fuente de verdad hasta que se adopte `migrate` si crece.

## Migration Plan

1. Backup: nada que migrar (arranque vacío acordado); `dev.db`/`e2e.db` quedan como respaldo local ignorado.
2. Push esquema a test con `scripts/apply-schema-turso.mjs`, verificar lista vacía.
3. Adaptar harness Vitest + Playwright, primera corrida verde contra test.
4. Configurar `TURSO_DATABASE_URL`/`TURSO_AUTH_TOKEN` de prod en Vercel (dashboard, entornos Production/Preview), aplicar esquema a prod con el mismo script, deploy y humo `list_tasks`.
5. Rollback: si Turso-test falla, volver a `DATABASE_URL` local quitando `TURSO_*` del `.env` (cero cambios de código); prod no se toca hasta el deploy verificado.
