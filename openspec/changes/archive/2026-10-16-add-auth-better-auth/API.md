# API de Autenticación (Better Auth)

## Variables de entorno (`.env` / `.env.example`)

| Variable | Descripción | Ejemplo |
|----------|-------------|---------|
| `BETTER_AUTH_SECRET` | Secreto para firmar sesiones/tokens | `openssl rand -base64 32` |
| `BETTER_AUTH_URL` | URL pública de la app | `http://localhost:3000` |
| `GOOGLE_CLIENT_ID` | Cliente de Google OAuth | `TU_GOOGLE_CLIENT_ID` |
| `GOOGLE_CLIENT_SECRET` | Secreto de Google OAuth | `TU_GOOGLE_CLIENT_SECRET` |

## Endpoints de autenticación (`/api/auth/*`)

Gestionados por Better Auth (`app/api/auth/[...all]/route.ts`):

| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/api/auth/sign-up` | Registro abierto con email + contraseña |
| POST | `/api/auth/sign-in` | Inicio de sesión email + contraseña |
| GET | `/api/auth/session` | Obtener la sesión del usuario autenticado |
| POST | `/api/auth/sign-out` | Cerrar sesión |
| GET/POST | `/api/auth/google` | Inicio de sesión con Google OAuth |
| GET/POST | `/api/auth/google/callback` | Callback de Google OAuth |

## Endpoint MCP (`/api/mcp`)

- Requiere cabecera `Authorization: Bearer <token>`.
- El token se valida contra `McpToken.token` (almacenado como hash SHA-256).
- Se resuelve al `userId` y todas las tools (`list_tasks`, `get_task`, `create_task`, `update_task`, `delete_task`) operan aisladas por ese usuario.
- Sin token o token inválido/expirado → HTTP 401 `{ error: "No autenticado: token MCP inválido o ausente" }`.

## Flujo de registro abierto

Cualquier usuario puede:
1. Registrarse con email + contraseña (`/api/auth/sign-up`) o Google OAuth.
2. Iniciar sesión y obtener una sesión de 7 días.
3. Gestionar sus propias tareas (aisladas por `userId`).
4. Generar sus propios tokens de acceso MCP (tabla `McpToken`) para usar el servidor MCP.

## Modelos de base de datos (Prisma)

- `User`, `Session`, `Account`, `Verification` (Better Auth, alcance Opción A, sin 2FA).
- `Task.userId` (requerido, FK a `User`, `onDelete: Cascade`).
- `McpToken` (token hash, `userId`, `scopes`, `expiresAt`, `lastUsedAt`, `createdAt`).
