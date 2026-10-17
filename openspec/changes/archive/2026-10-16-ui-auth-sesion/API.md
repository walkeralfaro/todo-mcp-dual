# UI de Autenticación — Documentación

## Nuevos componentes

| Componente | Path | Descripción |
|------------|------|-------------|
| `SessionDisplay` | `components/ui-auth/session-display.tsx` | Muestra avatar/nombre + "Cerrar sesión" con sesión; botones "Iniciar sesión"/"Registrarse" sin sesión. Gestiona el modal de auth internamente. |
| `AuthModal` | `components/ui-auth/auth-modal.tsx` | Modal único (Dialog shadcn) con pestañas "Iniciar sesión" y "Registrarse". Campos email + contraseña. Usa `authClient` de Better Auth. |
| `Dialog` | `components/ui/dialog.tsx` | Componente shadcn `Dialog` (sigue el patrón de `alert-dialog.tsx`), basado en Radix `Dialog`. |

## Cliente de autenticación

`lib/auth-client.ts` exporta `authClient` (singleton de `createAuthClient` de `better-auth/react`) con:
- `useSession()` — sesión reactiva en el cliente
- `signIn.email({ email, password })` — inicio de sesión
- `signUp.email({ email, password, name })` — registro
- `signOut()` — cierre de sesión

## Resolución de sesión

- **Servidor** (`app/page.tsx`): lee la sesión con `auth.api.getSession({ headers })` usando las cookies de la solicitud. Obtiene `userId` y condiciona el render de `TaskForm` y el filtrado de tareas.
- **Cliente** (`components/ui-auth/*`): usa `authClient.useSession()` para reaccionar al login/logout sin recarga.

## Flujo de registro abierto

1. Usuario sin sesión ve botones "Iniciar sesión" y "Registrarse" en el header.
2. Al hacer clic se abre el modal único con pestañas.
3. Tras registrarse/iniciar sesión con éxito, el modal se cierra y el header muestra avatar + "Cerrar sesión".
4. El formulario de creación de tareas aparece solo con sesión autenticada.
5. Al cerrar sesión, la UI vuelve al estado anónimo (sin formulario de creación).

## Endpoints consumidos

- `POST /api/auth/sign-in/email` — login email+contraseña
- `POST /api/auth/sign-up/email` — registro email+contraseña
- `POST /api/auth/sign-out` — cierre de sesión
- `GET /api/auth/session` — obtener sesión (servidor)

## Variables de entorno

- `BETTER_AUTH_URL` — URL pública de la app (ya definida en `.env`)
- `NEXT_PUBLIC_BETTER_AUTH_URL` — para el cliente de auth (añadir a `.env` y `.env.example`)

## Pruebas

- `e2e/todo-auth.spec.ts`: prueba E2E de flujo de auth (requiere Turso con `TURSO_DATABASE_URL` y `TURSO_AUTH_TOKEN`).
- `playwright-cli`: validación de UX (requiere Chromium instalado).

## Limitaciones conocidas

- `playwright-cli` no pudo ejecutarse en este entorno (Chromium no instalado, sin sudo).
- La prueba E2E requiere Turso; no se puede ejecutar sin `TURSO_*` en el entorno.
