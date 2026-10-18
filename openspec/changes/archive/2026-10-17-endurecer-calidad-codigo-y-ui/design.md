# Design

## Context

Ver `proposal.md` para la motivación. Estado actual relevante para las decisiones:

- `lib/tasks.ts` es la única capa de negocio; `app/actions.ts` (Server Actions) y `lib/mcp.ts` (tools MCP) son adaptadores delgados con validación Zod. Ver `AGENTS.md` §3 (principio de estado único).
- `listTasks(input)` recibe `{ userId, estado?, q?, limit, offset }`, aplica `where` por `userId` + filtros y devuelve filas ordenadas; no existe ninguna operación de conteo.
- `app/(protegido)/tareas/page.tsx` pide 50 filas y deriva `pendientes` filtrando esa misma lista con `estado !== "COMPLETADA"`.
- `components/site-header.tsx` renderiza el `<nav>` de sesión con `hidden ... sm:flex`.
- `app/actions.ts` centraliza errores en `err(e)` → `e.message` para cualquier `Error`.
- `lib/validators.ts` ya define mensajes en español (`"El título es obligatorio"`, `"Máximo 100 caracteres"`) vía Zod; los mensajes viven en el esquema, pero `ZodError.message` es un JSON.
- `app/api/[transport]/route.ts` resuelve el `userId` del token y lo inyecta en `params` del JSON-RPC; el SDK valida los `arguments` de cada `tools/call` contra su `inputSchema` (Zod) y entrega al handler solo ese resultado, así que el `userId` inyectado nunca llega a `lib/mcp.ts` y toda invocación responde "No autenticado". Además, al repetir los límites de negocio en el `inputSchema`, los errores de validación que ve el cliente llegan en inglés desde el SDK.
- `package.json` tiene `lint: "next lint"` (comando inexistente en Next 16), `test` (Vitest) y ningún script E2E. No hay `eslint` ni config de lint instalados; tampoco CI.
- Playwright (`playwright.config.ts`) exige `TURSO_DATABASE_URL` y `TURSO_AUTH_TOKEN` y lanza `npm run dev` en el puerto 3000.

## Goals / Non-Goals

**Goals:**
- Dejar los dos defectos de comportamiento con cobertura de spec y de test: cifra de pendientes real y navegación de sesión alcanzable en móvil.
- Hacer que la verificación sea reproducible con comandos únicos (`lint`, `typecheck`, `test`, `test:e2e`).
- Reducir deuda interna sin cambiar comportamiento: mensajes de error controlados, código muerto fuera, tipado sin `any` ni castings innecesarios.
- Mantener `lib/tasks.ts` como único origen de la lógica de tareas.

**Non-Goals:**
- No se añade CI ni se tocan los secrets/entornos.
- No se rediseña la landing ni la página `/mcp`; solo se corrigen incumplimientos detectados.
- No se introduce paginación nueva ni se cambia el límite de 50 filas visible (solo se desacopla de la cifra del titular).
- No se cambian el esquema Prisma, el contrato de las tools MCP ni los `data-testid` existentes.

## Decisions

**1. Línea base antes de tocar código.**
Primer paso: instalar dependencias, ejecutar `npm test` y la suite E2E y **registrar** los fallos. Sin línea base, cualquier "arreglo" mezcla defectos preexistentes con regresiones propias.
- Alternativa descartada: arreglar primero y testear al final; impide distinguir causa y efecto.

**2. Linter: ESLint con `eslint-config-next` en config plana.**
Es el estándar de Next.js y reemplaza directamente el `next lint` eliminado. `package.json` pasa a `lint: "eslint ."`. Se añade `typecheck: "tsc --noEmit"`, que hoy no existe pese a `strict: true`.
- Alternativa descartada: Biome (más rápido y con formato), pero añade un segundo ecosistema y no es lo que Next documenta para el lint del framework.
- Fallo de instalación (sin red): `lint` queda como `tsc --noEmit` y se documenta el cambio; el resto del plan no depende del linter.

