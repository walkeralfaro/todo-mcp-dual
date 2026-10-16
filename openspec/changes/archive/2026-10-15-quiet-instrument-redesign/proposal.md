# Proposal

## Why

La UI actual (tarjetas blancas idénticas sobre zinc, cabecera pequeña) funciona pero es indistinguible de cualquier CRUD genérico. La exploración con taste-skill (`quiet-instrument`) mostró que la contención radical —una sola columna estrecha, filas sin cajas, un único acento— es la evolución de menor riesgo y mayor carácter para una herramienta de trabajo diario en español.

## What Changes

- Cabecera reescrita: titular del día con cifra de pendientes ("Hoy quedan 3") como único elemento grande, en Stack Sans Headline light.
- Lista de tareas como filas de dos extremos sin cajas ni separadores: título en tinta plena a la izquierda, estado/fecha a 13px en tinta suave a la derecha; grupos separados solo por espacio.
- Sistema de color sobrio: fondo gris rosado, tinta marrón-negra, un solo verde reservado al botón primario y al estado COMPLETADA.
- Tipografía Stack Sans (display light + texto regular/medium) cargada en `layout.tsx`; cuerpo a 17–19px en tinta plena.
- Formulario, filtros y controles de cada tarea reestilizados con el mismo lenguaje (sin cambiar sus flujos ni sus `data-testid`).
- Sin cambios de comportamiento: mismos filtros, búsqueda, orden, validaciones y Server Actions.

## Capabilities

### New Capabilities

_Ninguna — el rediseño no introduce comportamientos nuevos del sistema._

### Modified Capabilities

- `todo-tasks`: se añaden requisitos de presentación observables (titular del día con cifra, filas de dos extremos, sistema sobrio de tipo/color con acento único). Los requisitos de CRUD, filtros, validación y orden quedan intactos.

## Impact

- Afectados: `app/page.tsx`, `app/layout.tsx`, `app/globals.css` (tokens `@theme` Tailwind v4), `components/task-form.tsx`, `components/task-filters.tsx`, `components/task-item.tsx`.
- No afectados: capa Prisma/SQLite, Server Actions (`app/actions.ts`), endpoint y tools MCP (`mcp-tasks` intacto), validaciones Zod.
- Riesgo: regresión visual o pérdida de accesibilidad (contraste, foco, táctil 44px). Mitigación: E2E Playwright existente + revisión de pantallas + chequeo de contraste del verde sobre fondo.
