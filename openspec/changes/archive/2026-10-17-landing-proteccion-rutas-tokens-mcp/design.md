# Design

## Context

Ver `proposal.md` — Why. Estado actual y restricciones que condicionan el enfoque:

- Una única página (`app/page.tsx`) sirve de app completa; sin sesión oculta el formulario con un condicional y no existe middleware ni `proxy`. Better Auth (1.7.10 instalado) resuelve sesiones contra `McpToken`/tablas de auth en SQLite (dev) y Turso (test/prod).
- El endpoint `/api/mcp` ya valida `Authorization: Bearer` calculando SHA-256 y contrastando contra `McpToken.token`, actualiza `lastUsedAt` y resuelve `userId`; `expiresAt` ya se comprueba. Lo que no existe es ninguna forma de generar o gestionar tokens.
- Next.js 16: `middleware.ts` está deprecado y renombrado a `proxy.ts` (runtime Node, soporta `config.matcher`). `better-auth/cookies` expone `getSessionCookie(request)` para chequeo optimista sin tocar la DB.
- La identidad visual ya está decidida (tema oscuro "turno de noche", Albert Sans, acento menta) y las specs `todo-tasks`/`user-auth-ui` fijan detalles de layout, testids y accesibilidad que no deben romperse.
- El proyecto no usa carpeta `src`; los tests corren con Vitest (unit/integración contra Turso de test) y Playwright (E2E con servidor propio y `fullyParallel: false`).

## Goals / Non-Goals

**Goals:**

- Separar marketing y producto: landing pública en `/`, app en `/tareas`, tokens en `/mcp`, con una navbar compartida.
- Protección de rutas de defensa en profundidad sin introducir un servidor de autorización nuevo.
- Ciclo de vida completo de tokens MCP (generar, mostrar una vez, listar, revocar, instrucciones) reutilizando la validación Bearer existente.
- Landing construida con el flujo de `taste-skill` (dirección dealt, gate, screenshots), motion según `emil-design-eng` y auditoría `web-design-guidelines`, sin inventar prueba social.
- Preservar flujos, `data-testid` y cobertura: baseline antes, suite completa en verde después.

**Non-Goals:**

- MCP Auth con OAuth 2.1 / servidor de autorización propio; `scopes` queda sin aplicar (el campo existe, no se valida).
- Página `/login` dedicada: se conserva el modal único existente.
- Cambios en contratos de las tools MCP o en el endpoint `/api/mcp` (salvo que los tokens generados funcionen igual que los actuales).
- Internacionalización: la landing y la UI siguen en español.
- Etiquetas/nombres por token (se decidió solo prefijo).

## Decisions

### 1. Modelo de rutas: `/` landing, `/tareas` app, `/mcp` tokens

La app actual se mueve intacta a `app/(protegido)/tareas/page.tsx`; `/` pasa a ser la landing; `/mcp` aloja la gestión de tokens. Alternativas descartadas: renderizar landing o app en la misma URL según sesión (la app pierde URL propia y se mezclan contextos) y dejar la app en `/` con landing en otra ruta (entrada de marketing enterrada).

### 2. Grupo de rutas protegidas con layout autoritativo + `proxy.ts` optimista

- `app/(protegido)/layout.tsx` resuelve la sesión con `auth.api.getSession({ headers: await headers() })` y redirige a `/?auth=login&next=<ruta>` si no hay sesión. Es la capa autoritativa.
- `proxy.ts` (raíz) usa `getSessionCookie(request)` para redirigir antes de renderizar cuando no hay cookie. Es solo optimista: la cookie puede existir sin sesión válida, por eso nunca sustituye al layout.
- Las Server Actions mantienen su chequeo `currentUserId()` como última línea.
- Alternativas descartadas: solo layout (peor UX: se procesa la página antes de redirigir) y solo proxy (inseguro: presencia de cookie ≠ sesión válida).

### 3. Acceso dirigido y retorno post-login

El redirect agrega `?auth=login&next=<ruta>`; la landing lee esos parámetros y abre el modal existente en la pestaña correcta. Tras autenticarse (email o Google) se navega a `next` si es ruta local válida; en caso contrario a `/tareas`. `next` se valida (debe empezar por `/` y no `//`) para evitar open redirect. El `callbackURL` de Google deja de ser `/` fijo. Alternativa descartada: página de login dedicada (duplica UI y rompe el patrón de modal ya probado).

### 4. Navbar compartida reutilizando `AuthModal`

`components/site-header.tsx` (client) con marca, enlaces y acciones de sesión vía `authClient.useSession()`. Sin sesión: "Iniciar sesión"/"Registrarse" abren el modal; con sesión: avatar + nombre, enlaces "Mis tareas"/"Tokens MCP" y "Cerrar sesión" (que navega a `/` y refresca). El app page conserva su titular del día debajo de la navbar. Se elimina `SessionDisplay` de la cabecera de la app (su lógica se absorbe en el header).

### 5. Formato y almacenamiento de tokens

