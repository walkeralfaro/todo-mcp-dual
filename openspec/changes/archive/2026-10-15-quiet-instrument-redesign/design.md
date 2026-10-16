# Design

## Context

Verificado en repo: `app/page.tsx` (server component, `listTasks` con filtro/búsqueda, cabecera "Tareas"), `app/layout.tsx` (`max-w-3xl`, zinc), `app/globals.css` (`@import "tailwindcss"`, Tailwind v4 — tokens vía `@theme`), tres client components con `data-testid` estables usados por `e2e/todo.spec.ts` (flujo crear/filtrar/editar/completar/borrar). Sin tema custom ni fuentes propias. Ver propuesta (`proposal.md` — Why) para la motivación y la hoja de dirección `quiet-instrument` (columna 440–560px, filas `two-ended rows`, paleta rose-grey/green, Stack Sans, motion `masked headline`).

## Goals / Non-Goals

**Goals:**
- Aplicar la dirección quiet-instrument a las 6 superficies (layout, cabecera, formulario, filtros, filas, pie) con un solo radio, un solo par de márgenes y tokens compartidos.
- Conservar lógica, flujos y `data-testid` intactos: solo cambian clases, tokens y microcopy de cabecera.
- Dejar E2E + Vitest + `next build` verdes y contraste AA verificado.

**Non-Goals:**
- Sin cambios de datos, Server Actions, validaciones, MCP ni orden/filtros.
- Sin animaciones elaboradas en esta fase (solo reveal enmascarado del titular con `prefers-reduced-motion`); la capa de motion completa queda fuera.
- Sin modo oscuro ni nuevos tokens `@theme` más allá de la paleta.

## Decisions

1. **Fuente vía `<link>` a Google Fonts (Stack Sans Headline 300 + Stack Sans Text 400/500) con fallback `system-ui`.**
   - Por qué: la cara existe en Google Fonts pero NO en los datos de `next/font` de Next 15.5 (solo `Short Stack`), así que `next/font/google` falla en tipos. El `<link>` de la propia hoja de dirección + `display: swap` mantiene el build independiente de la red (la fuente degrada a `system-ui` offline).
   - Tokens `--font-display` / `--font-text` ya definidos en `@theme`; `body` usa `font-text`.
2. **Tokens en `app/globals.css` con `@theme`: `--color-ground #ebe5e3`, `--color-surface #e1dad7`, `--color-ink #2b2622`, `--color-muted #6a615d`, `--color-accent #0f7d45`.**
   - Por qué: Tailwind v4 CSS-first; utilidades (`bg-ground`, `text-ink`…) se generan solas. Sin `tailwind.config` (eliminado en el change anterior).
3. **Titular del día calculado en servidor en `page.tsx`** a partir del mismo `listTasks` (conteo de no completadas con el filtro/búsqueda activos). Cero pendientes → "Todo al día".
   - Por qué: cero JS cliente, cifra siempre coherente con el listado visible. Supuesto registrado: el conteo respeta `estado`/`q` activos.
4. **Filas sin cajas en `task-item.tsx`**: `li` sin `border`/`bg-white`, 34–38px desktop / 44px táctil en móvil, título + estado en extremos; controles (select, editar, eliminar) conservan posición y testids, reestilizados quiet (bordes solo dentro del formulario/fragmento, según house rules).
5. **Filtros como botones de texto sobrio** con estado activo en tinta plena (o punto verde solo para COMPLETADA); se elimina la pastilla `bg-zinc-900`. Búsqueda conserva input y comportamiento `router.push`.
6. **Verde solo en primario + COMPLETADA.** Si el contraste de `#0f7d45` sobre `#ebe5e3` no llega a AA para texto pequeño, se usa solo en superficies grandes y el texto de estado pasa a tinta plena con dot verde (decisión a confirmar en implementación con medidor).

## Risks / Trade-offs

- [Riesgo] Contraste del verde o del `muted #6a615d` bajo AA → Mitigación: medir con inspector/axe en la tarea de verificación; fallback a tinta plena + dot.
- [Riesgo] Filas sin cajas pierden affordance de "clicable" → Mitigación: controles siempre visibles (no hover-only), foco visible, E2E sin cambios como red de seguridad.
- [Riesgo] Stack Sans no disponible en `next/font` o build offline → Mitigación: fallback stack `system-ui` definido; el build no falla, solo degrada la cara.
- Trade-off: titular con cifra duplica conteo (query extra o cómputo sobre `listTasks`) — coste despreciable (≤50 filas) a cambio de coherencia servidor.

## Migration Plan

1. Tokens + fuente (globals, layout) → cabecera con cifra → formulario → filtros → filas → pie.
2. Tras cada grupo: `vitest run` rápido + E2E al final + `next build`.
3. Rollback: revert del commit (cambio atómico, sin datos).

## Open Questions

- Ninguna bloqueante. Microcopy exacto del titular ("Hoy quedan N" / "Todo al día") confirmado como supuesto de diseño; UI en español ya exigido por spec.
