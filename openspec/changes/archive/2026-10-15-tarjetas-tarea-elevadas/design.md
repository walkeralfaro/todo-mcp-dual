# Design

## Context

Estado actual (verificado en código y en captura de navegador): el `li` no tiene fondo propio; solo un `div` interior aplica `hover:bg-surface/60`, indistinguible del fondo noche en reposo. El bloque de acciones (`Select`, Editar, Eliminar) vive en un `div` separado bajo el texto. La fecha usa `toLocaleDateString("es")` y el texto largo no contempla `break-words`. Ver `proposal.md` para la motivación.

## Goals / Non-Goals

**Goals:**
- Una card por tarea que contenga texto + estado/fecha + acciones, distinguible en reposo.
- Robustez de texto largo y fecha vía `Intl`.

**Non-Goals:**
- No cambiar flujos, orden, `data-testid`, validaciones, API ni MCP; no tocar filtros, formulario ni primitivas `ui/*` salvo lo necesario.

## Decisions

### D1 — Card = el `li` elevado con bloque de acciones dentro
El `li` pasa a `bg-elevated`, `border-white/10`, `rounded-md`, padding interno; el bloque de acciones se mueve dentro de la card con un divisor de tono (no línea: zona de acciones sobre `surface/40` o mismo fondo con padding superior, a decidir en implementación por contraste). Hover profundiza (`border-white/20` o elevación) solo con `transition-colors`, sin `transition: all`.
- Alternativa descartada: elevar solo el texto y dejar acciones fuera — mantiene la fragmentación actual que origina la queja.

### D2 — Texto robusto y fecha `Intl`
Título/descripción con `break-words` (conservando `min-w-0` para truncado flexible); fecha con `Intl.DateTimeFormat("es", { day, month, year? })` manteniendo el formato corto actual ("12/3/2026" → día/mes/año numérico) para no alterar snapshots de texto.
- Guía aplicada (`web-design-guidelines`): contenedores anticipan entradas muy largas; nada de `transition: all`; foco visible existente intacto.

## Risks / Trade-offs

- [E2E/Vitest consultan por `data-testid` dentro del `li`] la reestructuración mueve nodos pero conserva testids y roles → Mitigación: suites verde antes de cerrar; si un selector de posición falla, ajustar el test, no el DOM.
- [Densidad vertical] las cards ocupan más alto que las filas → Mitigación: padding compacto y la región con scroll ya existe; verificar a 900px que la primera tarea sigue visible.

## Migration Plan

1. Reestructurar `task-item.tsx` a card con acciones dentro + `break-words` + fecha `Intl`.
2. Verificar `tsc`, `npm test`, `npx playwright test` + captura en navegador a 1440 y 390.
3. Rollback: revertir; sin cambios de esquema ni API.

## Open Questions

- Ninguna.
