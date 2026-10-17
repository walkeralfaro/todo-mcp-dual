# Design

## Context

Better Auth (email+contraseña, Google OAuth configurado, sesiones en DB de 7 días) ya expone `/api/auth/*` y el cliente recibe sesión correctamente en la parte cliente. La revisión con playwright-cli (ver propuesta) identificó tres defectos raíz:

1. `app/page.tsx` y `app/actions.ts` reconstruyen headers con `headers.set(cookie.name, cookie.value)`; `better-call` (núcleo de Better Auth) solo lee el header `Cookie` (`requestHeaders?.get("cookie")`), así que `auth.api.getSession({ headers })` devuelve null siempre.
2. `@better-fetch/fetch` (cliente de Better Auth) no lanza en errores HTTP: devuelve `{ data, error }`. El modal ignora `error` y siempre ejecuta `onAuthSuccess`.
3. La DB configurada (Turso de test vía `.env`) no tiene tablas `user`/`session`/etc. (500 en registro: `no such table: main.user`); `dev.db` local solo tiene `Task`. `scripts/apply-schema-turso.mjs` solo idempotiza `CREATE TABLE IF NOT EXISTS "Task"`.

Detalles de UI ya observados: `defaultTab` capturado en `useState` inicial (se ignora al reabrir), error duplicado en dos campos, sin `router.refresh()` tras auth/logout, `minLength={6}` en UI vs 8 real del servidor.

Nota de entorno: el dev server de revisión quedó sirviendo `:3000` desde una copia temporal `file:/tmp/opencode/review.db`; al implementar, reiniciar `npm run dev` con la configuración normal tras aplicar el esquema.

## Goals / Non-Goals

**Goals:**
- Resolución de sesión server-side correcta y única en RSC y Server Actions.
- Feedback de errores de auth en español, dentro del modal, sin cerrarlo.
- Modal con comportamiento predecible (tab respetado, refresh de la vista tras auth/signout).
- Entornos de datos locales/test reparables con un comando idempotente.
- E2E alineado con el DOM real y con casos de error cubiertos.

**Non-Goals:**
- Verificación de email post-registro (Better Auth lo soporta; se activará en otro cambio si se quiere).
- Flujo OAuth completo en E2E (requiere credenciales externas de Google; solo se prueba redirect y la vinculación ya existe en backend).
- Cambios en el contrato de tools MCP ni en `lib/mcp-auth.ts` (tokens MCP siguen su curso actual).
- Migrar de SQLite/Turso a otro almacén.

## Decisions

1. **Lectura de sesión: `headers()` de `next/headers`** (patrón oficial better-auth → Next.js: `auth.api.getSession({ headers: await headers() })`) en `app/page.tsx` y en `currentUserId()` de `app/actions.ts`.
   - *Alternativa descartada*: reconstruir el header manualmente con `headers.append("cookie", "name=value")` — funciona pero reimplementa lo que el framework ya entrega y vuelve a romperse con cookies firmadas/partidas.
   - *Alternativa descartada*: guardar sesión en cookie propia del app — duplicaría el estado de Better Auth.
   - Consecuencia: borra el patrón erróneo de los dos archivos; `currentUserId()` se mantiene como único punto de lectura para las acciones.

2. **Manejo de errores del cliente: consumir `{ data, error }` y `setPending(false)` siempre**. El modal usa el resultado, no `try/catch` HTTP. Accesos secundarios (sign-out) también revisan `error`.
   - *Alternativa descartada*: `fetchOptions: { throw: true }` en cada llamada — obliga a recordar el flag por llamada y desvía del patrón documentado del SDK.
   - Mapeo de códigos → español centralizado en un pequeño helper (`authErrorToMessage` en `lib/`), con fallback genérico "Error de autenticación. Inténtalo de nuevo." para lo no mapeado (incluidos errores 5xx, que hoy ni siquiera se ven).

3. **Longitud mínima de contraseña: alinear explícitamente en 8.** Se fija `emailAndPassword.minPasswordLength: 8` en `lib/auth.ts` (documentado) y la UI usa `minLength={8}` + "Mínimo 8 caracteres". El helper de errores traduce `PASSWORD_TOO_SHORT` al mensaje en español.
   - *Alternativa descartada*: dejar el default silencioso — el bug fue real (UIAnuncia 6, servidor 8) y explícito > implícito.

