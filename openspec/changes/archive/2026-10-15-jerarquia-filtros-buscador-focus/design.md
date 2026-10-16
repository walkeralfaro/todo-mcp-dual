# Design

## Context

Estado actual (verificado): el buscador (`InputGroup` sobre `bg-ground`) y la pastilla activa del filtro (`data-[state=on]:bg-surface`, contraste 1.11:1 contra `ground`) comparten tono con el fondo y el tratamiento `muted`; no hay jerarquía entre control de búsqueda, control de filtro y contenido. El foco del buscador usa `focus-within:ring-2` con offset hacia fuera, que los contenedores con `overflow` del layout (`lg:overflow-hidden`, regiones `overflow-y-auto`) recortan a izquierda y derecha. Ver `proposal.md` para la motivación.

## Goals / Non-Goals

**Goals:**
- Tres capas visuales: buscador elevado, filtros segmentados, tareas como contenido.
- Foco del buscador imposible de recortar, visible a teclado y con contraste AA.

**Non-Goals:**
- No cambiar filtros, debounce, URL, orden ni `data-testid`; no tocar `task-item.tsx`, API, ni MCP.
- No rediseñar paleta ni tipografía (se reutiliza el token `elevated`).

## Decisions

### D1 — Buscador elevado con foco interior
`InputGroup` del buscador pasa a `bg-elevated` con `border-ink/10` y `shadow-xs`; el foco se indica con `focus-within:ring-2 focus-within:ring-inset focus-within:ring-accent` (o borde `accent` + anillo interior) en lugar de anillo exterior con offset. Un anillo interior vive dentro de la caja: por construcción ningún ancestro con `overflow` puede cortarlo, en desktop y en móvil.
- Alternativas: (a) envolver con padding para dar aire al anillo exterior — descartado, desplaza el layout y depende de cada contexto de uso; (b) quitar el anillo y dejar solo cambio de borde — descartado, el borde solo (1px) es menos perceptible a teclado que el anillo de 2px exigido.
- El cambio se acota al `InputGroup` del buscador (vía `className`, no al componente base) para no alterar otros usos.

### D2 — Filtros como control segmentado real
El `ToggleGroup` recibe pista contenida (`bg-surface/60`, `rounded-lg`, padding) y la pastilla activa (`data-[state=on]`) pasa a `bg-elevated` con `shadow-sm` y texto `ink` semibold; las inactivas quedan `muted` con hover a `ink`. Así el estado activo se lee por elevación + sombra + peso, no solo por un tono indistinguible.
- Alternativa descartada: subrayado del activo — choca con el lenguaje de pastillas ya usado y se confunde con enlaces.

### D3 — Tareas intactas como capa de contenido
Las filas conservan su estilo (sin cajas) y su hover actual; la jerarquía nace del contraste entre controles elevados y contenido plano, sin añadir cromo a las tareas.
- Guía aplicada (`web-design-guidelines`): estados interactivos más prominentes en hover/focus que en reposo; foco siempre visible y nunca cubierto.

## Risks / Trade-offs

- [Anillo interior menos "respiro"] el ring inset pisa 2px del contenido interno → Mitigación: el `InputGroup` ya tiene padding y se verifica a 390px que icono y texto no se solapan con el anillo.
- [Pastilla elevada sobre pista surface] introduce una superficie más en la zona de filtros → Mitigación: reutiliza el token `elevated` existente, sin colores nuevos; contraste `ink`/elevada ya medido (13.67:1).
- [Regresión E2E por focos] cambios de foco pueden alterar el orden de tabulación → Mitigación: sin cambios de DOM ni de orden, solo clases; se verifica el flujo E2E y navegación por teclado.

## Migration Plan

1. Retocar `input-group.tsx` (uso en buscador), `toggle-group.tsx` (variante segmentada) y `task-filters.tsx` (clases de composición).
2. Verificar `tsc`, `npm test`, `npx playwright test` + pasada de teclado y viewport 390px.
3. Rollback: revertir; sin cambios de esquema ni API.

## Open Questions

- Ninguna.
