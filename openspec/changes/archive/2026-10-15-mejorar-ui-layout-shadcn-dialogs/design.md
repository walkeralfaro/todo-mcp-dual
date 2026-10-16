# Design

## Context

Estado actual (verificado en código): `app/layout.tsx` usa `min-h-screen` con `max-w-[540px]` centrado; `app/page.tsx` apila `header → TaskForm → TaskFilters → ul` en `space-y-10` con `pt-[8vh]`, por lo que la lista queda empujada hacia abajo. `task-item.tsx` usa `<select>` nativo + `window.confirm` (único uso nativo). shadcn está iniciado (`components.json` style new-york, `button/input/field/toggle-group/input-group`) pero faltan `select` y `dialog`/`alert-dialog`; solo existen `@radix-ui/react-label/slot/toggle-group`. Sin cambios de datos, API ni MCP.

## Goals / Non-Goals

**Goals:**
- Fijar estrategia de layout viewport-first sin scroll global en desktop y con degradado móvil de un solo scroll.
- Fijar elección de primitivas shadcn (`select`, `dialog` vs `alert-dialog`) y su integración con Server Actions y `data-testid` existentes.
- Fijar estrategia de skills con contexto mínimo.

**Non-Goals:**
- No rediseñar paleta, tipografía ni tono (se conservan tokens `ground/surface/ink/muted/accent`).
- No cambiar orden/filtros/búsqueda, validaciones ni contrato MCP.
- No introducir rutas, paginación ni virtualización de lista.

## Decisions

### D1 — Layout desktop: grid 2 columnas con `100dvh` + lista con scroll interno
En `≥lg`: `main` pasa a `max-w-[1024px]`, `h-dvh overflow-hidden`, grid `minmax(0,1fr) 340px` (tareas a la izquierda, panel lateral con formulario + filtros apilados). La columna de tareas es `min-h-0 overflow-y-auto`. En `<lg`: una sola columna con scroll de documento y formulario compacto arriba.
- Alternativas: (a) sticky header con formulario colapsable en una columna — descartado porque no garantiza tareas visibles sin scroll con muchas tareas; (b) `100vh` fijo — descartado por bug de barras móviles, se usa `100dvh` con fallback `100vh`.
- Accesibilidad: la región de lista lleva `aria-label` y `tabIndex` solo si es desplazable por teclado; el titular conserva `data-testid="day-headline"`.

### D2 — Desplegable de estado: shadcn `Select` (Radix) controlado mínimo
Añadir `components/ui/select.tsx` vía CLI shadcn y envolver en `TaskStatusSelect` cliente que conserva `data-testid="status-select"`, llama a `updateTaskAction` + `router.refresh()` igual que hoy, con `disabled={pending}` durante la transición.
- Alternativas: (a) estilizar `<select>` nativo — descartado, el requisito exige shadcn; (b) `DropdownMenu` + estado manual — descartado, pierde semántica listbox y navegación por teclado gratuita de `Select`.

### D3 — Confirmación de borrado: shadcn `AlertDialog` (preferido) sobre `Dialog`
`AlertDialog` aporta `AlertDialogAction/Cancel`, foco atrapado y `onEscapeKeyDown` por defecto; ideal para acción destructiva. `TaskItem` mantiene botón `data-testid="delete-btn"` como trigger, guarda `open` en estado local y solo ejecuta `deleteTaskAction` en `onConfirm`.
- Alternativas: `Dialog` genérico — válido pero exige componer foco/roles a mano; `window.confirm` — prohibido por spec.

### D4 — Skills: trabajar solo con `shadcn`, sin cargar las demás
Alternativas exploradas (por descripción, sin invocarlas para no exceder contexto): `shadcn` (componentes, registros, `--preset`, `components.json` — encaje directo con D2/D3), `taste-skill` (art direction para landing/marketing, anti-slop — sobredimensionado para un ajuste funcional de layout), `emil-design-eng` (pulido/animación invisible — útil después, no para el contrato actual), `web-design-guidelines` (revisión de accesibilidad — el spec ya fija `aria-live`, foco y teclado, basta verificación manual + E2E).
- Decisión: invocar únicamente el skill `shadcn` en implementación para generar `select` y `dialog`/`alert-dialog` y sus dependencias Radix (`@radix-ui/react-select`, `@radix-ui/react-dialog` o `@radix-ui/react-alert-dialog`). No cargar `taste-skill`, `emil-design-eng` ni `web-design-guidelines` en este cambio para mantener el contexto lean; reevaluar `emil-design-eng` solo si el refinamiento visual posterior lo pide.

## Risks / Trade-offs

- [Radix + Server Components] `Select`/`AlertDialog` son cliente; `page.tsx` sigue siendo servidor y delega interacción a islas cliente → Mitigación: no convertir la página a cliente, solo los componentes de control.
- [Regresión E2E por cambio de DOM] Radix renderiza en portal y el `<select>` nativo desaparece → Mitigación: conservar `data-testid`, verificar con Playwright antes de cerrar; actualizar selectores solo si el spec lo autoriza (hoy exige conservarlos).
- [`overflow-hidden` recorta foco/contenido] → Mitigación: `min-h-0` + `overflow-y-auto` solo en la columna de lista, panel lateral con su propio scroll si desborda, probar a 900px de alto.
- [Peso de dependencias] dos paquetes Radix nuevos → Mitigación: son los mismos que usa shadcn CLI; sin nuevas librerías de estado o estilos.

## Migration Plan

1. Añadir vía shadcn CLI `select` y `alert-dialog` (solo archivos bajo `components/ui/` + deps Radix).
2. Migrar `TaskItem`: `Select` primero con feature visual, luego `AlertDialog`; cada paso con `npm test` y `npx playwright test`.
3. Migrar layout `layout.tsx`/`page.tsx` por último (cambio puramente CSS, reversible con un commit).
4. Rollback: revertir los tres commits en orden inverso; ningún cambio de esquema ni API impide el rollback.

## Open Questions

- Ninguna que bloquee specs o tareas. Detalle menor a resolver en implementación: si el panel lateral lleva filtros encima o debajo del formulario (propuesta: filtros encima para priorizar descubrimiento, formulario debajo compacto).
