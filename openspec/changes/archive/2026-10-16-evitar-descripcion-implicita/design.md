# Design

## Context

Ver `proposal.md - Why`. Estado actual: `lib/tasks.ts:createTask` ya hace `descripcion ?? null` y `lib/validators.ts:createTaskSchema` deja `descripcion` opcional. El problema no está en persistencia sino en el contrato visible MCP: `app/api/[transport]/route.ts:37-49` define `create_task` con textos genéricos ("Crea una tarea.", "Descripción (max 500)") y un `z.object` inline duplicado del validador central.

## Goals / Non-Goals

**Goals:**
- Que el agente omita `descripcion` salvo envío literal explícito.
- Un solo cambio mínimo en `route.ts`, sin funciones auxiliares.
- Mantener compatibilidad: quien envía `descripcion` explícita no cambia.

**Non-Goals:**
- Cambiar DB, Prisma, UI o `lib/tasks.ts` / `lib/validators.ts` (ya correctos).
- Añadir validación que rechace `descripcion == titulo` (impediría duplicados legítimos pedidos explícitamente).
- Cambiar firmas o topes de `list_tasks`.

## Decisions

**Decisión 1: Solo retocar textos `.describe()` de `create_task` en `route.ts`.**
- `description` de la tool → "Crea una tarea. Si solo te dan un nombre, envía solo `titulo` y omite `descripcion`."
- `descripcion` → "Omitir salvo que el usuario la dé literalmente o pida duplicar el título. No inferir ni copiar `titulo`. (max 500)".
- Alternativa descartada: crear helper `buildCreateSchema()` o validador que ignore `descripcion == titulo` — añade ramas, rompe duplicados legítimos y es lo que el usuario vetó ("nada enrevesado").
- Alternativa descartada: reutilizar `createTaskSchema` directamente como `inputSchema` — pierde los `describe` que guían al agente; requeriría tocar validadores para añadir describes y aumenta el diff.

**Decisión 2: No tocar persistencia.**
- `lib/tasks.ts:59` ya garantiza `null` al omitir. No se añade código para no duplicar lógica de negocio (principio de estado único en `AGENTS.md`).

## Risks / Trade-offs

- [Riesgo: el agente ignora el `describe`] → Mitigación: escenarios de spec + test MCP que verifica `create_task({titulo})` → `descripcion=null`.
- [Trade-off: duplicación inline vs import] → Se acepta el `z.object` inline existente; el cambio es solo texto, diff de ~3 líneas.
