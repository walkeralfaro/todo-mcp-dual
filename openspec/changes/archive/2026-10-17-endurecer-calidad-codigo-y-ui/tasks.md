# Tasks

## 1. Verificación reproducible (setup)

- [x] 1.1 Añadir `eslint` y `eslint-config-next` a `devDependencies` y crear la config plana (`eslint.config.mjs`) extendiendo `eslint-config-next`, sin reglas ad hoc; verificar con `npm install` y `npx eslint --version`. Si `npm install` falla por falta de red, registrar el bloqueo y dejar `lint` como se indica en 1.2.
- [x] 1.2 Reemplazar el script roto `lint` (`next lint`, eliminado en Next 16) por `eslint .` y añadir `typecheck` (`tsc --noEmit`) y `test:e2e` (Playwright, con el `set -a; source .env` del README) en `package.json`; verificar que `npm run lint`, `npm run typecheck` y `npm run test:e2e` existen y arrancan.
- [x] 1.3 Ejecutar la línea base completa (`npm test` y `npm run test:e2e`) y registrar el resultado: cuántos tests pasan/fallan, qué falla y si cada fallo es test defectuoso o defecto real. Verificación: nota de línea base con la lista de fallos clasificados; si faltan `TURSO_DATABASE_URL`/`TURSO_AUTH_TOKEN`, registrar el bloqueo E2E explícitamente.
- [x] 1.4 Actualizar la sección de Testing de `README.md` con los comandos reales (`npm test`, `npm run typecheck`, `npm run lint`, `npm run test:e2e`) y los requisitos de entorno de cada uno; verificar que cada comando documentado se ejecuta tal cual.

## 2. Fallos de línea base

- [x] 2.1 Corregir los fallos de `npm test` registrados en 1.3: arreglar el test si el test es incorrecto, o el código si es un defecto real (sin cambiar `data-testid` ni mensajes de negocio). Verificación: `npm test` en verde.
- [x] 2.2 Corregir los fallos de la suite E2E registrados en 1.3, con la misma clasificación. Verificación: `npm run test:e2e` en verde.
- [x] 2.3 Si un fallo de 2.1/2.2 revela comportamiento observable no cubierto por las specs, actualizar la spec correspondiente antes de cerrar la tarea y verificar con `openspec validate --specs`.

## 3. Cifra de pendientes del titular (spec: todo-tasks)

- [x] 3.1 Añadir a `lib/tasks.ts` una operación de conteo de tareas no completadas por `userId` (misma capa de negocio, aceptando cliente inyectable como el resto); verificación: tests unitarios en `lib/tasks.test.ts` que cubran conteo con 0, con varios estados y aislamiento entre usuarios.
- [x] 3.2 Usar ese conteo en `app/(protegido)/tareas/page.tsx` para el titular, desacoplado del filtro/búsqueda y del límite de 50 filas del listado; verificación: test que con filtro `COMPLETADA` activo el titular sigue mostrando el número real de no completadas.
- [x] 3.3 Cubrir en E2E la independencia de la cifra (filtro/búsqueda activos y más tareas no completadas que filas visibles); verificación: el caso E2E nuevo pasa y los flujos de titular existentes siguen verdes.

## 4. Navbar alcanzable en móvil (spec: user-auth-ui)

- [x] 4.1 Hacer alcanzables desde la navbar, a 390px, los enlaces "Mis tareas" y "Tokens MCP" junto a "Cerrar sesión" (panel de navegación móvil accesible o layout ajustado, según lo decidido con `playwright-cli`), manteniendo `data-testid` existentes y dianas ≥44px con foco visible. Verificación: snapshot + screenshot a 390px sin solapes, recortes ni scroll horizontal.
- [x] 4.2 Añadir cobertura E2E a 390px de que el usuario autenticado alcanza `/tareas` y `/mcp` desde la navbar. Verificación: el caso E2E nuevo pasa y los E2E de header/autenticación existentes siguen verdes.
- [x] 4.3 Confirmar que el cambio no oculta ni recorta ningún control del header en desktop (1440px). Verificación: snapshot a 1440px y E2E de header verdes.

## 5. Landing: verificación UI/UX contra requisitos vigentes

- [x] 5.1 Auditar la landing (`/`) a 1440px y 390px con `playwright-cli` (snapshot + screenshot) contra `landing-page` (accesibilidad, responsive sin scroll horizontal, demo local, fallback sin JS, configuración MCP copiable) y `web-design-guidelines`; registrar hallazgos con `file:line`. Verificación: informe de hallazgos.
- [x] 5.2 Corregir cada hallazgo bloqueante de 5.1 (foco, contraste, recortes, dianas táctiles, jerarquía) sin rediseñar ni alterar `data-testid`; verificación: los hallazgos corregidos quedan verificados con un nuevo snapshot y los E2E de landing siguen verdes. Si un hallazgo exige cambiar el contrato observable, reflejarlo como delta de `landing-page` y validar con `openspec validate --specs`.

