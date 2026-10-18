# Cómo funciona TODO-mcp: web y agente sobre el mismo estado {#todo-mcp}

TODO-mcp es una Todo App con dos puertas de entrada. La web se autentica por sesión y el servidor MCP por token Bearer. Ambas comparten **una sola capa de negocio, una sola validación y una sola base de datos**.

- La lógica vive una vez en `lib/tasks.ts`; la web y MCP solo traducen formatos.
- El `userId` sale siempre de la identidad autenticada, nunca del cuerpo de la petición.
- Las rutas se protegen en tres capas: middleware, layout con sesión real y comprobación en la página.
- Los tokens MCP se guardan solo como hash SHA-256 y expiran en 90 días.

@answer scope="Next.js 16 · React 19 · Prisma 7 · Better Auth · MCP"
@meta locale=es quality_profile=showcase style=clean
@source tasks title="Capa de negocio única" path=lib/tasks.ts
@source validators title="Esquemas Zod" path=lib/validators.ts
@source db title="Conexión Prisma" path=lib/db.ts
@source mcpauth title="Autenticación Bearer" path=lib/mcp-auth.ts
@source mcptools title="Tools MCP" path=lib/mcp.ts
@source mcproute title="Ruta MCP" path=app/api/[transport]/route.ts
@source schema title="Modelo de datos" path=prisma/schema.prisma
@source authserver title="Better Auth" path=lib/auth.ts
@source actions title="Server Actions de tareas" path=app/actions.ts

## ¿Cómo se conecta todo? {#arquitectura}

Dos entradas y un núcleo. La persona entra por la web; el agente entra por `/api/mcp`. Ambas vías terminan en `lib/tasks.ts` y en la misma base de datos. Toca un nodo para enfocarlo y ver sus relaciones.

@architecture id=diagrama-app title="Arquitectura de TODO-mcp"
| user | Persona | external |
| agent | Agente IA | external |
| guard | proxy.ts | security |
| pages | Páginas RSC | frontend |
| auth | Better Auth | security | source:authserver |
| actions | Server Actions | backend | source:actions |
| mcpserver | Servidor MCP | backend | source:mcproute |
| bearer | Bearer (mcp-auth) | security | source:mcpauth |
| mcptools | Tools MCP | backend | source:mcptools |
| tasks | lib/tasks.ts | backend | source:tasks |
| validators | Zod | backend | source:validators |
| db | Prisma → DB | database | source:db |
| user > guard | /tareas, /mcp |
| guard > pages | cookie presente |
| pages > actions | Server Actions |
| pages > auth | login y sesión |
| actions > tasks | crear, editar, borrar |
| auth > db | usuarios y sesiones |
| agent > mcpserver | Bearer tmcp_… |
| mcpserver > bearer | verifica hash |
| bearer > db | busca McpToken |
| mcpserver > mcptools | 5 tools |
| mcptools > tasks | misma lógica |
| tasks > validators | valida |
| tasks > db | Prisma |

@steps id=recorrido
| user | Persona | Abre la landing o una ruta protegida desde el navegador. | diagrama-app | user |
| guard | proxy.ts | Comprueba que exista la cookie de sesión; si falta, redirige al acceso. | diagrama-app | guard |
| pages | Páginas RSC | El layout protegido resuelve la sesión real contra la base de datos. | diagrama-app | pages |
| actions | Server Actions | Cada acción vuelve a leer la sesión y valida con Zod. | diagrama-app | actions |
| tasks | lib/tasks.ts | Única capa de negocio: aísla por `userId` y gestiona el ciclo de vida. | diagrama-app | tasks |
| validators | Zod | Aplica los límites y los mensajes en español de todos los campos. | diagrama-app | validators |
| db | Prisma → DB | Una base de datos: SQLite en desarrollo, Turso en producción. | diagrama-app | db |
| agent | Agente IA | Un cliente MCP llama a `POST /api/mcp` con su token. | diagrama-app | agent |
| mcpserver | Servidor MCP | Si el token es válido, crea un handler ligado a ese `userId`. | diagrama-app | mcpserver |
| mcptools | Tools MCP | Las cinco tools traducen a las mismas funciones de negocio. | diagrama-app | mcptools |

