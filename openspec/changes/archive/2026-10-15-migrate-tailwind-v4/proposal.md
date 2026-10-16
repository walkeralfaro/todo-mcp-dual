# Proposal

## Why

El proyecto usa Tailwind CSS v3.4 con `tailwind.config.ts` + `autoprefixer` + plugin PostCSS `tailwindcss`. Tailwind v4 (estable desde 2025) es la línea mantenida activamente: compilador Oxide más rápido, configuración CSS-first con `@theme`, y plugin PostCSS dedicado `@tailwindcss/postcss`. Migrar ahora es barato porque la configuración actual es mínima (sin tema extendido, sin plugins, sin `@apply`) y reduce deuda de build antes de añadir más UI.

## What Changes

- Actualizar dependencias: eliminar `tailwindcss@^3` + `autoprefixer` (si queda sin uso), añadir `tailwindcss@^4` y `@tailwindcss/postcss@^4` como sugiere la petición (ver nota sobre `@next` en Impacto).
- Migrar `postcss.config.mjs`: plugin `tailwindcss` → `@tailwindcss/postcss`.
- Migrar `app/globals.css`: `@tailwind base/components/utilities` → `@import "tailwindcss";`.
- Eliminar o vaciar `tailwind.config.ts` (v4 no lo necesita; solo se conservaría si se añade tema custom, que hoy no existe).
- Verificar que el build de Next.js 15.5 + `next build` y los tests (`vitest run`) pasan sin regresión visual (las clases usadas son utilidades estándar: `bg-zinc-*`, `rounded-*`, `flex`, etc.).
- **BREAKING** (build): el pipeline PostCSS cambia de plugin; entornos con Node < 20 o con caché de CI antigua deben actualizarse. Sin cambio en runtime ni en la API/MCP.

## Capabilities

### New Capabilities

_Ninguna — es una migración de tooling/build sin comportamiento observable nuevo._

### Modified Capabilities

_Ninguna — no cambian REQUIREMENTS de `todo-tasks` ni `mcp-tasks`. La UI debe verse idéntica; por eso este change declara `skip_specs: true` en su `.openspec.yaml` (refactor/tooling puro según el schema spec-driven)._

## Impact

- Afectados: `package.json`, `postcss.config.mjs`, `app/globals.css`, `tailwind.config.ts` (eliminación), `package-lock.json`, pipeline CI/build.
- No afectados: capa Prisma/SQLite, Server Actions (`app/actions.ts`), tools MCP (`/api/mcp`), specs existentes.
- Nota sobre `@next`: la petición propone `npm install tailwindcss@next @tailwindcss/postcss@next`. Ese tag era el canal pre-release de v4; a fecha actual (2026) el tag `latest` ya es v4 estable. Instalar `@next` hoy podría traer una v5 alpha inestable. La propuesta evalúa y recomienda `tailwindcss@^4` / `@tailwindcss/postcss@^4` (stable) en vez de `@next`, salvo que se quiera probar beta explícitamente.
- Riesgo principal: diferencias sutiles de preflight/reset entre v3 y v4. Mitigación: revisión visual + build + suite existente. Riesgo bajo dado el uso actual solo de utilidades estándar.
