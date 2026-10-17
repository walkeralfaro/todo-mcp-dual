# Proposal

## Why

La Todo App tiene autenticación de backend (Better Auth, email+contraseña y Google OAuth) pero no tiene UI para iniciar sesión, registrarse ni mostrar el estado de sesión. Cualquier usuario sin sesión no debería poder crear tareas, y hoy la UI no distingue entre usuario autenticado y anónimo. Se añade la capa de interfaz de autenticación: un modal único con pestañas (iniciar sesión / registrarse), botones en el header junto al titular del día, avatar del usuario (imagen de Google o genérico) y restricción de creación de tareas solo para usuarios autenticados.

## What Changes

- Nuevo `components/ui-auth/session-display.tsx`: muestra avatar/nombre del usuario y botón "Cerrar sesión" cuando hay sesión; botones "Iniciar sesión" y "Registrarse" cuando no.
- Nuevo `components/ui-auth/auth-modal.tsx`: modal único (shadcn `Dialog`) con dos pestañas, "Iniciar sesión" y "Registrarse", campos email + contraseña, usando `useSession` de Better Auth.
- `app/page.tsx`: resuelve la sesión (Better Auth) y condiciona la visibilidad de `TaskForm` y la lista de tareas al estado de autenticación; sin sesión no se puede crear tarea.
- `lib/ui-auth.ts` (opcional): helpers de sesión si se necesitan fuera de componentes.
- Validación E2E con playwright/test + playwright-cli: sin sesión no aparece formulario de crear; con sesión se puede iniciar sesión/registrarse, crear tarea y cerrar sesión.

## Capabilities

### New Capabilities

- `user-auth-ui`: interfaz de autenticación de usuario — modal de login/registro, header de sesión, avatar del usuario y restricción de creación de tareas solo para usuarios autenticados.

### Modified Capabilities

- Ninguna. Los specs `todo-tasks` y `mcp-tasks` ya fueron modificados en el cambio `add-auth-better-auth` (aislamiento por `userId`, auth Bearer en MCP); este cambio solo añade la UI que consume esa sesión.

## Impact

- Código afectado: `app/page.tsx`, `components/ui-auth/session-display.tsx` (nuevo), `components/ui-auth/auth-modal.tsx` (nuevo), posiblemente `lib/ui-auth.ts` (nuevo).
- Dependencias: usa `better-auth` (ya añadida en `add-auth-better-auth`), shadcn `Dialog` y `Button` existentes, `useSession` de Better Auth.
- APIs: consume `/api/auth/session` y los endpoints de sign-in/sign-up existentes de Better Auth.
- Sistemas: UI web (sesión de usuario), navegación condicionada por autenticación.
- Tests: E2E con playwright/test y validación de UX con `playwright-cli` (sin sesión vs con sesión).
