# Proposal — upgrade-stack-latest-compatible

## Why

Las dependencias del proyecto estan una o varias majors por detras de la ultima estable compatible (Next 15, Prisma 6, Zod 3, mcp-handler 1, Vitest 2, TS 5). Mantenerlas retrasa parches de seguridad, bloquea el pack MCP moderno (mcp-handler 2 exige Zod 4 + SDK server 2) y acumula deuda de migracion. Alcance confirmado: **C full**, ultimas versiones **compatibles** (no RCs ni nativos incompatibles).

## What Changes

Fase 0 — segura (sin breaking):
- `@modelcontextprotocol/sdk` 1.26.0 -> 1.32.1 **solo si** el pack MCP-2 se retrasa; si el pack MCP-2 entra, este punto se sustituye por el pack.
- `lucide-react` 1.57.0 -> 1.58.0.
- Eliminar dependencia npm `cn` (^0.4.0): `lib/utils.ts` ya define su propio `cn()` con `clsx + tailwind-merge`; el paquete de npm es sobrante.
- Alinear `@types/node` a la linea del runtime (Node 24 -> `^24.x`, no `^26`).
- Todo lo ya al dia se queda: `react`/`react-dom` 19.3.1, `tailwindcss` 4.3.3, `@playwright/test` 1.64.1, radix, `clsx`, `tailwind-merge`, etc.

Fase 1 — compatibilidad libsql:
- `@libsql/client` 0.15.15 -> 0.18.0 **solo si** `@prisma/adapter-libsql@6.19.3` lo tolera; si no, se mueve al pack Prisma 7.

Fase 2 — packs con **BREAKING** (cada uno en su rama, con suite verde antes de seguir):
- **Pack Next**: `next` 15.5.28 -> 16.4.2. **BREAKING**: `cookies()`/`headers()`/`draftMode()`/`params`/`searchParams` solo asincronos; `images.maximumRedirects` por defecto 3. Requiere Node >= 20.9 (cumplido: Node 24).
- **Pack Prisma**: `prisma` + `@prisma/client` 6.19.3 -> 7.10.1, `@prisma/adapter-libsql` -> 7.10.1, `@libsql/client` -> 0.18.0. **BREAKING**: `provider = "prisma-client-js"` e import default de `@prisma/client` cambian; `datasource url` sale del schema a `prisma.config.ts`. Se excluye expresamente `8.0.0-rc.23` (RC).
- **Pack MCP+Zod (indivisible)**: `zod` 3.25.76 -> 4.6.7, `mcp-handler` 1.1.0 -> 2.3.0, sustituir `@modelcontextprotocol/sdk@1.x` por `@modelcontextprotocol/server@^2`. **BREAKING**: `required_error`/`invalid_type_error`/`errorMap` eliminados (hay un uso en `lib/validators.ts:7`); `createMcpHandler(init, serverOpts, config)` pasa a 2 args sin `basePath`; `inputSchema` exige `z.object()` completo en vez de shape suelto (5 tools en `app/api/[transport]/route.ts`).
- **Pack Tooling test**: `vitest` 2.1.9 -> 5.0.5 (requiere Vite >= 6.4 y Node >= 22.12), `@vitejs/plugin-react` 4.7.0 -> 6.1.2, `jsdom` 25 -> 30.1.3, `@testing-library/jest-dom` 6.9.1 -> 7.0.1. Posible ajuste de `vitest.config.ts` (pools, `setupFiles` merge).
- **TypeScript**: se queda en `^5.9.x` (5.9.3 actual). **No** se salta a `7.0.2` nativo (Go) en este change: la recomendacion oficial es mantener `typescript@6`-linea JS para tooling (`typescript-eslint`, plugin `next`) y, como mucho, probar 7 como alias `@typescript/native` fuera de este change. Se registra como diferido.

## Capabilities

### New Capabilities
- Ninguna: es mantenimiento de dependencias, sin cambio de comportamiento observable.

### Modified Capabilities
- Ninguna: no cambian requirements de `todo-tasks`, `mcp-tasks` ni `turso-environments`.

Se marca `skip_specs: true` en `.openspec.yaml` (cambio de tooling/dependencias, sin comportamiento nuevo).

## Impact

- Archivos afectados: `package.json`, `package-lock.json`, `lib/validators.ts`, `app/api/[transport]/route.ts`, `lib/db.ts`, `prisma/schema.prisma`, (nuevo) `prisma.config.ts` si Prisma 7 lo exige, `vitest.config.ts`, `tsconfig.json` (solo si el pack lo requiere), `scripts/apply-schema-turso.mjs`, `next.config.ts`, `README.md` si cambian instrucciones.
- Sistemas: build Next, `prisma generate`/`db push`, suite Vitest, E2E Playwright, endpoint MCP `/api/*`.
- Riesgo principal: packs acoplados (MCP+Zod; Prisma+libsql; Vitest+jsdom+plugin-react). Orden y criterios de rollback en `design.md`.
