# Proposal — fix-vercel-prisma-config-database-url

## Why

El deploy en Vercel falla en `postinstall > prisma generate` con `PrismaConfigEnvError: Cannot resolve environment variable: DATABASE_URL`. La config de Prisma 7 exige esa variable sin fallback, pero en Vercel no existe (convención del proyecto: solo `TURSO_*`; `DATABASE_URL` vive únicamente en el `.env` local no commiteado).

## What Changes

- `prisma.config.ts`: `datasource.url` pasa de `env("DATABASE_URL")` (obligatorio) a `process.env.DATABASE_URL ?? "file:./dev.db"` (fallback local).
- Sin cambios de comportamiento en runtime: `lib/db.ts` sigue prefiriendo `TURSO_*` cuando existen (Vercel prod); el fallback solo se usa cuando no hay `DATABASE_URL` (build/generate en Vercel, local sin `.env`).
- Sin nuevas dependencias ni cambios de esquema.

## Capabilities

### New Capabilities
- Ninguna: fix de configuración de build, sin cambio observable.

### Modified Capabilities
- Ninguna: no cambian requirements de `todo-tasks`, `mcp-tasks` ni `turso-environments`.

Se marca `skip_specs: true` (fix de build/deploy, sin comportamiento nuevo).

## Impact

- Archivos: `prisma.config.ts` (1 línea), `package-lock.json` sin cambios.
- Sistemas: `postinstall` (`prisma generate`), build de Vercel (`apply-schema-turso` + `generate` + `next build`), CLI local (`db push`, `migrate diff`, `validate`).
- Riesgo mínimo: el fallback `file:./dev.db` nunca se usa en prod (Turso manda) ni en local con `.env` (dotenv ya carga `DATABASE_URL`).