**3. Cifra de pendientes: contar, no derivar de las filas.**
Añadir a `lib/tasks.ts` una operación de conteo de no completadas por `userId` (p. ej. `countPendingTasks(userId, client?)`, con `where: { userId, estado: { not: "COMPLETADA" } }` y `client.task.count`), y usarla en `tareas/page.tsx` en paralelo con `listTasks`. Se mantiene el principio de estado único (misma capa, mismos filtros de `userId`).
- Alternativa descartada: pedir todas las filas sin límite y contar en memoria; rompe con el límite y carga datos innecesarios.
- Alternativa descartada: `listTasks` devolviendo también un total; mezcla contrato de listado con agregación y obliga a cambiar la firma que ya consumen UI y MCP.

**4. Navbar móvil: un control de navegación accesible, no enlaces duplicados.**
Por debajo de `sm` los enlaces de sesión se exponen mediante un control de navegación móvil (botón + panel desplegable accesible, p. ej. reutilizando `Dialog`/patrón menú ya presente en `components/ui/`) o bien volviéndolos visibles con ajuste de layout. Decisión de menor riesgo: preferir la solución que mantenga una sola navbar con foco gestionado, cierre con Escape y dianas ≥44px; se decide en implementación comparando ambas contra `web-design-guidelines` y `playwright-cli` a 390px.
- Alternativa descartada: eliminar `hidden sm:flex` y dejar los enlaces siempre visibles; a 390px el header con enlaces + avatar + "Cerrar sesión" no cabe sin solapes ni recortes.

**5. Errores de Server Action: separar validación de fallo interno.**
Dos clases de error con tratamiento distinto: (a) `ZodError` → primer issue → mensaje en español ya definido en `lib/validators.ts`; (b) cualquier otro error (Prisma, auth, red) → mensaje genérico `"Error inesperado"` al cliente y detalle solo en el log del servidor. Se conservan los objetos `{ ok: false, error }` y los mensajes de negocio existentes (`"No autenticado"`, `"La tarea no existe"`, `"No autorizada"`).
- Alternativa descartada: `err(e)` devolviendo `e.message`; filtra detalles internos (SQL, rutas) y muestra JSON de Zod al usuario.
- Riesgo de compatibilidad: los tests que hoy assertan mensajes siguen pasando porque los mensajes de validación y de negocio no cambian; solo cambia el texto de fallos internos.

**6. Limpieza en `lib/tasks.ts` sin cambio de comportamiento.**
Retirar el spread muerto `...(nextEstado === current.estado && !data.estado ? {} : {})` y la variable `nextEstado` si queda sin uso; unificar el tipo del cliente inyectable a `DbClient` y eliminar los castings `as DbClient`. Verificar con los tests de `lib/tasks.test.ts` que el ciclo de `fechaCulminada` no se altera.
- Alternativa descartada: refactor amplio de `updateTask`; fuera de alcance y con riesgo de regresión en reglas de fecha ya cubiertas por spec.

**7. `any` solo en tests, y se corrige ahí.**
Sustituir los `as any` de `app/actions.test.ts` y `app/mcp/actions.test.ts` por tipos de mock estrechos. No se introduce `any` nuevo en código de app.

**8. Validación del pulido sin inventar herramienta nueva.**
Reutilizar `playwright-cli` (snapshot + screenshot a 1440px y 390px) y `web-design-guidelines`, como ya exige el requisito "Pulido validado con Playwright y guidelines" de `todo-tasks`. Los hallazgos se registran y se corrigen o se justifican.

**9. Tools MCP: el usuario se liga por petición, no viajando en el cuerpo.**
Defecto real localizado al escribir la cobertura de 6.2 (ninguna prueba tocaba `tools/call`, solo `tools/list`). La inyección de `userId` en `params` del JSON-RPC nunca llega a las tools: el SDK valida `request.params.arguments` contra el `inputSchema` y entrega al handler solo el resultado validado (Zod descarta las claves no declaradas). Se construye el handler con las tools ligadas al `userId` del token; el SDK ya crea un servidor MCP por petición, así que no añade estado compartido.
- Alternativa descartada: declarar `userId` opcional en los `inputSchema` e inyectarlo en `arguments`; publica un parámetro que el agente no debe enviar y obliga a sobrescribirlo defensivamente en cada llamada.
- Alternativa descartada: leer el `authInfo` que expone el SDK; `mcp-handler` lo toma de `req.auth` y su tipo es el de OAuth, así que implicaría un casting y depender de un detalle interno de la librería.
- Sin cambio de contrato: mismo `tools/list`, mismos `inputSchema`, mismas respuestas; solo cambia que la invocación opera sobre el usuario del token en vez de fallar siempre.