## ¿Qué stack y qué piezas usa? {#stack}

Cada capa tiene un único responsable. Next.js aporta el render en servidor, Prisma la persistencia y Zod los límites compartidos.

| Capa | Tecnología | Dónde |
| --- | --- | --- |
| Framework | Next.js 16 (App Router), React 19 | `app/` |
| Estilos | Tailwind CSS 4, shadcn/ui, lucide-react | `components/`, `globals.css` |
| Persistencia | Prisma 7 + SQLite (dev) / Turso | `lib/db.ts`, `prisma/schema.prisma` |
| Autenticación | Better Auth (email y Google) | `lib/auth.ts` |
| MCP | `mcp-handler` sobre el SDK MCP | `app/api/[transport]/route.ts` |
| Validación | Zod 4 | `lib/validators.ts` |
| Pruebas | Vitest (unitarias) y Playwright (E2E) | `*.test.ts`, `e2e/` |

## ¿Qué guarda la base de datos? {#datos}

Dos entidades de negocio y las tablas de Better Auth. Todo vive en el mismo archivo de esquema.

@erd id=modelo-datos title="Modelo de datos (Prisma)"
| entity user | User |
| entity session | Session |
| entity account | Account |
| entity task | Task |
| entity mcptoken | McpToken |
| user.id | text | pk |
| user.email | text | uk |
| user.name | text | |
| user.emailVerified | boolean | |
| session.id | text | pk |
| session.token | text | uk |
| session.userId | text | fk | user.id |
| session.expiresAt | timestamp | |
| account.id | text | pk |
| account.userId | text | fk | user.id |
| account.providerId | text | |
| account.password | text | |
| task.id | text | pk |
| task.titulo | text | |
| task.descripcion | text | |
| task.estado | text | |
| task.fechaCreacion | timestamp | |
| task.fechaCulminada | timestamp | |
| task.userId | text | fk | user.id |
| mcptoken.id | text | pk |
| mcptoken.token | text | uk |
| mcptoken.tokenPrefix | text | |
| mcptoken.userId | text | fk | user.id |
| mcptoken.expiresAt | timestamp | |
| mcptoken.lastUsedAt | timestamp | |
| task > user | many:one | pertenece a |
| mcptoken > user | many:one | pertenece a |
| session > user | many:one | |
| account > user | many:one | |

`Task` es el corazón: `titulo` obligatorio, `descripcion` opcional que se guarda como `null` si no llega, y `estado` por defecto `PENDIENTE`. `fechaCulminada` se asigna al completar y se limpia al reabrir. Hay índices en `(estado, fechaCreacion)` y en `userId`.

`McpToken` guarda el hash, un prefijo visible y las fechas. `Session`, `Account` y `Verification` pertenecen a Better Auth; las sesiones se guardan en la base de datos, no en un JWT.

## ¿Dónde vive la lógica y la conexión? {#negocio}

`lib/db.ts` crea **una sola** instancia de Prisma. Si existen `TURSO_DATABASE_URL` y `TURSO_AUTH_TOKEN`, usa el adaptador `@prisma/adapter-libsql`; si no, abre un archivo SQLite local.

En desarrollo la instancia se guarda en `globalThis` para sobrevivir al recargado en caliente. Prisma 7 exige un adaptador, por eso SQLite también usa `PrismaLibSql`. El archivo exporta el tipo `DbClient` para inyectar un cliente.

`lib/tasks.ts` es la única capa de negocio. Cada función acepta un cliente opcional, así los tests usan su propia base.

