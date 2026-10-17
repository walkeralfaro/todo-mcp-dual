# Proposal

## Why

La Todo App no distingue usuarios: cualquier persona con acceso a la UI o al endpoint `/api/mcp` puede leer, crear, editar y borrar todas las tareas. No hay identidad, ni aislamiento de datos por usuario, ni forma de autenticar a un cliente MCP. Se añade autenticación con Better Auth (email + contraseña y Google OAuth) para establecer identidad de usuario, aislar las tareas por `userId` y dejar lista la infraestructura de tokens de acceso MCP (`McpToken`) para futuras autorizaciones por agente.

## What Changes

- `prisma/schema.prisma`: añadir modelos Better Auth (`User`, `Session`, `Account`, `Verification`) y vincular `Task` al usuario mediante `userId` requerido + relación `@relation(userId)` e `@@index([userId])`; añadir tabla preliminar `McpToken` con FK a `User`.
- Nuevo `lib/auth.ts`: instancia de Better Auth con `prismaAdapter(db)`, email + contraseña y proveedor Google OAuth.
- Nueva ruta `app/api/auth/[...all]/route.ts`: handler de autenticación Next.js (Better Auth).
- `lib/tasks.ts`: todas las operaciones reciben/filtran por `userId` (aislamiento de contenido de usuario).
- `app/actions.ts`: obtener `session.user.id` vía `api.getSession()` antes de invocar a la capa de tareas.
- `lib/mcp.ts` + `app/api/[transport]/route.ts`: autenticación MCP mediante Bearer token en cabecera `Authorization`; validar hash del token contra `McpToken.token` y resolver `userId`.
- `.env` / `.env.example`: añadir `BETTER_AUTH_SECRET` y `BETTER_AUTH_URL`.
- Reiniciar BD local de desarrollo (SQLite) o asignar un usuario por defecto a tareas existentes.

## Capabilities

### New Capabilities

- `user-auth`: autenticación y autorización de usuarios — modelo de identidad (User/Session/Account/Verification), login email+contraseña, Google OAuth, sesiones, y aislamiento de tareas por usuario.

### Modified Capabilities

- `todo-tasks`: las tareas pasan a pertenecer a un usuario (`userId` requerido); listado/crear/editar/borrar se filtran por usuario autenticado. Cambio de comportamiento a nivel de requisito (aislamiento de contenido).
- `mcp-tasks`: el endpoint `/api/mcp` deja de ser "sin autenticación v1"; requiere Bearer token válido en `Authorization` resuelto a `userId` vía `McpToken`.

## Impact

- Código afectado: `prisma/schema.prisma`, `lib/auth.ts` (nuevo), `app/api/auth/[...all]/route.ts` (nuevo), `lib/tasks.ts`, `app/actions.ts`, `lib/mcp.ts`, `app/api/[transport]/route.ts`, `.env`, `.env.example`.
- Dependencias nuevas: `better-auth`.
- APIs: `/api/auth/*` (sesiones/login/OAuth); `/api/mcp` ahora exige token Bearer.
- Sistemas: UI web (sesión de usuario), servidor MCP (autorización por token), base de datos SQLite/Turso (multi-usuario).
- Tests: Vitest debe crear un usuario de prueba antes de operar tareas; `cleanTasks` limpia también tablas de auth y `mcpToken`.
