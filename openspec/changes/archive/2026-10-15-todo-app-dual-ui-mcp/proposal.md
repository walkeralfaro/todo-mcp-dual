# Proposal: Todo App Dual (UI + MCP)

## Why

No existe una Todo App con estado único compartido entre usuarios web y agentes IA. Se necesita una base Next.js + Prisma + Turso que alimente tanto Server Actions como un servidor MCP en `/api/mcp`, sin duplicar lógica de negocio.

## What Changes

- Scaffolding Next.js (App Router) + React 19 + Tailwind CSS + shadcn/ui + TypeScript estricto.
- Modelo Prisma `Task` (`id` String cuid/UUID, `titulo`, `descripcion?`, `estado` enum, `fechaCreacion` now(), `fechaCulminada?`) + `TaskStatus` con valores `PENDIENTE`, `EN_PROCESO`, `COMPLETADA`.
- Capa de servicio Prisma compartida (`lib/tasks.ts`) usada por Server Actions y Tools MCP; regla `COMPLETADA => fechaCulminada=now()`, al salir de `COMPLETADA => fechaCulminada=null`; transiciones libres.
- UI en español: listado ordenado por `fechaCreacion` desc, filtro por estado (TODAS/PENDIENTE/EN_PROCESO/COMPLETADA) + búsqueda texto en título/descripción, crear, editar título/descripción (modal), cambiar estado, eliminar con confirmación; responsive básico.
- Validadores Zod compartidos en `lib/validators.ts` (titulo 1-100, descripcion max 500 opcional, mensajes en español).
- Servidor MCP en `app/api/mcp/route.ts` con `@vercel/mcp-adapter` (Streamable HTTP, sin auth v1) y 5 tools en inglés: `list_tasks` (limit default 50 max 100, offset default 0, filtro estado + búsqueda opcionales), `get_task`, `create_task`, `update_task` (título/descripción/estado parciales), `delete_task`; respuestas `{ content: [{ type: 'text', text: JSON }] }`.
- Persistencia híbrida: `file:./dev.db` en dev, `:memory:` en Vitest, Turso vía `@prisma/adapter-libsql` + `TURSO_DATABASE_URL`/`TURSO_AUTH_TOKEN` en prod/preview Vercel.
- Calidad: Vitest (Zod + servicio Prisma + handler MCP) y Playwright (Chromium, flujo crear/listar/filtrar/actualizar/borrar).

## Capabilities

### New Capabilities

- `todo-tasks`: gestión de tareas — modelo, validación, servicio compartido, Server Actions y UI CRUD con filtros/búsqueda/orden.
- `mcp-tasks`: servidor MCP de tareas — endpoint `/api/mcp` y 5 tools CRUD con validación Zod y formato de respuesta MCP.

### Modified Capabilities

- Ninguna (proyecto greenfield, `openspec/specs/` vacío).

## Impact

- Nuevo proyecto Next.js; dependencias: `prisma`, `@prisma/client`, `@prisma/adapter-libsql`, `@libsql/client`, `@modelcontextprotocol/sdk`, `@vercel/mcp-adapter`, `zod`, `vitest`, `playwright`.
- Env vars: `DATABASE_URL` (dev), `TURSO_DATABASE_URL` + `TURSO_AUTH_TOKEN` (prod/preview).
- Sistemas afectados: UI web, ruta `/api/mcp` pública sin auth (v1), base Turso en producción.
- Out of scope v1: auth MCP, paginación visual, historial `TaskEvent`, dark mode obligatorio, multi-usuario.