| Función | Responsabilidad |
| --- | --- |
| `listTasks` | Lista por `userId`, estado y búsqueda, orden `fechaCreacion desc`, con paginación. |
| `countPendingTasks` | Cuenta las tareas no completadas; alimenta el titular. |
| `getTask` | Lee una tarea y comprueba que existe y que es del usuario. |
| `createTask` | Crea con estado por defecto y `fechaCulminada` coherente. |
| `updateTask` | Actualiza campos parciales y gestiona `fechaCulminada`. |
| `deleteTask` | Elimina tras comprobar existencia y propiedad. |

El aislamiento es estricto: las lecturas y escrituras individuales comparan `task.userId` con el `userId` autenticado y lanzan `DomainError("No autorizada")` si no coinciden. Completar una tarea asigna la fecha; reabrirla la deja en nulo. Todas las entradas se validan con Zod **dentro** de estas funciones, así que ni la UI ni MCP pueden saltarse la validación.[](source:tasks)

## ¿Cómo se validan entradas y errores? {#validacion}

`lib/validators.ts` es la fuente única de los límites y usa mensajes en español.

| Esquema | Reglas |
| --- | --- |
| `tituloSchema` | `trim`, mínimo 1, máximo 100. |
| `descripcionSchema` | `trim`, máximo 500, opcional. |
| `createTaskSchema` | `titulo`, `descripcion?`, `estado?`. |
| `updateTaskSchema` | Campos parciales; `descripcion` admite `null`. |
| `listTasksSchema` | `estado?`, `q?` (máx. 200), `limit` (1–100), `offset`. |

`lib/errors.ts` define `DomainError`, que separa los errores de negocio —con mensaje mostrable— de los errores internos. Los dos adaptadores traducen igual: un `ZodError` usa el mensaje del esquema, un `DomainError` usa el suyo, y cualquier otro error devuelve «No se pudo completar la operación. Inténtalo de nuevo.» y se registra solo en el servidor.[](source:validators)

## ¿Cómo se autentica una persona? {#auth}

Better Auth monta registro, acceso, sesión y cierre en `/api/auth/[...all]`. Cada petición resuelve la sesión desde las cookies del propio request con `auth.api.getSession`; no hay estado de sesión en el cliente.

Las sesiones viven en la base de datos, duran 7 días y se renuevan cada día. El registro por email exige una contraseña de 8 caracteres o más, y también se admite Google. El cliente devuelve `{ data, error }` en lugar de lanzar; `lib/auth-error.ts` traduce códigos como `INVALID_EMAIL_OR_PASSWORD` a mensajes en español. `lib/auth-redirect.ts` valida el parámetro `next` y evita redirecciones abiertas: solo acepta rutas locales.[](source:authserver)

## ¿Cómo se protegen las rutas? {#proteccion}

Hay tres capas, de la más barata a la autoritativa. La primera no toca la base de datos; la segunda sí.

- Capa 1, `proxy.ts`: comprueba que exista la cookie de sesión. Si falta, redirige a `/?auth=login&next=…` e inyecta `x-pathname` para saber a dónde volver.
- Capa 2, `app/(protegido)/layout.tsx`: resuelve la sesión real contra la base de datos y decide si renderiza.
- Capa 3: cada página repite la comprobación como defensa en profundidad.

| Ruta | Acceso | Contenido |
| --- | --- | --- |
| `/` | Pública | Landing y acceso dirigido |
| `/tareas` | Protegida | App de tareas |
| `/mcp` | Protegida | Tokens MCP e instrucciones |
| `/api/auth/*` | Pública | Better Auth |
| `/api/mcp` | Token Bearer | Servidor MCP |

## ¿Qué hace la pantalla de tareas? {#tareas}

`/tareas` es un Server Component. Lee `estado` y `q` de la URL, resuelve el `userId` de la sesión y carga en paralelo el listado y el recuento de pendientes.

El formulario es un componente de cliente con `useTransition`: valida en cliente que el título no esté vacío, pero la validación autoritativa la hace el servidor. Al crear, limpia el formulario y refresca el árbol del servidor. Cada tarea es una fila con un selector de estado, un modo de edición y un borrado que pide confirmación en un diálogo; nada usa `window.confirm`.

