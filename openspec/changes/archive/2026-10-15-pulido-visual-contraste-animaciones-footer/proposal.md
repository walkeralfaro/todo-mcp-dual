# Proposal

## Why

La UI cumple los flujos pero falla en acabado: la card del formulario (`bg-surface`) es indistinguible del fondo (`bg-ground`, contraste 1.11:1), el diálogo de borrado aparece sin transición porque las clases `animate-in/out` no tienen motor (`tw-animate-css` no instalado), y el footer flota pegado a la lista en lugar de ocupar el borde inferior de la página.

## What Changes

- Contraste y jerarquía de superficies: diferenciar card del formulario y menú del `Select` del fondo (superficie elevada con borde y sombra sutil), y corregir el texto `muted` sobre `surface` (4.37:1, bajo el AA) sin cambiar la paleta sobria.
- Movimiento con criterio: instalar `tw-animate-css` para activar las transiciones shadcn existentes del `AlertDialog`/`Select` (entrada 200–250ms `ease-out` desde `scale(0.95)` + opacidad, modal con origen centro) y añadir micro-transiciones solo a `transform`/`opacity` (hover/active en botones y filas), todo con variante `prefers-reduced-motion`.
- Footer al borde inferior: en desktop el footer ocupa el borde inferior de la página mediante layout (grid/flex con `margin-top: auto`), no con `position: sticky` ni `fixed`; en móvil queda al final del documento.
- Sin cambios de flujos, validaciones, API, modelo de datos ni contrato MCP; se conservan todos los `data-testid`.

## Capabilities

### New Capabilities

- Ninguna: es refinamiento de presentación de comportamientos ya especificados.

### Modified Capabilities

- `todo-tasks`: cambian requisitos de presentación — sistema de color/superficies (contraste AA real entre card y fondo), movimiento y transiciones con `prefers-reduced-motion`, y posición del footer al borde inferior. Los flujos y `data-testid` se conservan.

## Impact

- Afectado: `app/globals.css` (import `tw-animate-css`, tokens de superficie, keyframes/easings, `prefers-reduced-motion`), `components/ui/alert-dialog.tsx` y `select.tsx` (clases de transición y `transform-origin`), `components/task-form.tsx` (card elevada), `components/task-item.tsx` (hover/active), `app/page.tsx` + `app/layout.tsx` (footer al borde inferior).
- Nueva dependencia: `tw-animate-css` (estándar Tailwind v4 para las utilidades `animate-in/out` que shadcn ya emite).
- Skills de diseño aplicadas en planificación: `emil-design-eng` (decisiones de animación: duraciones, easings, origen de transform) y `web-design-guidelines` (contraste AA, foco, `prefers-reduced-motion`); `taste-skill` descartado por estar orientado a landing/marketing, no a UI de app.
- No afecta: `lib/`, `app/actions.ts`, Prisma/SQLite, `/api/mcp`, specs `mcp-tasks`.
- Riesgo: regresión E2E si el footer o las animaciones alteran selectores/tiempos; se mitiga conservando `data-testid` y verificando con Vitest + Playwright.
