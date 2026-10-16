# Design — upgrade-stack-latest-compatible

## Context

Estado actual (verificado con `npm list` + `npm view` + Context7): Next 15.5.28 (= ultimo 15.x), Prisma 6.19.3 (= ultimo 6.x, tag `prev`), Zod 3.25.76 (= ultimo 3.x), mcp-handler 1.1.0, SDK 1.26.0, Vitest 2.1.9, TS 5.9.3, libsql 0.15.15, Node 24. Ver motivacion en `proposal.md`. Puntos de friccion conocidos en el codigo: `lib/validators.ts:7` (`required_error`), `app/api/[transport]/route.ts:12-76` (3 args + `basePath` + shapes sueltos), `lib/db.ts:1-17` (`adapter` + `datasourceUrl`), `prisma/schema.prisma:1-8` (datasource+generator v6), `vitest.config.ts` (pools forks), dependencia npm `cn` sobrante frente a `cn()` local en `lib/utils.ts`.

## Goals / Non-Goals

**Goals:**
- Dejar cada dependencia en su ultima estable **compatible**, con lockfile reproducible y suite verde.
- Migrar los 4 packs breaking con codemods/docs oficiales y adaptadores de codigo puntuales.
- Preservar el principio de estado unico (Server Actions y tools MCP sobre la misma capa Prisma/SQLite).

**Non-Goals:**
- No se salta a `prisma@8 RC` ni a `typescript@7` nativo.
- No se cambian modelos de datos ni comportamiento de tareas (sin specs).
- No se adopta `@vercel/mcp-adapter` (solo mencionado en README/AGENTS; el codigo usa `mcp-handler`).

## Decisions

1. **Orden por acoplamiento, de fuera hacia dentro**: Fase 0 segura -> libsql-sondeo -> Pack Tooling (vitest) -> Pack Next -> Pack Prisma -> Pack MCP+Zod en ultimo lugar (es el que mas reescribe: validacion + ruta API).
   Alternativa descartada: subir todo de golpe con `npm update` — impide bisecar que pack rompio la suite.
2. **Versiones pinnadas objetivo**:
   - `next@16.4.2`, `react@19.3.1`, `react-dom@19.3.1`, `@types/react@19.3.0`, `@types/react-dom@19.3.0`.
   - `prisma@7.10.1`, `@prisma/client@7.10.1`, `@prisma/adapter-libsql@7.10.1`, `@libsql/client@0.18.0`.
   - `zod@4.6.7`, `mcp-handler@2.3.0`, `+ @modelcontextprotocol/server@^2`, `- @modelcontextprotocol/sdk`.
   - `vitest@5.0.5` + `vite@^8` explicito (peer de vitest 5) + `@vitejs/plugin-react@5.2.0` (el 6.x exige Vite 8 rolldown; el 5.2 admite Vite 4-8 y es el pin compatible), `jsdom@30.1.3`, `@testing-library/jest-dom@7.0.1`, `@testing-library/react@16.3.3` (mantener).
   - `typescript@^5.9.3` (mantener linea 5), `@types/node@^24.x`, `lucide-react@1.58.0`, `- cn` (eliminar).
   - Mantener: `tailwindcss@4.3.3`, `@tailwindcss/postcss@4.3.3`, `postcss@8.5.30`, `@playwright/test@1.64.1`, radix, `clsx`, `tailwind-merge`, `class-variance-authority`, `tw-animate-css@1.4.0`.
3. **Pack Next 16**: correr `npx next@16 upgrade` (codemod a async request APIs) y auditar `app/` por `cookies/headers/draftMode/params/searchParams` sincronos. Revisar `next.config.ts` (`serverExternalPackages` sigue valido en 16) y `images.maximumRedirects` si se usa.
   Alternativa: quedarse en 15.5.28 — se descarta por el alcance C confirmado.
4. **Pack Prisma 7**: seguir guia oficial `upgrade v7` (Context7 `/prisma/web`): actualizar CLI+client+adapter a la vez, mover `url` del `datasource` a `prisma.config.ts`, corregir `generator` e imports (`@prisma/client` default -> ruta generada/`client`), adaptar `lib/db.ts` (constructor con adapter, revisar `datasourceUrl`), regenerar cliente y revalidar `scripts/apply-schema-turso.mjs` + `prisma db push` en sqlite local y Turso.
5. **Pack MCP+Zod indivisible**: `z.string({ required_error })` -> `z.string({ error: (i) => i.input === undefined ? "..." : "..." })`; envolver cada `inputSchema` suelto en `z.object({...})`; `createMcpHandler(init, serverOpts, config3args)` -> `createMcpHandler(init, { ...serverOpts, serverInfo, verboseLogs })`, eliminar `basePath` y montar la ruta donde se quiera exponer; quitar `redis`/SSE opts si aparecieran. Fuente: `Migrating from 1.x` (`/vercel-labs/mcp-handler`) + changelog Zod v4.
6. **Pack Tooling**: subir vitest+plugin-react+jsdom juntos; revisar `vitest.config.ts` (`poolOptions.forks`, merge de `setupFiles`, `projects.extends`) segun `docs/guide/migration` v5; `jsdom 30` + `jest-dom 7` se validan con la suite existente.
7. **TypeScript diferido**: no migrar a 7 nativo; la doc oficial (`/microsoft/typescript-go`) recomienda mantener la linea JS para tooling y, como mucho, coexistencia via alias `@typescript/native`. Se deja fuera para no romper plugin `next` + eslint.

## Risks / Trade-offs

- [Pack Prisma 7 cambia config e imports] -> Mitigacion: hacerlo en rama propia, `prisma validate/generate/db push` en sqlite local primero, luego Turso; rollback = revert de rama.
- [Pack MCP v2 reescribe la ruta API] -> Mitigacion: reescribir los 5 `inputSchema` a `z.object`, test MCP (`lib/mcp.test.ts`) en la misma rama; rollback = revert.
- [Zod 4 cambia mensajes de error] -> Mitigacion: fijar expectativas en `lib/validators.test.ts` tras migrar `error:`; revisar mensajes en UI.
- [Next 16 async APIs ocultos en `app/`] -> Mitigacion: `grep` de `cookies|headers|draftMode|params|searchParams` + build; codemod oficial.
- [Vitest 5 cambia pools/config] -> Mitigacion: suite en un solo worker ya existe (`singleFork`); ajustar segun guia v5.
- [libsql 0.18 incompatible con adapter 6] -> Mitigacion: sondeo previo; si falla, se mueve al pack Prisma 7 y no se sube suelto.
- Trade-off aceptado: mas ramas y tiempo a cambio de bisectabilidad y rollbacks limpios.

## Migration Plan

1. Rama por pack desde `main`, en el orden de Decisiones-1.
2. En cada rama: `npm install <pines exactos>`, `prisma generate` cuando toque, `npm test` (vitest), `npx tsc --noEmit`, `npm run build`, `npx playwright test` (al menos smoke) en los packs Next/Prisma/MCP.
3. Criterio de avance: suite verde + build verde. Si un pack no pasa, se revierte esa rama y se replanifica solo ese pack.
4. Cierre: `package-lock.json` actualizado, README tocado solo si cambian comandos, `npx openspec validate --change upgrade-stack-latest-compatible` en verde.

## Open Questions

- Ninguna que bloquee el plan: las compatibilidades dudosas (libsql 0.18 vs adapter 6) se resuelven con el sondeo de la tarea 2.
