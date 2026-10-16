# Design

## Context

Estado actual (verificado en repo):
- `tailwindcss@^3.4` + `postcss@^8.4` + `autoprefixer@^10.4` (devDeps), `postcss.config.mjs` con `tailwindcss: {}` + `autoprefixer: {}`.
- `tailwind.config.ts`: solo `content: ["./app/**", "./components/**"]`, `theme.extend: {}`, sin plugins.
- `app/globals.css`: 3 líneas (`@tailwind base/components/utilities`), sin `@apply`, sin `@layer` custom, sin colores propios.
- Uso en `app/` + `components/`: solo utilidades estándar (`bg-zinc-*`, `rounded-*`, `flex`, `space-y-*`, `text-sm`, etc.).
- Stack: Next.js 15.5.28 + React 19, Node 22 (types). Next 15 soporta oficialmente el plugin `@tailwindcss/postcss` de v4.

Ver propuesta (`proposal.md` — Why) para la motivación. Specs omitidos a propósito (`skip_specs: true`): la UI debe quedar pixel-idéntica.

## Goals / Non-Goals

**Goals:**
- Migrar el pipeline de estilos a Tailwind v4 estable con el mínimo diff posible.
- Dejar `next dev` / `next build` verdes y la suite `vitest run` pasando.
- Documentar la decisión `@next` vs `latest` (estable) para no arrastrar un tag pre-release.

**Non-Goals:**
- No rediseñar UI ni añadir tokens/temas nuevos (`@theme` solo si hiciera falta paridad).
- No tocar Prisma, Server Actions ni tools MCP (principio de estado único intacto).
- No adoptar utilidades v4-only (p. ej. `@utility`) ni refactors de clases en componentes.

## Decisions

1. **Versión objetivo: `tailwindcss@^4` + `@tailwindcss/postcss@^4` (stable), NO `@next`.**
   - Por qué: `@next` era el canal pre-release de v4; en 2026 `latest` ya es v4 estable. Fijar `^4` evita que un futuro `npm install` traiga una v5 alpha.
   - Alternativa descartada: seguir la sugerencia literal (`@next`) — solo tendría sentido para probar beta explícita, fuera de alcance.
   - Verificación: `npm view tailwindcss version` / `dist-tags` antes de fijar rango.

2. **Plugin PostCSS: `@tailwindcss/postcss`, eliminar `tailwindcss:{}` y `autoprefixer`.**
   - Por qué: v4 mueve el plugin a paquete separado; v4 ya aplica prefijos vía Lightning CSS, `autoprefixer` queda redundante (verificar que nada más lo use antes de desinstalar).
   - `postcss.config.mjs` resultante: `{ plugins: { "@tailwindcss/postcss": {} } }`.
   - Alternativa: mantener `autoprefixer` por inercia — inofensivo pero añade dependencia muerta.

3. **CSS-first: `app/globals.css` → `@import "tailwindcss";`.**
   - Por qué: es el entrypoint canónico v4; las 3 directivas `@tailwind` desaparecen en v4.
   - No se introduce `@theme` porque no hay tokens custom que portar. Si la comparativa visual detectara un tono/espaciado distinto, el fallback es un bloque `@theme` mínimo de paridad (no previsto).

4. **`tailwind.config.ts`: eliminar (preferido) vs. conservar vacío.**
   - Decisión: eliminar el archivo y verificar que ningún import lo referencia (hoy nadie lo importa, solo lo lee el CLI v3).
   - Alternativa: conservarlo + directiva `@config` en CSS para compat — solo si se quiere migración por fases; añade deuda, no se recomienda con una config vacía.

5. **Manual mínimo vs. `npx @tailwindcss/upgrade`.**
   - Decisión: migración manual (3 archivos + deps) + `npx @tailwindcss/upgrade` opcional en una rama de contraste para detectar clases renombradas/removed.
   - Por qué: la config es trivial; el upgrade automático aporta poco y puede tocar más archivos de lo necesario. Usarlo como linter, no como driver.

## Risks / Trade-offs

- [Riesgo] Preflight v3→v4 con diferencias sutiles (bordes, placeholders, `ring`, `shadow`) → Mitigación: `next build` + revisión visual de `app/page.tsx`, `task-form`, `task-item`, `task-filters` en desktop/móvil; capturas antes/después.
- [Riesgo] `@next` instala major futura inestable → Mitigación: fijar `^4` y revisar `package-lock.json` (debe resolver 4.x).
- [Riesgo] Caché CI / Node antiguo rompe el build (v4 exige Node ≥ 20) → Mitigación: documentar requisito Node 20+ (repo ya usa Node 22) y limpiar caché si el build falla.
- [Riesgo] `autoprefixer` aún referenciado por otra herramienta → Mitigación: `grep autoprefixer` antes de desinstalar; si aparece, conservarlo.
- Trade-off: eliminar `tailwind.config.ts` rompe a quien edite tema en JS — aceptado: v4 dicta CSS-first y no hay tema que perder.

## Migration Plan

1. Rama `chore/migrate-tailwind-v4`. `npm view` para confirmar tags.
2. `npm uninstall tailwindcss autoprefixer && npm install -D tailwindcss@^4 @tailwindcss/postcss@^4` (revisar si `autoprefixer` se conserva).
3. Reescribir `postcss.config.mjs` + `app/globals.css`, eliminar `tailwind.config.ts`.
4. `npm run dev` (compila), `npm test` (`vitest run`), `npm run build` (+ `prisma generate` según script).
5. Revisión visual de flujos (crear/filtrar/completar tarea) + Playwright si está configurado.
6. Rollback: revert del commit + `npm ci` restaura v3 (cambio atómico, sin migración de datos).

## Open Questions

- Ninguna que bloquee specs/diseño/tareas. Solo confirmar en implementación: ¿se conserva `autoprefixer` si alguna otra dependencia lo exige? (se resuelve con `grep` + `npm ls` en la tarea 1).