- Formato `tmcp_<base64url(32 bytes aleatorios)>`. El prefijo visible son los primeros 8 caracteres (`tmcp_ab12…`), persistidos en `McpToken.tokenPrefix` para poder listar sin exponer el secreto.
- Se persiste únicamente `sha256(plaintext)` en `McpToken.token` (igual que hoy); el plaintext vive solo en el estado del diálogo y no se vuelve a mostrar (ni se escribe en logs ni en localStorage).
- Expiración por defecto 90 días (`expiresAt`), ya validada por `authenticateMcpBearer`. Revocar = borrar la fila (efecto inmediato porque la validación consulta la DB en cada request). `scopes` se guarda `null`.
- Alternativa descartada: guardar el token en claro (expone la DB) y no añadir prefijo (lista indistinguible).

### 6. Servicio y acciones de tokens

- `lib/mcp-tokens.ts`: funciones puras de negocio (`createMcpToken`, `listMcpTokens`, `revokeMcpToken`) con Prisma, sin lógica duplicada.
- `app/mcp/actions.ts` (Server Actions): resuelven sesión, validan con Zod (`lib/validators.ts`) y devuelven el plaintext una sola vez en la creación. Alternativa descartada: route handlers REST (el proyecto ya usa Server Actions para mutaciones de UI).

### 7. Esquema: `tokenPrefix` idempotente

`ALTER TABLE mcp_token ADD COLUMN tokenPrefix TEXT` aplicado de forma idempotente: `prisma db push` para la DB local y guardado por introspección (`pragma table_info`) en `scripts/apply-schema-turso.mjs` para la DB de test/prod; los tokens preexistentes quedan con prefijo nulo. El script de build ya lo ejecuta en deploy.

### 8. Landing: contenido y construcción

- RSC estática; la navbar y la demo viva son islas cliente. Sin datos del usuario en el HTML público.
- Argumento por claims con fragmentos reales del producto (las capturas "honestas" de software son sus propios fragmentos de UI, marcados `data-ui` para el inspector); sin testimonios, logos ni métricas inventadas.
- Dirección visual: `draw.mjs` con `--keep palette,type` (marca fija) y secciones derivadas del argumento; gate `lint.mjs`/`inspect.mjs` a 1440/768/390 con corrección de `FAIL`; motion con `transform`/`opacity`, feedback de `:active` y `prefers-reduced-motion`.
- Interacción viva: mini demo local de captura/estado de tarea (sin persistir, con fallback sin JS) + bloque copiable de configuración MCP.
- Cierre con auditoría `web-design-guidelines` (fetch remoto) sobre los archivos nuevos; findings `file:line` corregidos o justificados.

### 9. Pruebas y preservación de funcionalidad

- Baseline registrado antes de tocar código (`npm test` y `npx playwright test`).
- Vitest: `lib/mcp-tokens.test.ts` (hash vs. plaintext, prefijo, expiración, revocación, aislamiento por usuario) y validadores Zod; ajustes mínimos en tests existentes solo si el cambio de ruta los afecta.
- Playwright: nuevos `e2e/landing.spec.ts` (pública, CTA abre modal), `e2e/proteccion.spec.ts` (deep link → landing con modal; retorno tras login; logout) y `e2e/mcp-tokens.spec.ts` (generar/copiar/listar/revocar + llamada MCP con token generado); se actualizan `e2e/todo.spec.ts` y `e2e/todo-auth.spec.ts` para entrar por `/tareas` detrás del login, conservando `data-testid` y cobertura de los flujos existentes.
- Verificación visual con la skill `playwright-cli` (snapshots/screenshots a 1440 y 390) además del gate de `taste-skill`.

## Risks / Trade-offs

- [Chequeo optimista de cookie permite renderizar la ruta antes del redirect del layout] → El layout redirige antes de pintar datos y las páginas/acciones resuelven sesión; ninguna página protegida lee datos fuera de su layout.
- [Mover la app de `/` a `/tareas` rompe los E2E actuales y hábitos de URL] → Se actualizan los dos specs en el mismo cambio y la landing enlaza "Mis tareas"; el redirect post-login devuelve a la ruta solicitada.
- [La landing puede quedar "vacía" o genérica si no se ejecuta el flujo completo] → El gate y la crítica por screenshots son parte de las tareas; los fragmentos de UI reales y la demo viva son obligatorios, no ornamentos.
- [Deriva de esquema entre dev.db y Turso] → DDL idempotente en el script + `prisma db push` local; la suite contra la DB de test valida la columna nueva antes de cerrar.
- [Open redirect vía `next`] → Solo rutas locales (`/` inicial, sin `//`); se cubre con test.
- [La demo viva sin sesión no debe sugerir persistencia real] → La demo es explícitamente local/efímera, sin llamadas al servidor, con fallback sin JS y copia que lo indica.
- [Cerrar sesión estando en una ruta protegida] → La navbar navega a `/` y refresca; el layout también redirige si se llega por otro camino.

## Migration Plan

Orden de implementación (detalle en `tasks.md`): esquema → rutas y layout protegido → navbar y retorno post-login → tokens (`lib` + acciones + página) → landing → baseline/suite completa y documentación.

- **Rollback**: revertir el commit; `/tareas` y `/mcp` dejan de existir y `app/page.tsx` vuelve a ser la app. `tokenPrefix` es nullable, así que revertir el código no requiere tocar datos; los tokens revocados no se recuperan (por diseño).
- **Deploy**: sin variables de entorno nuevas; el build ya aplica el esquema idempotente a Turso. Los usuarios con sesión activa conservan su cookie (misma instancia de Better Auth).
