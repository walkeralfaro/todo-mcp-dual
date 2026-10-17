# Proposal

## Why

El producto ya funciona de punta a punta (UI + MCP sobre el mismo SQLite), pero no tiene entrada pública ni frontera entre marketing y producto: `/` renderiza la app "a medias" sin sesión (el formulario se oculta y la lista queda vacía con un aviso), no existe ninguna protección de rutas y el servidor MCP exige tokens que hoy nadie puede generar desde la app (`McpToken` solo se puebla a mano). Este cambio añade la landing pública, mueve la app a una ruta protegida y da ciclo de vida completo a los tokens MCP, con pruebas que garanticen que la funcionalidad existente sigue intacta.

## What Changes

- **Landing pública en `/`**: navbar compartida, argumento por claims con fragmentos reales del producto, una interacción viva (demo local de captura de tarea + bloque copiable de configuración MCP) y CTA de acceso. Construida con el flujo de `taste-skill` (dirección dealt con `--keep palette,type`, gate `lint`/`inspect`, screenshots y crítica), motion según `emil-design-eng` (transform/opacity, `prefers-reduced-motion`, feedback de press) y auditoría final con `web-design-guidelines` (fetch remoto + informe `file:line`).
- **App actual movida a `/tareas` sin cambios de layout**: formulario + filtros + titular + lista + footer tal cual; se elimina el condicional que ocultaba el formulario (la protección pasa a ser de ruta, no de render).
- **Navbar compartida** en landing y `/tareas`: marca, enlaces ("Mis tareas", "Tokens MCP"), acciones de sesión (Entrar/Registrarse o avatar/Cerrar sesión). Reemplaza al `SessionDisplay` suelto actual.
- **Protección de rutas en 3 capas**: `proxy.ts` (chequeo optimista con `getSessionCookie`), layout del grupo protegido (chequeo autoritativo con `auth.api.getSession`) y Server Actions existentes (ya rechazan sin sesión). Redirect a `/?auth=login&next=<ruta>` y retorno a la ruta original tras autenticarse (también Google), con `next` validado (solo rutas locales).
- **Página `/mcp` con ciclo de vida de tokens**: generar (plaintext `tmcp_…` mostrado una única vez con botón copiar, hash SHA-256 en DB), listar (prefijo visible, fechas, último uso), revocar con confirmación e instrucciones de conexión (URL `/api/mcp`, cabecera `Authorization`, JSON de cliente MCP).
- **Esquema**: campo `tokenPrefix` en `McpToken` para identificar tokens en la lista; expiración por defecto 90 días. Aplicar de forma idempotente a la DB local y a la de test (Turso).
- **Pruebas y documentación**: baseline de la suite actual antes de tocar código; Vitest para `lib/mcp-tokens`; Playwright nuevo para landing, protección de rutas y tokens (con `playwright-cli` para verificación visual), y actualización de los dos specs E2E existentes; `requirement.md` y README al día.

## Capabilities

### New Capabilities

- `landing-page`: página pública de presentación en `/` con navbar, argumento verificable sección a sección, interacción viva del producto y llamada a la acción de acceso.
- `mcp-tokens`: ciclo de vida de los tokens de acceso MCP (generación con visualización única, prefijo y expiración, listado, revocación e instrucciones de conexión) integrado con la autenticación Bearer existente.

### Modified Capabilities

- `user-auth-ui`: (1) navbar compartida con acciones de sesión en landing y app; (2) rutas `/tareas` y `/mcp` protegidas con redirección a la landing (modal abierto) y retorno post-login; (3) el formulario ya no se oculta condicionalmente: la página de tareas solo existe con sesión.
- `todo-tasks`: (1) la UI de tareas vive en `/tareas`; (2) el requisito de estabilidad E2E se actualiza: flujos y `data-testid` se conservan, pero los specs entran por la nueva ruta protegida.

## Impact

- **Código**: `app/page.tsx` → `app/tareas/page.tsx` (grupo protegido con layout), `app/page.tsx` nuevo (landing), `app/layout.tsx`, `components/site-header.tsx` (nuevo), `components/ui-auth/*`, `app/mcp/page.tsx` (nuevo), `lib/mcp-tokens.ts` (nuevo), `app/actions.ts`, `lib/validators.ts`, `prisma/schema.prisma`, `proxy.ts` (nuevo), `scripts/apply-schema-turso.mjs`, `e2e/*`.
- **Datos**: nuevo campo `tokenPrefix` en `mcp_token` (idempotente, sin pérdida de datos). Los tokens existentes quedan con prefijo nulo.
- **Breaking**: `/` deja de ser la app (ahora landing); `/tareas` y `/mcp` requieren sesión. Los E2E actuales cambian de entrada (registro/login primero).
- **Supuestos registrados**: expiración de token por defecto 90 días; `scopes` queda sin aplicar (fuera de alcance); la landing se escribe en español con la identidad visual existente (tema noche, Albert Sans, acento menta); Google OAuth se verifica a nivel de botón/redirect (credenciales reales fuera del E2E).
