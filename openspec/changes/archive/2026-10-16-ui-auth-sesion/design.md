# Design

## Context

La Todo App ya tiene autenticación de backend (Better Auth con email+contraseña y Google OAuth, rutas `/api/auth/*`, `userId` requerido en `Task`) gracias al cambio `add-auth-better-auth`. La UI actual (`app/page.tsx`, `components/task-form.tsx`, `components/task-item.tsx`) no resuelve sesión ni distingue usuario autenticado de anónimo. Véase `proposal.md` para la motivación. Los componentes shadcn existentes son `Button`, `Dialog`/`AlertDialog`, `Input`, `Select`, `Field`, `Spinner`.

## Goals / Non-Goals

**Goals:**
- Proveer un único modal de cuenta con pestañas "Iniciar sesión" y "Registrarse" (email + contraseña).
- Mostrar estado de sesión en el header junto al titular del día.
- Restringir la creación de tareas a usuarios autenticados.
- Usar `useSession` de Better Auth para la sesión reactiva en el cliente.
- Reutilizar componentes shadcn existentes (`Button`, `Dialog`, `Input`, `Field`, `Spinner`).

**Non-Goals:**
- OAuth social en el modal (Google OAuth se maneja por redirect de Better Auth, no dentro del modal).
- Restablecimiento de contraseña, verificación de email, 2FA.
- Perfil de usuario editable, cambio de contraseña, eliminación de cuenta.
- Gestión de invitaciones o registro cerrado (registro abierto, heredado de `add-auth-better-auth`).

## Decisions

### 1. Modal único con pestañas (login | registro)
El usuario pidió explícitamente un solo modal con pestañas. Razón: reduce la superficie de UI, es coherente con el uso ya existente de `Dialog`/`AlertDialog` en el proyecto, y evita dos modales flotantes. Alternativa considerada (dos modales independientes) descartada por añadir complejidad de navegación entre ellos.

### 2. Avatar: imagen de Google si OAuth, avatar genérico si email
Si el usuario se autenticó con Google OAuth, se muestra `user.image`; si se autenticó con email+contraseña, se muestra un avatar genérico (iniciales del nombre o icono por defecto). Razón: aprovecha la información ya disponible en Better Auth sin pedir datos extra.

### 3. Ubicación del header de auth junto al titular del día
Los botones de "Iniciar sesión"/"Registrarse" (sin sesión) o avatar + "Cerrar sesión" (con sesión) se ubican en el header de `app/page.tsx`, junto a `DayHeadline`. Razón: es la zona de mayor jerarquía visual y coincide con la decisión del usuario.

### 4. Sesión resuelta con `useSession` de Better Auth
En componentes cliente se usa `useSession()` para reaccionar al login/logout sin recarga; en `app/page.tsx` (Server Component) se lee la sesión para decidir el render inicial de `TaskForm`. Razón: Better Auth provee este hook nativamente; no se inventa capa de sesión propia.

### 5. Sin sesión no se renderiza `TaskForm`
Cuando no hay sesión autenticada, `TaskForm` no se monta en el DOM, impidiendo la creación de tareas anónimas. El listado de tareas solo muestra tareas del usuario autenticado (`userId` del cambio anterior).

## Risks / Trade-offs

- [Sesión entre Server y Client] `page.tsx` es Server Component y `useSession` es client. Debe sincronizarse el estado inicial para evitar mismatches de hidratación. → Mitigación: leer sesión en el servidor y pasarla por props, o usar un `SessionProvider` de Better Auth en el layout.
- [Avatar de Google] `user.image` puede ser null incluso con OAuth si Google no la proporciona. → Mitigación: fallback a avatar genérico.
- [Cerrar sesión recarga la página] Mejor Auth invalida cookies; la UI debe reflejarlo inmediatamente. → Mitigación: `router.refresh()` o `useSession` reactiva tras `signOut`.

## Migration Plan

1. Crear `components/ui-auth/session-display.tsx` y `components/ui-auth/auth-modal.tsx`.
2. Actualizar `app/page.tsx` para resolver sesión y condicionar `TaskForm` y la lista.
3. Añadir tests E2E con playwright/test y validar UX con `playwright-cli`.
4. Rollback: eliminar los nuevos componentes y revertir `app/page.tsx` al comportamiento sin auth.

## Open Questions

- ¿Se usa `SessionProvider` de Better Auth en `layout.tsx` para compartir sesión entre Server y Client Components, o se lee la sesión por props en `page.tsx`?
- ¿El avatar genérico muestra iniciales del nombre o un icono estático?
