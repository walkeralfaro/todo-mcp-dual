# Proposal

## Why

La UI actual apila formulario, filtros y lista en una sola columna sin aprovechar el viewport en desktop, relega las tareas (el contenido prioritario) debajo del formulario y usa controles nativos (`<select>`, `window.confirm`) inconsistentes con el sistema shadcn ya iniciado (`button`, `input`, `toggle-group`).

## What Changes

- Layout desktop con altura de viewport: la app ocupa `100dvh` con lista de tareas en región con scroll propio; formulario y filtros quedan fijos/visibles sin empujar las tareas fuera de pantalla.
- Jerarquía tareas-primero: en desktop, tareas en columna principal prioritaria y formulario de creación en panel lateral o superior compacto; en móvil se mantiene apilado con formulario colapsable/compacto.
- Reemplazo de desplegables nativos por shadcn: el selector de estado por tarea (`status-select`) y cualquier `<select>` futuro usan componente shadcn (`Select` basado en Radix) con mismo `data-testid` y accesibilidad por teclado.
- Eliminación de `window.confirm` / `alert`: la confirmación de borrado se reemplaza por `Dialog` (o `AlertDialog`) shadcn con foco gestionado, cierre por Escape y botones explícitos Confirmar/Cancelar.
- Sin cambios de API, modelo de datos, validaciones Zod, ni contrato MCP.

## Capabilities

### New Capabilities

- Ninguna: no se introduce comportamiento durable nuevo, solo se revisa presentación e interacción de capacidades existentes.

### Modified Capabilities

- `todo-tasks`: cambian requisitos de presentación/interacción — layout con altura de viewport y prioridad de tareas, desplegables shadcn accesibles, y confirmación de borrado vía diálogo en lugar de `window.confirm`. Los flujos y `data-testid` existentes se conservan.

## Impact

- Afectado: `app/layout.tsx` (contenedor `min-h-screen`/`max-w-[540px]`), `app/page.tsx` (orden y estructura), `components/task-item.tsx` (`select` + `window.confirm`), `components/task-form.tsx` / `task-filters.tsx` (reubicación), `app/globals.css` (tokens de altura/scroll).
- Nuevas dependencias UI: componentes shadcn `select` y `dialog` (o `alert-dialog`) vía Radix; ya existen `@radix-ui/react-label/slot/toggle-group`, faltan `@radix-ui/react-select` y `@radix-ui/react-dialog` / `@radix-ui/react-alert-dialog`.
- No afecta: `lib/tasks.ts`, `app/actions.ts`, Prisma/SQLite, `/api/mcp`, specs `mcp-tasks`.
- Riesgo: regresión E2E si cambian `data-testid` o foco; se mitiga conservándolos y con Vitest + Playwright.
