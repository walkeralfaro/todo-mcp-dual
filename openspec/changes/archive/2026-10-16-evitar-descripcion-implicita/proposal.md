# Proposal

## Why

La tool `create_task` permite `descripcion` opcional, pero su descripción actual ("Descripción (max 500)") no dice cuándo omitirla. Eso llevó a que un agente inventara la descripción duplicando el título ("Oler planta de romero 10 minutos" → descripción casi idéntica) aunque el usuario solo pidió un nombre de tarea.

## What Changes

- Aclarar el contrato de `create_task`: si el cliente MCP no envía `descripcion` literalmente, se persiste `null` (sin inferir ni duplicar `titulo`).
- Endurecer los textos de ayuda (`.describe()`) de la tool `create_task` para que el agente omita `descripcion` salvo petición explícita del usuario o directiva explícita de duplicar.
- Reutilizar el validador central (`createTaskSchema`) en la definición de la tool para que el contrato visible y el validado sean el mismo, sin funciones auxiliares ni lógica enrevesada.
- Documentar la regla en specs: solo-título → solo `titulo`; `descripcion` solo si viene explícita.

## Capabilities

### New Capabilities

- Ninguna.

### Modified Capabilities

- `mcp-tasks`: aclarar contrato de `create_task` — `descripcion` se omite salvo envío explícito; prohibir inferencia desde `titulo`.
- `todo-tasks`: explicitar semántica de creación — sin `descripcion` explícita se persiste `null`.

## Impact

- Afecta `app/api/[transport]/route.ts` (solo textos `.describe()` y reutilización de schema, sin cambio de firma).
- Sin cambios en DB, Prisma, UI ni Server Actions (ya guardan `null` cuando falta `descripcion` en `lib/tasks.ts`).
- Compatible hacia atrás: clientes que ya envían `descripcion` explícita no cambian.