## 6. Buenas prácticas internas

- [x] 6.1 Separar en `app/actions.ts` los errores de validación (mensaje en español del esquema Zod) de los fallos internos (mensaje genérico al cliente, detalle solo en log), conservando los mensajes de negocio existentes. Verificación: tests en `app/actions.test.ts` para título vacío, título de 101 caracteres (mensaje de máximo, no JSON de Zod) y fallo interno simulado (mensaje genérico sin filtrar `message`).
- [x] 6.2 Aplicar el mismo criterio en `lib/mcp.ts`/tools MCP para no devolver detalles internos al agente; verificación: tests de `lib/mcp.test.ts` y `app/api/[transport]/route.test.ts` en verde con caso de fallo interno.
- [x] 6.3 Eliminar el código muerto de `lib/tasks.ts` (spread `...(cond ? {} : {})` y `nextEstado` si queda sin uso) y unificar el tipo del cliente inyectable eliminando los castings `as DbClient`; verificación: `npm run typecheck` y `lib/tasks.test.ts` en verde, con el ciclo de `fechaCulminada` intacto.
- [x] 6.4 Retirar los `any` de `app/actions.test.ts` y `app/mcp/actions.test.ts` con mocks tipados estrechos; verificación: `npm run lint` y `npm run typecheck` sin avisos nuevos por `any`.
- [x] 6.5 Verificar que `lib/tasks.ts` sigue siendo la única capa de negocio (sin lógica de tareas duplicada en `app/actions.ts`, `app/mcp/actions.ts` ni `lib/mcp.ts`) y corregir cualquier duplicación detectada. Verificación: revisión de los tres adaptadores y `npm test` en verde.
- [x] 6.6 Alinear `README.md` y `AGENTS.md` con el estado real (estructura, comandos, capas) donde estén desactualizados; verificación: cada afirmación de comandos/rutas del documento se comprueba contra el repo.

## 7. Defectos detectados en la auditoría: tools MCP

- [x] 7.1 Corregir la autenticación por usuario de las tools en `app/api/[transport]/route.ts`: la ruta inyectaba `userId` en `params` del JSON-RPC, pero el SDK entrega al handler solo los `arguments` ya validados por el `inputSchema` (Zod descarta las claves no declaradas), así que ninguna tool recibía el usuario y todo `tools/call` respondía "No autenticado". Ligar las tools al `userId` del token por petición, manteniendo el contrato visible (mismos nombres, mismas descripciones y mismo formato de respuesta). Verificación: `create_task` y `list_tasks` por la ruta real operan sobre el usuario del token.
- [x] 7.2 Hacer que los errores de validación de las tools lleguen en español: hoy el `inputSchema` publicado repite los límites de negocio y el SDK responde en inglés ("Input validation error: …"). Los esquemas publicados pasan a describir tipos y límites en su `description`, y la validación con mensajes en español (y sus límites) vive solo en `lib/validators.ts`. Verificación: por la ruta real, título vacío y título de 101 caracteres devuelven `El título es obligatorio` y `Máximo 100 caracteres`, sin crear tarea.
- [x] 7.3 Cubrir `tools/call` en `app/api/[transport]/route.test.ts` (antes solo había pruebas de `tools/list`): crear y listar con token real, aislamiento entre usuarios, `userId` del cliente ignorado, errores de validación en español y fallo interno sin filtrar detalle. Verificación: los casos nuevos pasan junto a los de auth y `tools/list`.
- [x] 7.4 Reflejar en la spec `mcp-tasks` que el `userId` de cada invocación proviene solo del token y que la validación responde en español desde `lib/validators.ts` (delta del cambio) y validar con `openspec validate`.

## 8. Integración final

- [x] 8.1 Ejecutar la verificación completa (`npm run lint`, `npm run typecheck`, `npm test`, `npm run test:e2e`) y confirmar todo en verde, o registrar cualquier fallo residual con su causa. Verificación: salida de los cuatro comandos.
- [x] 8.2 Ejecutar `openspec validate --specs --strict` y `openspec validate endurecer-calidad-codigo-y-ui --strict`; verificación: sin errores (los avisos informativos de requisitos largos ya existentes no cuentan como fallo).
- [x] 8.3 Revisión final de UI/UX con `playwright-cli` en 1440px y 390px sobre landing, `/tareas` y header, y con `web-design-guidelines`; verificación: informe de cierre con todo hallazgo corregido o justificado como excepción aceptada.
