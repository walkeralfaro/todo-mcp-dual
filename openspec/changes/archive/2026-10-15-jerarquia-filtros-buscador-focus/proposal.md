# Proposal

## Why

Filtros, buscador y tareas comparten el mismo tratamiento apagado (`muted` + superficies casi idénticas al fondo), así que nada destaca ni se distingue qué es control y qué es contenido. Además, el anillo de foco verde del buscador pinta fuera de la caja y queda recortado en los bordes izquierdo y derecho por los contenedores con scroll/overflow del layout.

## What Changes

- Jerarquía visual en tres capas: buscador elevado (superficie `elevated` con borde y sombra, icono visible), filtros como control segmentado (pista con fondo y pastilla activa elevada con sombra y texto `ink`), y tareas como capa de contenido sin cajas (se conserva el estilo de filas actual).
- Foco del buscador a prueba de recortes: el indicador de foco se dibuja hacia dentro (`ring-inset`) o como borde acentuado, de modo que ningún ancestro con `overflow` pueda cortarlo; se mantiene visible a teclado con contraste AA y respeta `prefers-reduced-motion` (sin animación de escala en el anillo).
- Sin cambios de comportamiento: mismos filtros, mismo debounce (~300 ms), misma URL, mismos `data-testid` y mismo flujo E2E.

## Capabilities

### New Capabilities

- Ninguna: es refinamiento de presentación de comportamientos ya especificados.

### Modified Capabilities

- `todo-tasks`: cambian requisitos de presentación — jerarquía buscador/filtros/tareas y regla de foco visible (anillo interior no recortable en el buscador). Flujos, debounce, URL y `data-testid` intactos.

## Impact

- Afectado: `components/task-filters.tsx` (estructura del buscador y grupo de filtros), `components/ui/input-group.tsx` (foco interior), `components/ui/toggle-group.tsx` (variante segmentada con pastilla activa), `app/globals.css` solo si hace falta un token (se reutiliza `elevated`).
- No afecta: `lib/`, `app/actions.ts`, Prisma/SQLite, `/api/mcp`, `task-item.tsx`, specs `mcp-tasks`.
- Riesgo: regresión E2E si cambian focos/selectores; se mitiga conservando `data-testid` y verificando con Vitest + Playwright (incluida pasada a 390px y con teclado).
