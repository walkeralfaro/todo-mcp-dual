# Proposal

## Why

La UI funciona pero los botones de `TaskItem` (Editar/Guardar/Eliminar) usan `<button>` crudos con clases ad-hoc, inconsistentes con el `Button` shadcn ya usado en `TaskForm`/`TaskFilters`. Esto rompe la coherencia visual en desktop y móvil y dificulta reutilizar estilos en futuros features. Hay que auditar con `playwright-cli` y `web-design-guidelines` y unificar todo sobre shadcn.

## What Changes

- Auditar UI actual en desktop (1440px) y móvil (390px) con `playwright-cli` (`open`, `snapshot`, `find`, `screenshot`) y revisar cumplimiento con `web-design-guidelines` (fetch de guidelines + revisión `file:line`).
- Migrar todos los botones de `TaskItem` (Editar, Guardar, Eliminar, Cancelar/Confirmar ya parciales) al componente shadcn `Button` con `variant`/`size` coherentes, preservando `data-testid`, accesibilidad y foco visible 2px.
- Extender `components/ui/button.tsx` con variantes necesarias (p. ej. `destructive`, `ghost` ya existe, tamaños) como componente personalizable y documentado para reutilización futura, sin romper API existente (`variant`, `size`, `asChild`).
- Pulir layout responsive: táctil ≥44px en móvil, sin overflow horizontal, jerarquía y espaciados consistentes en ambas vistas, manteniendo tema oscuro actual.
- Sin cambios funcionales: mismos flujos (crear, filtrar, buscar, editar, cambiar estado, eliminar) y mismos `data-testid`; suite Vitest + Playwright existente sigue pasando sin modificaciones.

## Capabilities

### New Capabilities

- Ninguna. No se introduce comportamiento durable nuevo fuera de `todo-tasks`.

### Modified Capabilities

- `todo-tasks`: requisitos visuales de botones y pulido responsive — unificar botones sobre shadcn `Button` reutilizable y garantizar paridad desktop/móvil validada con Playwright + guidelines.

## Impact

- Afectado: `components/task-item.tsx`, `components/ui/button.tsx` (extensión de variantes), posiblemente `components/task-form.tsx` / `task-filters.tsx` (alineación de variantes), `app/globals.css` (ajustes menores de foco/espaciado si guidelines lo exigen).
- No afectado: `lib/tasks`, Server Actions, ruta `/api/mcp`, Prisma/SQLite, validación Zod.
- Riesgo bajo: cambio visual + refactor de componente; mitigado con E2E existentes y revisión `playwright-cli` en ambos viewports.