4. **Tab del modal: estado elevado a `SessionDisplay`** (que ya sabe qué botón abrió el modal) y `AuthModal` pasa a ser controlado (`tab` + `onTabChange`).
   - *Alternativa descartada*: `key={modalTab}` para remontar — fuerza remontaje innecesario y pierde los valores tecleados al cambiar de tab interno.
   - Consecuencia adicional: al cerrarse el modal se limpia el error y los campos (el spec pide conservarlos entre tabs/fallos, no entre aperturas).

5. **Refresh de la vista server-rendered: `router.refresh()` en el success de auth y en sign-out.** El RSC de `/` vuelve a pedir sesión+tasks al server; `useSession` del cliente ya se actualiza solo. Reemplaza el `page.reload()` del E2E.
   - *Alternativa descartada*: `window.location.reload()` — recarga completa, pierde estado SPA y es más lento.

6. **`apply-schema-turso.mjs`: DDL 100% `IF NOT EXISTS`** para las 5 tablas de auth + `Task` + sus índices, sintetizado con `migrate diff --from-empty --to-schema ... --script` y un post-proceso genérico (no solo el replace actual de `Task`). Se ejecuta primero contra la DB de test Turso para reparar el 500.
   - Hallazgo en la revisión: la DB de test ya tenía una tabla `Task` desactualizada (sin `userId`), que `IF NOT EXISTS` no puede corregir. El script compara columnas esperadas vs. reales (`PRAGMA table_info`) y, ante tablas desalineadas, falla alto por defecto; con `--recreate-outdated` las DROP+CREATE (validado por el usuario para la DB de test; el mismo script corre en build de Vercel, por eso el drop opt-in y no silencioso).
   - *Alternativa descartada*: borrar siempre las tablas desalineadas — destruiría datos en producción si la prod quedara atrás.
   - *Riesgo controlado*: el modo por defecto no borra nada (solo crea lo que falta).

7. **E2E adds**: `data-testid="auth-email"` / `"auth-password"` en los inputs (los tests ya los esperaban), acceso por teclado intacto, y nuevo `lógica de sesión server-side` scenario en la spec cubierto por el E2E (crear tarea tras registro sin recarga manual).

8. **Google OAuth en el modal**: botón dedicado que llama `authClient.signIn.social({ provider: "google", callbackURL: "/" })`. Colocado bajo el footer del form, separado por un divisor ("o continúa con").
   - *Nota*: `GOOGLE_CLIENT_ID/SECRET` ya están en `.env`; el flujo completo solo es verificable manualmente (credenciales externas).

## Risks / Trade-offs

- [Cambiar `currentUserId` afecta a las 3 Server Actions] → Es un solo punto (`currentUserId`); los tests unitarios de `app/actions.test.ts` y de `lib/tasks.test.ts` se actualizan en la misma tarea.
- [`headers()` solo funciona en contextos de request de Next] → Las acciones ya corren en request scope; el RSC igualmente. No hay uso fuera de esos contextos.
- [Mensajes de Better Auth cambiando](los códigos de error son estables, pero el helper agrega fallback genérico para no filtra inglés al usuario).
- [Reparar DB de test con tabla `Task` desalineada] → El usuario aprobó `--recreate-outdated` para la DB de test (1 fila de prueba; el flujo E2E ya borra las filas en cada corrida). En modo por defecto el script nunca borra, y en prod falla alto pidiendo intervención.
- [`router.refresh()` tras sign-out muestra un frame anónimo] → Es el comportamiento esperado; el E2E verifica que el formulario desaparece sin recarga manual.
- [OAuth sin E2E completo] → Cobertura a nivel de redirect + vinculación existente en backend; se documenta en tasks como verificación manual.

## Migration Plan

1. Idempotizar `apply-schema-turso.mjs` y ejecutarlo contra la DB de test (repara el 500).
2. Aplicar los fixes de código (session headers → error handling → modal/UX → Google → E2E).
3. `npm test` (vitest) + E2E de `todo-auth.spec.ts` con Turso de test.
4. Rollback: los cambios son aditivos en frontend/script; revertir el commit restaura el estado actual. La DB reparada no requiere rollback (solo tablas añadidas).

## Open Questions

(ninguna — la revisión sobre el código real resolvió las decisiones con evidencia; el mínimo de contraseña usa el default de Better Auth y la spec lo fija en 8)
