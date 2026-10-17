# Tasks

## 1. Baseline y esquema

- [x] 1.1 Registrar baseline de la funcionalidad existente: ejecutar `npm test` y `npx playwright test` y verificar que ambas suites quedan verdes antes de tocar código (guardar resumen como referencia del cambio).
- [x] 1.2 Añadir `tokenPrefix String?` al modelo `McpToken` en `prisma/schema.prisma`, regenerar el cliente (`prisma generate`) y aplicar a la DB local (`prisma db push`); verificar con `prisma db pull`/consulta que la columna existe.
- [x] 1.3 Extender `scripts/apply-schema-turso.mjs` para añadir `tokenPrefix` de forma idempotente (guardado por introspección) sobre la DB de test; verificar que ejecutar el script dos veces no falla y que `npm test` sigue verde contra Turso.
- [x] 1.4 Test de integración del esquema nuevo: verificar que un `McpToken` creado con `tokenPrefix` persiste y se lee de vuelta (Vitest, DB de test).

## 2. Rutas y protección de la app

- [x] 2.1 Crear `app/(protegido)/layout.tsx` que resuelva la sesión con `auth.api.getSession` y redirija a `/?auth=login&next=<ruta>` sin sesión; verificar con petición manual a `/tareas` sin cookie (redirect 3xx con `next` correcto).
- [x] 2.2 Mover `app/page.tsx` a `app/(protegido)/tareas/page.tsx` conservando layout, filtros, titular y footer, y eliminar el condicional `{userId && <TaskForm/>}` (la ruta garantiza sesión); verificar que la página compila y muestra formulario + lista con sesión vía `playwright-cli goto`.
- [x] 2.3 Crear `proxy.ts` con `getSessionCookie` y `matcher` para `/tareas` y `/mcp`; verificar con `curl` sin cookie que responde redirect a `/?auth=login&next=/tareas` y con cookie válida que pasa.
- [x] 2.4 Crear landing mínima temporal en `app/page.tsx` (placeholder que se reemplaza en el grupo 5) para que `/` responda 200 sin sesión; verificar con `curl -I /`.
- [x] 2.5 Añadir helper `safeNextPath` (solo rutas locales: empieza por `/` y no `//`) en `lib/auth-redirect.ts` con tests Vitest que cubran válidos e inválidos (`https://…`, `//evil`, vacío).
- [x] 2.6 Extender `components/ui-auth/auth-modal.tsx` para aceptar `next`, usarlo en `callbackURL` de Google y navegar tras éxito (default `/tareas`); verificar el retorno con el e2e de protección (`/?auth=login&next=/mcp` → login → `/mcp`).
- [x] 2.7 Actualizar `app/actions.ts` (`revalidatePath("/tareas")`) y verificar que crear/editar/borrar siguen refrescando el listado.
- [x] 2.8 Crear `e2e/proteccion.spec.ts`: deep link a `/tareas` y `/mcp` sin sesión redirige a la landing con modal abierto; login retorna a `next`; logout desde `/tareas` vuelve a `/`; `next` inválido cae a `/tareas`; verificar suite Playwright verde.
- [x] 2.9 Actualizar `e2e/todo.spec.ts` y `e2e/todo-auth.spec.ts` para entrar por `/` → autenticación → `/tareas`, conservando todos los `data-testid` y los flujos existentes; verificar ambos specs verdes.
- [x] 2.10 Actualizar `requirement.md` (rutas `/`, `/tareas`, `/mcp`, protección y tokens MCP); verificar que el documento refleja el comportamiento implementado.

## 3. Navbar compartida

- [x] 3.1 Crear `components/site-header.tsx` (marca, enlaces, acciones de sesión vía `authClient.useSession`, modal existente) y montarlo en `app/layout.tsx`; verificar con `playwright-cli` que `/` y `/tareas` muestran la misma navbar y que sin sesión aparecen "Iniciar sesión"/"Registrarse".
- [x] 3.2 Retirar `SessionDisplay` de la página de tareas (su lógica queda en el header), dejar el titular del día debajo de la navbar y reutilizar avatar/logout; verificar con el ciclo login → avatar → "Cerrar sesión" → landing en `playwright-cli` y en `e2e/todo-auth.spec.ts` actualizado.
- [x] 3.3 Añadir enlaces "Mis tareas" (`/tareas`) y "Tokens MCP" (`/mcp`) solo con sesión; verificar por teclado (Tab/Enter) que navegan a las rutas protegidas y que sin sesión esos enlaces no se muestran.

## 4. Tokens MCP

