# Design

## Context

La Todo App actual (v1) tiene un único modelo `Task` sin vinculación de usuario, Server Actions en `app/actions.ts`, un servidor MCP en `app/api/[transport]/route.ts` sin autenticación, y una capa de servicio compartida `lib/tasks.ts` usada por ambos (principio de estado único). La base es SQLite local (`dev.db`) en dev y Turso en prod/preview. No existe `better-auth` ni variables `BETTER_AUTH_*`. Véase `proposal.md` para la motivación.

## Goals / Non-Goals

**Goals:**
- Establecer identidad de usuario (email + contraseña y Google OAuth) con Better Auth.
- Aislar el contenido de cada usuario: toda tarea pertenece a un `userId` y solo su dueño puede leerla/escribirla.
- Dejar lista la infraestructura de tokens de acceso MCP (`McpToken`) para autorizar clientes MCP mediante Bearer token en `Authorization`.
- Mantener el principio de estado único: Server Actions y tools MCP siguen compartiendo `lib/tasks.ts`.

**Non-Goals:**
- MCP Auth completo (OAuth 2.1 / RS256 / servidor de autorización propio) — queda fuera de esta fase; la tabla `McpToken` solo se crea como infra preliminar.
- 2FA, username, magic link, passkey — no se incluyen en el alcance Opción A del esquema.
- Paginación visual, historial `TaskEvent`, dark mode obligatorio — ya declarados out of scope en la propuesta original v1.

## Decisions

### 1. Esquema Better Auth: Opción A (User, Session, Account, Verification)
Se añaden solo los cuatro modelos core de Better Auth sin `TwoFactor` ni campos de username. Razón: cubre email+contraseña y Google OAuth sin complejidad extra; si se necesita 2FA después se añade en migración separada. Alternativa considerada (Opción B, esquema completo con 2FA) descartada por sobre-dimensionar esta fase.

### 2. userId requerido en Task desde el inicio
`Task.userId` es `String` (no nullable), con `@relation(fields: [userId], references: [id], onDelete: Cascade)` e `@@index([userId])`. Razón: el aislamiento por usuario es un requisito de comportamiento, no un detalle de implementación; hacerlo nullable requeriría doble migración. Para la BD local de desarrollo se reinicia `dev.db` o se asigna un usuario por defecto a tareas existentes.

### 3. Autenticación MCP: Opción B (Bearer token en Authorization)
El cliente MCP envía `Authorization: Bearer <token>`. El servidor valida el hash del token contra `McpToken.token`, comprueba expiración y resuelve `userId`. Alternativa C (MCP Auth OAuth 2.1) descartada por ser considerablemente más compleja y exceder "infra preliminar". La tabla `McpToken` almacena `token` (hash), `userId`, `scopes`, `expiresAt`, `lastUsedAt`, `createdAt`, con `@@index([userId])`.

### 4. Métodos de login: email + contraseña y Google OAuth
Better Auth se configura con `emailPassword` y `google` (requiere `GOOGLE_CLIENT_ID` y `GOOGLE_CLIENT_SECRET`). Las sesiones se gestionan mediante cookies de Better Auth.

### 5. Capa de tareas recibe/filtra por userId
Cada función de `lib/tasks.ts` (`listTasks`, `getTask`, `createTask`, `updateTask`, `deleteTask`) acepta `userId` y añade `where: { userId }` a las consultas Prisma. `createTask` asigna `userId` del usuario autenticado. Razón: mantiene una sola capa de servicio (estado único) y evita duplicar lógica entre UI y MCP.

### 6. Server Actions resuelven sesión vía Better Auth
`app/actions.ts` llama a `api.getSession()` (o equivalente de Better Auth) para obtener `session.user.id` antes de invocar a `lib/tasks.ts`. Si no hay sesión, devuelve error de autenticación.

## Risks / Trade-offs

- [Reinicio de BD local] Al hacer `userId` requerido, `dev.db` local pierde datos o requiere usuario por defecto. → Mitigación: documentar reinicio de `dev.db` y/o seed de usuario por defecto en scripts.
- [Token en texto plano vs hash] `McpToken.token` almacena el token (o su hash). Si se almacena en texto plano, una fuga de DB expone tokens. → Mitigación: almacenar hash (bcrypt/argon2) y comparar; evaluar en implementación.
- [Google OAuth credenciales] Requiere `GOOGLE_CLIENT_ID`/`GOOGLE_CLIENT_SECRET` en `.env` y registro de redirect URI en Google Cloud Console. → Mitigación: añadir placeholders en `.env.example`.
- [Sesiones en Server Actions] Mejor Auth en Next.js App Router requiere manejar cookies en Server Components/Actions. → Mitigación: usar la API oficial de sesiones de Better Auth.
- [Tests contra Turso requieren usuario] `cleanTasks` debe limpiar también tablas de auth y `mcpToken`; tests de tareas deben crear usuario de prueba primero. → Mitigación: actualizar `lib/test-db.ts` y helpers de test.

## Migration Plan

1. Añadir `better-auth` a dependencias y `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL` (y `GOOGLE_*`) a `.env`/`.env.example`.
2. Actualizar `prisma/schema.prisma` con modelos Better Auth, `Task.userId` y `McpToken`; ejecutar `prisma generate` y `prisma db push` (o reiniciar `dev.db`).
3. Crear `lib/auth.ts` (instancia Better Auth + `prismaAdapter(db)`) y `app/api/auth/[...all]/route.ts`.
4. Actualizar `lib/tasks.ts` para aceptar/filtrar por `userId`; actualizar `app/actions.ts` para resolver sesión; actualizar `lib/mcp.ts` y la ruta MCP para validar Bearer token.
5. Actualizar `lib/test-db.ts` (`cleanTasks`) y helpers de test para crear usuario de prueba.
6. Rollback: revertir `schema.prisma`, eliminar tablas de auth y `mcpToken`, quitar `better-auth` y variables de entorno.

## Open Questions

- ¿Se almacena `McpToken.token` en texto plano o como hash? (afecta seguridad y forma de validación en la ruta MCP)
- ¿Se permite registro abierto de usuarios o solo invitación/administrador? (afecta el flujo de registro email+contraseña)
