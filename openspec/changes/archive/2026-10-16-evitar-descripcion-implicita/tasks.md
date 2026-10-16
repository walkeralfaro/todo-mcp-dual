# Tasks

## 1. Contrato MCP sin inferencia

- [x] 1.1 Actualizar en `app/api/[transport]/route.ts` solo los textos de `create_task` (tool `description` y `.describe()` de `descripcion`) para ordenar omitir salvo envío literal o duplicado pedido, y verificar con `npx tsc --noEmit` que no hay errores de tipos
- [x] 1.2 Verificar en `tools/list` que `create_task` expone la nueva ayuda y sigue validando, ejecutando `npx vitest run app/api/\[transport\]/route.test.ts`

## 2. Cobertura de no-duplicado

- [x] 2.1 Añadir en `lib/mcp.test.ts` caso `mcpCreateTask({titulo})` → `descripcion` es `null` y verificar con `npx vitest run lib/mcp.test.ts`
- [x] 2.2 Añadir en `lib/mcp.test.ts` caso `mcpCreateTask({titulo, descripcion})` explícita → se conserva tal cual y verificar con `npx vitest run lib/mcp.test.ts lib/tasks.test.ts`