**10. Validación MCP: una sola fuente, en español.**
Segundo defecto de la misma auditoría: como el `inputSchema` publicado repetía los límites de negocio (`min(1)`, `max(100)`, `max(500)`…), el SDK rechazaba antes de llegar a `lib/mcp.ts` y el cliente recibía `"Input validation error: …"` en inglés, incumpliendo el requisito "Formato y validación de respuestas MCP" (mensajes en español). Los esquemas publicados conservan tipos y enumerados (lo que el agente necesita para invocar) y dejan los límites en su `description`; los límites y sus mensajes viven solo en `lib/validators.ts`, que ya era la fuente de verdad.
- Alternativa descartada: poner mensajes en español dentro del `inputSchema`; el SDK envuelve el texto en su propio mensaje en inglés (`"Input validation error: Invalid arguments for tool …"`) y mantiene la regla duplicada.
- Alternativa descartada: recortar `limit` en lugar de rechazarlo; la spec lo permite, pero cambia silenciosamente lo que pide el cliente y rompe la prueba existente que espera error.
- Consecuencia asumida: `tools/list` deja de anunciar `minLength`/`maxLength`/`maximum` en el JSON Schema; los límites siguen indicados en la descripción de cada campo.

## Risks / Trade-offs

- **Entorno sin `TURSO_*`** → la línea base E2E no puede correr y no se puede afirmar "suites en verde". Mitigación: verificar la presencia de `.env` antes de empezar; si falta, se reporta como bloqueo y se limita la evidencia a Vitest.
- **Sin red para `npm install`** → no se puede instalar ESLint. Mitigación: plan B del lanzador descrito arriba (dejar `lint` en `tsc --noEmit` y documentarlo).
- **`pendientes` con dos consultas** → deriva teórica entre el conteo y el listado. Mitigación: ambas van contra la misma DB en el mismo render; el conteo es por `userId` y no depende del filtro, así que no hay inconsistencia funcional; el titular se recalcula tras cada `revalidatePath("/tareas")`.
- **Navbar móvil con panel** → posible regresión de foco/scroll o de recorte. Mitigación: criterios de aceptación ya fijados en el delta (`user-auth-ui`) y verificación a 390px con `playwright-cli`, más los E2E existentes de header.
- **Arreglar un test que en realidad ocultaba un defecto** → falso "verde". Mitigación: cada fallo se clasifica explícitamente (test defectuoso vs. defecto real); si el defecto toca comportamiento observable, se corrige el código y, si cambia el contrato, se refleja en spec.
- **Filtrado de mensajes de error** → tests que esperaban el mensaje crudo podrían romperse. Mitigación: se ejecutan `npm test` tras el cambio y se ajustan solo las aserciones sobre fallos internos, nunca las de validación/negocio.
- **Funcionalidad sin cobertura (defecto MCP)** → la suite estaba verde mientras `tools/call` fallaba siempre por falta de pruebas de invocación. Mitigación: la corrección se acompaña de casos de `tools/call` en `app/api/[transport]/route.test.ts` (crear, listar, aislamiento y suplantación) y del delta de `mcp-tasks`.

## Migration Plan

No hay migración de datos ni cambios de esquema. Despliegue normal: los cambios son de código y scripts de desarrollo. Rollback: revertir el commit; no hay estado persistido afectado. La única dependencia operativa es poder instalar `eslint`/`eslint-config-next` y disponer de `TURSO_*` de test.

## Open Questions

- Elección final entre navbar móvil "panel desplegable" y "enlaces visibles con layout ajustado" a 390px. No cambia specs (ambas cumplen el delta), ni el enfoque, ni el desglose de tareas: la tarea de UI/UX incluye decidirla y justificarla con la verificación de `playwright-cli` + guidelines.
