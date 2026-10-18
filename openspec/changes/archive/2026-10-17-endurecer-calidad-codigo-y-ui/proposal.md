# Proposal

## Why

La app funciona y sus specs son detalladas, pero la calidad no es reproducible ni verificable: no hay linter instalado (el script `lint` apunta a `next lint`, eliminado en Next 16), no existe script para la suite E2E de Playwright y las suites no se confirman en verde desde el rediseño de la landing. Esa falta de verificación convive con defectos concretos ya localizados, tanto de comportamiento en la UI (cifra de pendientes y navegación móvil) como de prácticas internas (manejo de errores crudo, código muerto, tipado laxo).

## What Changes

- **Verificación reproducible:** instalar un linter real y reemplazar el script `lint` roto; añadir `typecheck` y `test:e2e`. Ejecutar Vitest y Playwright como línea base, registrar fallos y corregirlos (test defectuoso → arreglar test; defecto real → arreglar código).
- **Buenas prácticas:** mapear errores de validación a mensajes en español controlados y no filtrar `message` de errores internos en Server Actions; eliminar código muerto y colisiones de tipo en `lib/tasks.ts`; retirar `any` restante; mantener `lib/tasks.ts` como única capa de negocio.
- **UI/UX:**
  - `/tareas`: la cifra del titular mide los pendientes reales del usuario, no el subconjunto filtrado ni la ventana de 50 filas.
  - Header compartido: los enlaces "Mis tareas" y "Tokens MCP" pasan a ser alcanzables en todos los anchos, incluido móvil (<640px), donde hoy se ocultan.
  - Landing (`/`): verificar contra sus requisitos vigentes (accesibilidad, responsive, demo y guía MCP) y corregir cualquier incumplimiento, sin rediseñar.
- **Docs:** actualizar `README.md` y `AGENTS.md` donde describen comandos o estado que ya no coinciden.
- **Defecto funcional MCP (detectado en la auditoría):** la ruta `/api/mcp` no entregaba el `userId` autenticado a ninguna tool (la inyección en `params` del JSON-RPC se pierde al validar los `arguments` con el `inputSchema`), de modo que todo `tools/call` respondía "No autenticado"; además los errores de validación de las tools se devolvían en inglés desde el SDK. Se liga cada tool al usuario del token, la validación con mensajes en español queda solo en `lib/validators.ts` y se añade la cobertura de `tools/call` que faltaba.

No hay cambios de esquema, ni de API pública del servidor MCP, ni funcionalidades nuevas.
Fuera de alcance: CI (no se añade workflow), rediseño de `/mcp`, paginación nueva y cambios de modelo de datos.

## Capabilities

### New Capabilities

Ninguna.

### Modified Capabilities

- `todo-tasks`: el requisito "Titular del día con cifra de pendientes" pasa a exigir explícitamente que la cifra cuente todas las tareas no completadas del usuario, con independencia del filtro de estado, la búsqueda activa y el límite de 50 filas del listado.
- `user-auth-ui`: el requisito "Botones de autenticación en el header" pasa a exigir explícitamente que las acciones y enlaces de sesión ("Iniciar sesión", "Registrarse", "Mis tareas", "Tokens MCP", "Cerrar sesión") sean alcanzables en todos los anchos responsivos, incluido móvil (<640px).
- `mcp-tasks`: el requisito del endpoint MCP pasa a exigir explícitamente que el `userId` de cada invocación provenga solo del token Bearer (y que cualquier `userId` del cuerpo o de los `arguments` se ignore), además de cubrir la invocación real de tools, no solo el descubrimiento.

## Impact

- **Dependencias:** se añaden `eslint` y `eslint-config-next` (config plana) en `devDependencies`; se actualizan los scripts de `package.json` (`lint`, `typecheck`, `test:e2e`). Sin cambios en dependencias de runtime.
- **Código:** `app/actions.ts` (errores), `lib/tasks.ts` (cifra de pendientes + limpieza), `lib/validators.ts` (si hace falta exponer mensajes de validación), `app/(protegido)/tareas/page.tsx`, `components/site-header.tsx`, `app/api/[transport]/route.ts` (usuario de las tools MCP); tests unitarios y E2E asociados.
- **Docs:** `README.md`, `AGENTS.md`.
- **Riesgo operativo:** Playwright exige `TURSO_DATABASE_URL` y `TURSO_AUTH_TOKEN` (valores de test); sin ellos la línea base E2E queda bloqueada y se reporta.