El titular muestra «Hoy quedan N» con la cifra en neón, o «Todo al día» si no queda ninguna. Esa cifra cuenta **todas** las pendientes del usuario, sin importar el filtro ni la búsqueda. El filtro de estado y la búsqueda escriben en la URL (`?estado=…&q=…`), de modo que la vista se comparte y navega con atrás y adelante. La búsqueda espera unos 300 ms antes de escribir.

## ¿Cómo funcionan los tokens MCP? {#tokens}

Un token empieza por `tmcp_` y añade 32 bytes aleatorios, es decir 256 bits. Se persiste **solo** el hash SHA-256 y un prefijo visible; el valor en claro existe en memoria y se muestra una única vez.

@facts id=constantes-token
| Prefijo | `tmcp_` |
| Aleatoriedad | 256 bits (32 bytes) |
| Longitud del prefijo | 8 caracteres |
| Caducidad por defecto | 90 días |
| Almacenado | hash SHA-256 |

La lista de `/mcp` muestra el prefijo, la creación, el último uso y la caducidad. Revocar borra la fila, y desde ese momento el token responde 401. Si el token no existe o es de otro usuario, la acción devuelve el mismo error, para no filtrar información.

## ¿Cómo funciona el servidor MCP? {#mcp}

El endpoint vive en `app/api/[transport]/route.ts` y exporta `GET`, `POST` y `DELETE`. Sin token válido responde 401 y no ejecuta ninguna tool. Con token válido, `handlerForUser(userId)` crea un handler MCP para esa petición y registra cinco tools.

| Tool | Entrada | Salida |
| --- | --- | --- |
| `list_tasks` | `estado?`, `q?`, `limit?`, `offset?` | JSON de tareas |
| `get_task` | `id` | JSON de la tarea |
| `create_task` | `titulo`, `descripcion?`, `estado?` | JSON de la tarea |
| `update_task` | `id`, `titulo?`, `descripcion?`, `estado?` | JSON de la tarea |
| `delete_task` | `id` | `{ deleted: true, id }` |

@callout level=warning title="El userId nunca viene del cliente"
El SDK valida los argumentos contra el `inputSchema` publicado y descarta las claves no declaradas; por eso `userId` no se declara. Además, el cierre `handlerForUser(userId)` fija el `userId` del token.

La respuesta usa el formato del SDK: `content` con un bloque `text` que contiene el JSON. Los errores añaden `isError: true`. Un test inyecta el `userId` de otro usuario en los argumentos y comprueba que se ignora.[](source:mcproute)

## ¿Cómo se crea una tarea desde la web? {#flujo-web}

La acción vuelve a leer la sesión y valida antes de escribir.

@sequence id=flujo-web-diagram title="Crear una tarea desde la web"
| actor user | Persona | external |
| actor action | Server Action | backend |
| actor tasks | lib/tasks.ts | backend |
| actor db | Prisma + SQLite/Turso | database |
| user | action | createTaskAction(FormData) |
| action | db | getSession(cookies) → userId |
| db | action | sesión válida | return |
| action | tasks | createTask (valida con Zod) |
| tasks | db | db.task.create(...) |
| db | action | tarea creada | return |
| action | user | ok + revalidatePath | return |

## ¿Cómo completa una tarea un agente? {#flujo-mcp}

El token identifica al usuario; el cuerpo de la petición nunca puede suplantarlo.

