# Tasks

## 1. Dependencias y variables de entorno

- [x] 1.1 Añadir `better-auth` a `package.json` y verificar que la instalación termina sin errores
- [x] 1.2 Añadir `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, `GOOGLE_CLIENT_ID` y `GOOGLE_CLIENT_SECRET` a `.env` y `.env.example` con valores de desarrollo/local y placeholders claros; verificar que la app arranca (`next dev`) sin fallar por variables faltantes

## 2. Esquema de base de datos (Prisma)

- [x] 2.1 Añadir modelos Better Auth (`User`, `Session`, `Account`, `Verification`) al alcance Opción A (sin 2FA ni username) en `prisma/schema.prisma`; verificar que `npx prisma generate` genera el cliente sin errores
- [x] 2.2 Añadir `userId String` a `Task` con `@relation(fields: [userId], references: [id], onDelete: Cascade)` e `@@index([userId])`; verificar que el cliente expone `task.userId`
- [x] 2.3 Añadir modelo `McpToken` con `id`, `token` (hash), `userId`, `scopes?`, `expiresAt?`, `lastUsedAt?`, `createdAt`, relación FK a `User` y `@@index([userId])`; verificar que el cliente expone `mcpToken`
- [x] 2.4 Ejecutir `prisma db push` contra `dev.db` local (reiniciar o asignar usuario por defecto a tareas existentes si fuera); verificar que las tablas `user`, `session`, `account`, `verification`, `mcp_token` existen

## 3. Instancia de Better Auth y rutas de autenticación Next.js

- [x] 3.1 Crear `lib/auth.ts` con la instancia de Better Auth (`emailPassword`, `google`, `prismaAdapter(db)`, `databaseAdapter` o equivalente); verificar que importa sin errores de tipos
- [x] 3.2 Crear `app/api/auth/[...all]/route.ts` con el handler de Next.js de Better Auth (GET/POST); verificar que `/api/auth/sign-in`, `/api/auth/sign-up`, `/api/auth/session` responden (200 o 405 según método) sin excepciones
- [x] 3.3 Verificar que el flujo de registro abierto con email+contraseña y Google OAuth está cableado (redirect URI de Google anotada como pendiente en el entorno de desarrollo)

## 4. Capa de tareas con aislamiento por usuario (`lib/tasks.ts`)

- [x] 4.1 Actualizar `listTasks`, `getTask`, `createTask`, `updateTask`, `deleteTask` para aceptar `userId` y filtrar/asignar por `userId`; `createTask` asigna el `userId` del usuario autenticado
- [ ] 4.2 Verificar que `listTasks` solo devuelve tareas del `userId` dado (prueba unitaria con dos usuarios y tareas cruzadas) — requiere Turso
- [ ] 4.3 Verificar que `getTask`/`updateTask`/`deleteTask` rechazan (error de autorización) tareas de otro `userId` — requiere Turso
- [x] 4.4 Mantener reglas de `fechaCulminada` (COMPLETADA => ahora, salir de COMPLETADA => null) intactas (código sin modificaciones en esa regla)

## 5. Server Actions con sesión de usuario (`app/actions.ts`)

- [x] 5.1 Actualizar `createTaskAction`, `updateTaskAction`, `deleteTaskAction` para obtener `session.user.id` vía `api.getSession()` de Better Auth antes de invocar a `lib/tasks.ts`
- [x] 5.2 Si no hay sesión, devolver `{ ok: false, error: "No autenticado" }` (o similar en español) — verificado en `actions.test.ts`
- [x] 5.3 Verificar que un usuario autenticado puede crear/editar/borrar sus propias tareas y no ve tareas de otro usuario — verificado en `actions.test.ts` contra SQLite local

## 6. Autenticación MCP mediante Bearer token (`lib/mcp.ts` + ruta `/api/mcp`)

- [x] 6.1 Añadir middleware de autenticación en `app/api/[transport]/route.ts` que lea `Authorization: Bearer <token>`, calcule su hash SHA-256 y lo contraste con `McpToken.token`; verificar expiración (`expiresAt`) y resolver `userId`
- [x] 6.2 Si falta cabecera o el token es inválido/expirado, rechazar con error de autenticación (sin ejecutar tools)
- [x] 6.3 Pasar el `userId` resuelto a las funciones de `lib/mcp.ts` y de ahí a `lib/tasks.ts` para aislamiento por usuario
- [x] 6.4 Verificar que un cliente MCP con token válido ejecuta `list_tasks`/`create_task` solo sobre sus propias tareas; sin token es rechazado (cubierto por `route.test.ts`: 200 con token válido, 401 sin token; aislamiento por `userId` en `lib/mcp.ts`)

## 7. Pruebas y documentación

- [x] 7.1 Actualizar `lib/test-db.ts` (`cleanTasks`) para limpiar también `session`, `account`, `verification` y `mcpToken` (respetando FK/cascade) entre pruebas
- [x] 7.2 Añadir pruebas de unidad/integración (Vitest) para registro/login, sesión, aislamiento de tareas por usuario y validación de token MCP (hash) — escritas en `tasks.test.ts`, `mcp.test.ts` y `actions.test.ts` (requieren Turso para ejecutar las de servicio; las locales pasan)
- [x] 7.3 Documentar en el cambio los nuevos endpoints (`/api/auth/*`, `/api/mcp` con Bearer) y variables de entorno requeridas (`API.md`)

## 8. Integración y verificación final

- [x] 8.1 Ejecutir la suite completa de pruebas (`npm test`) — 28 pruebas pasan (5 files); 2 files (`lib/tasks.test.ts`, `lib/mcp.test.ts`) requieren Turso (env vars no disponibles en este entorno); `tsc --noEmit` limpio para todos los files
- [x] 8.2 Ejecutir `next build` — compilación exitosa, TypeScript OK, rutas `/api/auth/[...all]` generadas
- [x] 8.3 Ejecutir `openspec validate` — `openspec validate --changes`: 1 passed, 0 failed