- [x] 4.1 Implementar `lib/mcp-tokens.ts` (`createMcpToken`, `listMcpTokens`, `revokeMcpToken`) con formato `tmcp_` + 32 bytes aleatorios, persistencia de hash SHA-256 y `tokenPrefix`, y expiración por defecto de 90 días; verificar con `lib/mcp-tokens.test.ts` (el registro nunca contiene el valor en claro, el prefijo coincide, la expiración es +90 días).
- [x] 4.2 Añadir esquemas Zod en `lib/validators.ts` para las entradas de tokens y sus tests de validación (payload inválido rechazado con mensaje en español).
- [x] 4.3 Crear `app/mcp/actions.ts` (Server Actions de generar/listar/revocar) que exijan sesión y verifiquen propiedad del token; verificar con tests que sin sesión devuelven "No autenticado" y que un usuario no puede revocar tokens ajenos.
- [x] 4.4 Crear `app/(protegido)/mcp/page.tsx` con la lista de tokens (prefijo, creación, último uso, expiración) y los componentes cliente de generación (diálogo con visualización única y botón copiar), revocación (confirmación) e instrucciones de conexión copiables; verificar con `playwright-cli` el flujo generar → copiar → recargar (el claro ya no está) → revocar.
- [x] 4.5 Crear `e2e/mcp-tokens.spec.ts`: generar token muestra el valor una sola vez, la lista muestra prefijo y fechas, revocar pide confirmación y el token revocado recibe 401 en `/api/mcp`; verificar suite verde.
- [x] 4.6 Ampliar `app/api/[transport]/route.test.ts` con un token generado por `lib/mcp-tokens.ts`: verificar que autentica tools, actualiza `lastUsedAt` y que un token expirado se rechaza.
- [x] 4.7 Documentar en `README.md` el flujo de tokens (generar en `/mcp`, cabecera `Authorization: Bearer`, ejemplo de configuración de cliente MCP); verificar que los comandos/ejemplos escritos funcionan tal cual con un token real generado en local.

## 5. Landing (flujo taste-skill + emil-design-eng + web-design-guidelines)

- [x] 5.1 Ejecutar el paso 1–3 de `taste-skill` (inventario del sujeto y `draw.mjs --keep palette,type` con las secciones del argumento) y dejar la dirección elegida con su seed en `.taste-skill/direction.json`; verificar que la dirección existe y que se redibujó solo por razones registradas.
- [x] 5.2 Escribir el copy deck completo (claims con su prueba, titulares de ≤2 líneas a todo ancho) siguiendo `references/copy.md`; verificar la aritmética de caracteres antes de maquetar y que ninguna sección queda sin claim.
- [x] 5.3 Construir la landing en `app/page.tsx` con navbar, secciones según la dirección (fragmentos reales de UI marcados `data-ui`), demo viva local con fallback sin JS y bloque copiable de configuración MCP; verificar con `lint.mjs` sin FAIL y `inspect.mjs` a 1440/768/390 sin FAIL, revisando los screenshots.
- [x] 5.4 Añadir la capa de motion según `emil-design-eng` (entradas escalonadas por sección, feedback `:active`, un elemento en movimiento, curvas `ease-out` y ≤300 ms) con `prefers-reduced-motion`; verificar que `inspect.mjs` cuenta ≥8 elementos que se mueven y que ningún contenido queda oculto en los screenshots.
- [x] 5.5 Crear `e2e/landing.spec.ts`: `/` pública sin datos de usuario, CTA abre el modal en la pestaña correcta, `?auth=register` respeta la pestaña, la demo local añade/marca tareas sin llamadas al servidor y el bloque MCP copia; verificar suite verde (6/6, incluyendo sin JS).
- [x] 5.6 Auditar los archivos nuevos con `web-design-guidelines` (fetch remoto de las reglas) y corregir los hallazgos; verificar que no quedan bloqueantes sin corregir o justificados por escrito. Hallazgos aplicados: `html { color-scheme: dark; }` en `globals.css` (tema oscuro nativo), `translate="no"` sobre «MCP» (marca); restante son datos de ejemplo reales (fechas `12/10`) y copy descriptivo no-input, no se corrigieron.
- [x] 5.7 Verificación visual final con `playwright-cli` en 1440 px y 390 px: sin scroll horizontal (scrollW === clientW en ambos), dianas táctiles ≥44 px (mín 48 px en ambos anchos) y foco visible (anillo acento 2px en `:focus-visible`); capturas registradas en `/tmp/opencode/57-{1440,390}.jpg` y correcciones aplicadas sin regresiones (inspect 0 FAIL en las tres anchas).

## 6. Integración final

- [x] 6.1 Suite completa: `npm test` (72/72 verde) + `npx playwright test` (18/18 verde) sin pérdida de cobertura vs baseline 1.1: `landing-login` visible anónimo, header `auth-register-btn` → `/tareas` intacto, demo board cero llamadas al servidor.
- [ ] 6.2 `npm run build` verde (incluye aplicación idempotente del esquema) y smoke manual: `/` → login → `/tareas` (crear/filtrar/completar/borrar) → `/mcp` (generar/revocar) → logout → `/tareas` redirige.
- [x] 6.3 `openspec validate landing-proteccion-rutas-tokens-mcp` sin errores y revisión de que cada spec del cambio tiene su verificación cubierta por tests o verificación manual registrada.
