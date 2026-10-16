# Tasks — upgrade-stack-latest-compatible

## 1. Baseline y Fase 0 segura

- [x] 1.1 Registrar baseline: `npm list --depth=0`, `node --version`, `npm test`, `npx tsc --noEmit` y `npm run build` en verde, y verificar que el log queda guardado junto a la rama
- [x] 1.2 Subir `lucide-react` a 1.58.0, alinear `@types/node` a `^24.x` y eliminar el paquete npm `cn`, y verificar con `npm install` sin errores y `grep -r "from \"cn\"\|from 'cn'"` sin resultados fuera del lockfile
- [x] 1.3 Verificar Fase 0 con `npm test`, `npx tsc --noEmit` y `npm run build` en verde

## 2. Sondeo libsql (Fase 1)

- [x] 2.1 Probar `@libsql/client@0.18.0` contra `@prisma/adapter-libsql@6.19.3` en rama temporal, y verificar con `prisma generate` + `npm test` si se puede subir suelto o debe moverse al pack Prisma 7

## 3. Pack Tooling (Vitest 5)

- [x] 3.1 Subir `vitest@5.0.5` + `vite@^8` (peer requerido) + `@vitejs/plugin-react@5.2.0` (el 6.x exige Vite 8 rolldown, incompatible; el 5.2 admite Vite 4-8) + `jsdom@30.1.3` + `@testing-library/jest-dom@7.0.1` juntos, y verificar `npm install` sin conflictos de peer deps
- [x] 3.2 Adaptar `vitest.config.ts` a la guia v5 (pools, merge de `setupFiles`) solo si la suite lo exige, y verificar con `npm test` en verde incluyendo `lib/mcp.test.ts` y `lib/validators.test.ts`
- [x] 3.3 Verificar tipos con `npx tsc --noEmit` en verde tras el pack Tooling

## 4. Pack Next 16

- [x] 4.1 Subir `next@16.4.2` (mantener `react@19.3.1`), correr el codemod `upgrade` y auditar `cookies|headers|draftMode|params|searchParams` en `app/`, y verificar que no quedan accesos sincronos
- [x] 4.2 Revisar `next.config.ts` e `images.maximumRedirects`, y verificar con `npm run build` + smoke `npm run start` y una pagina + `npx playwright test` smoke en verde

## 5. Pack Prisma 7

- [x] 5.1 Subir `prisma@7.10.1` + `@prisma/client@7.10.1` + `@prisma/adapter-libsql@7.10.1` (+ `@libsql/client@0.18.0` si quedo pendiente), migrar `schema.prisma`/`prisma.config.ts`/imports segun guia v7, y verificar con `prisma validate` + `prisma generate` sin errores
- [x] 5.2 Adaptar `lib/db.ts` y `scripts/apply-schema-turso.mjs` a Prisma 7, y verificar con `prisma db push` en sqlite local y `npm test` (tasks + mcp) en verde
- [x] 5.3 Verificar Turso/`TURSO_DATABASE_URL` y E2E `npx playwright test` en verde, o dejar constancia del pendiente si no hay credenciales

## 6. Pack MCP + Zod (indivisible)

- [x] 6.1 Subir `zod@4.6.7` + `mcp-handler@2.3.0`, añadir `@modelcontextprotocol/server@^2` y retirar `@modelcontextprotocol/sdk`, y verificar `npm install` sin peers rotos
- [x] 6.2 Migrar `lib/validators.ts` (`required_error` -> `error:`) y envolver los 5 `inputSchema` de `app/api/[transport]/route.ts` en `z.object()`, colapsar `createMcpHandler` a 2 args sin `basePath`, y verificar con `npx tsc --noEmit` en verde
- [x] 6.3 Verificar MCP con `npm test` (`lib/mcp.test.ts`, `lib/validators.test.ts`) y una llamada manual a `list_tasks`/`create_task` contra `/api/*` con respuesta `{ content: [{ type: 'text' }] }`

## 7. Cierre e integracion

- [x] 7.1 Verificacion final: `npm test`, `npx tsc --noEmit`, `npm run build` y `npx playwright test` en verde con el lockfile definitivo, y verificar `npx openspec validate --change upgrade-stack-latest-compatible` en verde
- [x] 7.2 Actualizar `README.md`/`requirement.md` solo si cambiaron comandos o versiones minimas (Node, Prisma, MCP), y verificar que los comandos documentados corren como estan escritos