@sequence id=flujo-mcp-diagram title="Un agente completa una tarea"
| actor agent | Agente IA | external |
| actor route | Ruta /api/mcp | backend |
| actor bearer | lib/mcp-auth.ts | security |
| actor tools | lib/mcp.ts | backend |
| actor tasks | lib/tasks.ts | backend |
| actor db | Prisma + SQLite/Turso | database |
| agent | route | POST tools/call update_task |
| route | bearer | Authorization: Bearer tmcp_… |
| bearer | db | SHA-256 y busca McpToken |
| db | bearer | válido → userId | return |
| bearer | route | userId (lastUsedAt = now) | return |
| route | tools | handlerForUser(userId) y argumentos |
| tools | tasks | updateTask(id, estado, userId) |
| tasks | db | verifica dueño y actualiza |
| db | tools | tarea completada | return |
| tools | agent | content con text JSON | return |

## ¿Cómo se mantiene un solo estado? {#consistencia}

No hay sincronización explícita: es una consecuencia del diseño. Las dos vías escriben en la misma tabla `Task` a través de `lib/tasks.ts`. No hay stores ni cachés de negocio duplicadas. La UI refresca con `revalidatePath` y `router.refresh()`.

Por eso una tarea creada por el agente aparece en la web del mismo usuario, y al revés. Es la misma fila de la misma tabla. Los tests de `lib/mcp.test.ts` y el E2E `e2e/todo.spec.ts` lo cubren.

## ¿Cómo es el diseño y la accesibilidad? {#diseno}

El tema es oscuro, «turno de noche», sin degradados. El acento neón se reserva a la cifra del día, la acción primaria y el estado completado.

| Token | Color | Uso |
| --- | --- | --- |
| `--color-ground` | `#0a0e1a` | Fondo de página |
| `--color-surface` | `#131a2e` | Superficie |
| `--color-elevated` | `#1a2340` | Tarjetas |
| `--color-ink` | `#eef1ff` | Texto principal |
| `--color-muted` | `#9aa3c0` | Texto secundario |
| `--color-accent` | `#2dffa8` | Neón |
| `--color-destructive` | `#ff7a7a` | Destructivo |

El foco visible es de 2 px. Los campos llevan etiqueta, `aria-invalid` y `aria-describedby`; los errores usan `role="alert"`. El recuento de resultados se anuncia con `aria-live="polite"`. Con `prefers-reduced-motion` se desactivan animaciones y transiciones, y todo el contenido queda visible.

## ¿Cómo se prueba y se despliega? {#entornos}

La regla es estricta: los tests nunca tocan producción. En local usan Turso de prueba o un archivo SQLite; Vercel usa credenciales de producción. El CLI `prisma db push` no acepta `libsql://`, así que el esquema se genera con `prisma migrate diff` y se aplica con `@libsql/client` de forma idempotente.

```bash title="Verificación completa"
npm run lint
npm run typecheck
set -a; source .env
npm test
npm run test:e2e
```

Vitest corre en Node con `fileParallelism: false`, porque los tests comparten la base. Playwright exige Turso, limpia la tabla `Task` antes de arrancar y necesita el puerto 3000 libre. Antes de cerrar una tarea, el repositorio exige las cuatro comprobaciones anteriores.

## ¿Qué garantías de seguridad hay? {#seguridad}

- El `userId` sale siempre de la identidad autenticada: la cookie de sesión o el token Bearer.
- Una tarea solo se lee, edita o borra si pertenece al `userId`; si no, `DomainError("No autorizada")`.
- Los tokens MCP tienen 256 bits de aleatoriedad, hash SHA-256, caducidad de 90 días y revocación inmediata.
- Las redirecciones tras el acceso validan `next` y bloquean destinos externos.
- Los errores internos no se filtran; se devuelve un mensaje genérico y se registran en el servidor.
- Los secretos viven en `.env` (ignorado por git) y en variables de Vercel.

## ¿Cómo verifico que funciona? {#verificacion}

- [ ] `npm run lint` termina sin errores.
- [ ] `npm run typecheck` termina sin errores.
- [ ] `npm test` pasa con las variables `TURSO_*` cargadas.
- [ ] `npm run test:e2e` pasa con el puerto 3000 libre.
- [ ] Un token revocado responde 401 en `/api/mcp`.
- [ ] Un `userId` ajeno en el cuerpo MCP se ignora.
