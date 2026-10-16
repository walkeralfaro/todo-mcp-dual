# Tasks

## 1. Scaffolding y persistencia

- [x] 1.1 Scaffold Next.js App Router + TS + Tailwind + shadcn y verificar `npm run dev` arranca
- [x] 1.2 Añadir deps `prisma @prisma/client @prisma/adapter-libsql @libsql/client @modelcontextprotocol/sdk @vercel/mcp-adapter zod vitest playwright` y verificar `npm install` sin errores
- [x] 1.3 Crear `prisma/schema.prisma` (Task + TaskStatus PENDIENTE/EN_PROCESO/COMPLETADA) y verificar `npx prisma validate` pasa
- [x] 1.4 Implementar `lib/db.ts` singleton dual (Turso si hay env, si no SQLite file) y verificar import sin conexión en dev

## 2. Dominio compartido (validators + servicio)

- [x] 2.1 Crear `lib/validators.ts` Zod (titulo 1-100, descripcion max 500, mensajes ES) y verificar test Vitest de casos válidos/inválidos pasa
- [x] 2.2 Implementar `lib/tasks.ts` (list/get/create/update/delete + regla fechaCulminada + orden desc + filtro/búsqueda/limit-offset) y verificar tests Vitest contra `:memory:` pasan
- [x] 2.3 Documentar contratos del servicio en JSDoc/README corto y verificar `npx tsc --noEmit` pasa

## 3. UI + Server Actions

- [x] 3.1 Crear Server Actions en `app/actions.ts` (delegan a `lib/tasks.ts` + `revalidatePath`) y verificar test Vitest de acciones (crear/actualizar/borrar) pasa
- [x] 3.2 Implementar listado + filtro estado + búsqueda + orden desc y verificar render manual con seed muestra orden correcto
- [x] 3.3 Implementar crear (form) + editar (Dialog modal) + cambiar estado + eliminar con confirmación y verificar flujo manual completo en `npm run dev`
- [x] 3.4 Añadir test Playwright Chromium (crear/listar/filtrar/editar/completar/borrar) y verificar `npx playwright test` pasa en local

## 4. Servidor MCP

- [x] 4.1 Crear `lib/mcp.ts` + `app/api/mcp/route.ts` (Streamable HTTP sin auth, 5 tools EN con Zod) y verificar descubrimiento lista 5 tools
- [x] 4.2 Implementar `list_tasks/get_task/create_task/update_task/delete_task` delgadas sobre `lib/tasks.ts` con formato `{ content: [{ type:'text', text: JSON }] }` y verificar test Vitest del handler MCP (incluye limit default 50/max 100 y error id inexistente) pasa
- [x] 4.3 Verificar consistencia UI-MCP (crear en UI -> `get_task` lo devuelve; completar vía MCP -> UI lo muestra) con script/test de ida y vuelta

## 5. Integración y cierre

- [x] 5.1 Configurar envs (`DATABASE_URL` dev, `TURSO_*` prod/preview) + scripts migrate/build Vercel y verificar `prisma migrate deploy --dry-run` o build preview pasa
- [x] 5.2 Ejecutar suite completa `npm test` + `npx playwright test` + `openspec validate --change todo-app-dual-ui-mcp` y verificar todo en verde
