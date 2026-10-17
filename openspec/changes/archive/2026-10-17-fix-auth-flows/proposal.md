# Proposal

## Why

El flujo de autenticación con email+contraseña está roto de punta a punta (verificado en vivo con playwright-cli): el modal de cuenta silencia todos los errores (400/401/500 cierran el modal sin mensaje), el servidor nunca resuelve la sesión desde las cookies (el formulario de tareas y las Server Actions responden "No autenticado" incluso logueados), y la base de datos del entorno configurado carece de las tablas de auth (el registro devuelve 500). La UI percibida como "no funciona" se reduce a estos tres defectos raíz más detalles de UX del modal.

## What Changes

- **Corregir la resolución de sesión en el servidor** (`app/page.tsx`, `app/actions.ts`): hoy se construyen headers con `headers.set(cookie.name, cookie.value)` — Better Auth (`better-call`) solo lee el header `Cookie`, así que `getSession` siempre devuelve null. Se pasa a `headers()` de `next/headers` (patrón oficial better-auth + Next).
- **Corregir el manejo de errores del cliente de auth** (`components/ui-auth/auth-modal.tsx`): el cliente de Better Auth devuelve `{ data, error }` y no lanza excepciones; hoy el `try/catch` es código muerto y `onAuthSuccess` se ejecuta siempre. Se comprobará `error` y se mapearán los códigos (`INVALID_EMAIL_OR_PASSWORD`, `PASSWORD_TOO_SHORT`, `USER_ALREADY_EXISTS`, ...) a mensajes claros en español.
- **Esquema de auth en las bases del proyecto**: `scripts/apply-schema-turso.mjs` solo idempotiza `Task`; se idempotizará el DDL de todas las tablas (`user`, `session`, `account`, `verification`, `mcp_token`) para poder reparar la DB de test y localiures con un solo comando.
- **UX del modal**: respeto del tab por defecto (hoy `defaultTab` se ignora tras el primer montaje), `router.refresh()` al iniciar/cerrar sesión (sin recarga manual), un solo mensaje de error (hoy se duplica en email y contraseña), preserving valores y foco, estado pendiente en "Cerrar sesión", y alineación de la longitud mínima de contraseña (UI dice 6, servidor exige 8).
- **Botón "Continuar con Google"** en el modal (la spec `user-auth` exige OAuth con Google y `lib/auth.ts` ya lo configura, pero la UI no lo ofrece).
- **Pruebas E2E sincronizadas**: añadir los `data-testid` que los tests ya esperan (`auth-email`, `auth-password` no existen en el componente), eliminar el `page.reload()` que enmascara la falta de refresh, y cubrir los casos de error (contraseña incorrecta, pestañas, persistencia de sesión, mensajes en español).

## Capabilities

### New Capabilities

(ninguna)

### Modified Capabilities

- `user-auth`: (1) nueva exigencia de sesión resuelta correctamente en el servidor (RSC y Server Actions a partir de las cookies de la solicitud, sin recargas manuales); (2) mínima longitud de contraseña (8) explícita en el registro; (3) errores de autenticación siempre en español con mensaje claro.
- `user-auth-ui`: (1) los errores de auth se muestran dentro del modal, que permanece abierto conservando lo tecleado; (2) el tab por defecto del modal se respeta al abrirlo desde el header; (3) tras autenticarse o cerrar sesión la vista server-rendered se actualiza sin recarga manual; (4) botón "Continuar con Google" en el modal.

## Impact

- **Código**: `app/page.tsx`, `app/actions.ts`, `components/ui-auth/auth-modal.tsx`, `components/ui-auth/session-display.tsx`, `lib/auth.ts` (config `minPasswordLength`), `scripts/apply-schema-turso.mjs`, `e2e/todo-auth.spec.ts`.
- **Infra de datos**: DB de test Turso y DB local en archivo requieren las tablas de auth; tras idempotizar el script, regenerarlas no borra datos existentes (`IF NOT EXISTS`). La `dev.db` local no se toca desde el change (queda para dev manual).
- **Sin cambios breaking**: no se alteran contratos de API MCP ni de tools; el endpoint de Better Auth `/api/auth/*` ya expone los flujos usados.
- **Supuestos registrados**: mínimo de contraseña = 8 (default de Better Auth), sin pedir validación de email en este cambio; OAuth Google se prueba solo a nivel de botón/redirect (OAuth real requiere credenciales externas, fuera de alcance E2E).
