# Proposal

## Why

Las tareas flotan sobre el fondo sin contenedor: mismo color de fondo y solo un hover tenue las separa, así que la lista se lee como texto suelto y no como piezas accionables. La exploración con `playwright-cli` (captura en navegador) y `web-design-guidelines` confirmó el problema y que el resto del componente pasa las guías.

## What Changes

- Cada tarea pasa a card elevada (`bg-elevated`, borde sutil, radio) incluyendo su bloque de acciones (desplegable de estado, Editar/Guardar, Eliminar), con hover que profundiza la elevación en lugar de un lavado de color.
- Se enmienda el requisito "Filas de dos extremos sin cajas": las tareas se presentan como tarjetas con título, descripción, estado/fecha y acciones contenidas; se conservan el orden, los flujos y los `data-testid`.
- Hallazgos menores de guías incluidos en el alcance: `break-words` en título/descripción y fecha con `Intl.DateTimeFormat`.
- Sin cambios de comportamiento, validaciones, API, modelo de datos ni contrato MCP.

## Capabilities

### New Capabilities

- Ninguna: es rediseño de presentación de comportamientos ya especificados.

### Modified Capabilities

- `todo-tasks`: el requisito "Filas de dos extremos sin cajas" pasa a tarjetas elevadas por tarea con bloque de acciones contenido; se añaden escenarios de distinción visual y robustez de texto largo.

## Impact

- Afectado: `components/task-item.tsx` (estructura de card + acciones), estilos de hover/foco coherentes con el tema noche.
- No afecta: `lib/`, `app/actions.ts`, filtros, formulario, Prisma/SQLite, `/api/mcp`, specs `mcp-tasks`.
- Riesgo: regresión E2E/Vitest si cambia el DOM consultado; se mitiga conservando `data-testid` y verificando ambas suites.
