# Cómo funciona TODO-mcp (Todo App con arquitectura dual UI + MCP)

> Documento de referencia técnica. Explica, con detalle y referencias al código,
> cómo está construida y cómo funciona esta aplicación: una Todo App donde una
> persona (interfaz web) y agentes de IA (servidor MCP) operan **sobre la misma
> lista de tareas y la misma base de datos**.

Índice:

1. [Visión general](#1-visión-general)
2. [Stack tecnológico](#2-stack-tecnológico)
3. [Arquitectura general](#3-arquitectura-general)
4. [Modelo de datos](#4-modelo-de-datos)
5. [Capa de persistencia (`lib/db.ts`)](#5-capa-de-persistencia-libdbts)
6. [Capa de negocio única (`lib/tasks.ts`)](#6-capa-de-negocio-única-libtasksts)
7. [Validación y errores](#7-validación-y-errores)
8. [Autenticación de usuarios (Better Auth)](#8-autenticación-de-usuarios-better-auth)
9. [UI de autenticación: modal, header y navbar](#9-ui-de-autenticación-modal-header-y-navbar)
10. [Rutas y protección](#10-rutas-y-protección)
11. [La app de tareas (`/tareas`)](#11-la-app-de-tareas-tareas)
12. [Titular del día, filtros y búsqueda](#12-titular-del-día-filtros-y-búsqueda)
13. [Tokens MCP (`/mcp`)](#13-tokens-mcp-mcp)
14. [El servidor MCP (`/api/[transport]`)](#14-el-servidor-mcp-apitransport)
15. [Consistencia de estado UI ↔ MCP](#15-consistencia-de-estado-ui--mcp)
16. [Landing pública (`/`)](#16-landing-pública-)
17. [Sistema de diseño y accesibilidad](#17-sistema-de-diseño-y-accesibilidad)
18. [Entornos, Turso y despliegue](#18-entornos-turso-y-despliegue)
19. [Testing](#19-testing)
20. [Flujos end-to-end (trazado de datos)](#20-flujos-end-to-end-trazado-de-datos)
21. [Seguridad](#21-seguridad)
22. [Metodología OpenSpec](#22-metodología-openspec)
23. [Mapa de archivos](#23-mapa-de-archivos)

---

## 1. Visión general

La aplicación resuelve un problema concreto: **una única lista de tareas** que se
puede manejar de dos formas intercambiables:

- **Desde la web** (`/tareas`): crear, listar, filtrar, buscar, editar, cambiar
  estado y eliminar, con autenticación por sesión.
- **Desde un agente de IA** (`POST /api/mcp`): las mismas operaciones CRUD
  expuestas como *tools* MCP, autenticadas con un *Bearer token* propio del
  usuario.

El principio rector es el **estado único**: no hay dos bases de datos ni dos
lógicas de negocio. UI y MCP **comparten exactamente**:

- La misma base de datos (SQLite local o Turso en producción).
- La misma capa de negocio `lib/tasks.ts`.
- Los mismos esquemas de validación Zod en `lib/validators.ts`.

`app/actions.ts` (Server Actions) y `lib/mcp.ts` (tools MCP) son **adaptadores
delgados**: traducen su formato de entrada/salida al contrato de `lib/tasks.ts`.
Ver `README.md:31`.

Además, la app introduce **tokens de acceso MCP** por usuario (se generan en
`/mcp`, se muestran una sola vez y se persiste solo su hash SHA-256), una
**landing pública** en `/` y **rutas protegidas** que redirigen a la landing con
el modal de acceso abierto.

---

## 2. Stack tecnológico

| Capa | Tecnología | Dónde |
| --- | --- | --- |
| Framework | Next.js 16 (App Router), React 19 | `app/` |
| Estilos | Tailwind CSS 4, shadcn/ui (Radix), lucide-react | `components/`, `app/globals.css` |
| Persistencia | Prisma 7 + SQLite (dev) / Turso (libSQL) | `lib/db.ts`, `prisma/schema.prisma` |
| Autenticación | Better Auth (email/contraseña + Google OAuth) | `lib/auth.ts` |
| MCP | `mcp-handler` sobre `@modelcontextprotocol/server` | `app/api/[transport]/route.ts` |
| Validación | Zod 4 | `lib/validators.ts` |
| Tests | Vitest 5 (unit/integración), Playwright 1.x (E2E) | `*.test.ts`, `e2e/` |

Declarado en `package.json` y requerido en `requirement.md` §2 y `AGENTS.md` §1.

---

## 3. Arquitectura general

```text
                        ┌──────────────────────────────────────┐
  Navegador  ──────────▶│  Next.js (App Router)                │
  (humano)              │                                      │
                        │  UI  app/(protegido)/tareas/page.tsx │
                        │      components/task-*.tsx           │
                        │         │  Server Actions            │
                        │         ▼  app/actions.ts            │
                        │      lib/tasks.ts  (negocio único)   │
                        │         │                            │
                        │      lib/db.ts → Prisma → SQLite/Turso│
                        │         ▲                            │
                        │      lib/mcp.ts   (tools MCP)        │
                        │         ▲  app/api/[transport]/route │
                        └─────────┼────────────────────────────┘
                                  │  Authorization: Bearer tmcp_…
  Agente IA  ────────▶  POST /api/mcp
```

Puntos clave:

- **`lib/tasks.ts` es la única capa de negocio.** Cualquier mutación (UI o MCP)
  pasa por ella.
- **`lib/db.ts` es la única conexión a datos**, conmutable entre SQLite local y
  Turso.
- **El `userId` siempre sale de la identidad autenticada** (sesión de cookie en
  la UI, token Bearer en MCP), nunca del cuerpo de la petición.

---

## 4. Modelo de datos

Definido en `prisma/schema.prisma`. Contiene las entidades de negocio (`Task`,
`McpToken`) y las tablas de Better Auth (`User`, `Session`, `Account`,
`Verification`).

### 4.1 `Task`

```prisma
enum TaskStatus { PENDIENTE EN_PROCESO COMPLETADA }

model Task {
  id             String     @id @default(cuid())
  titulo         String
  descripcion    String?
  estado         TaskStatus @default(PENDIENTE)
  fechaCreacion  DateTime   @default(now())
  fechaCulminada DateTime?
  userId         String
  user           User       @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([estado, fechaCreacion])
  @@index([userId])
}
```

- `id`: `cuid()` autogenerado.
- `titulo`: obligatorio (validado 1–100).
- `descripcion`: opcional; si no llega, se guarda `null` (nunca se copia el
  título — regla explícita de `requirement.md`/specs).
- `estado`: por defecto `PENDIENTE`.
- `fechaCreacion`: `now()`.
- `fechaCulminada`: se asigna al pasar a `COMPLETADA` y se limpia al salir.
- `userId`: aislamiento por usuario; borrar un `User` borra sus tareas en cascada.
- Índices: `(estado, fechaCreacion)` para listados filtrados ordenados, y
  `(userId)` para el filtro por propietario.

### 4.2 `McpToken`

```prisma
model McpToken {
  id          String   @id @default(cuid())
  token       String   @unique   // hash SHA-256 (nunca el valor en claro)
  tokenPrefix String?            // primeros 8 caracteres, para identificar
  userId      String
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  scopes      String?
  expiresAt   DateTime?          // por defecto +90 días
  lastUsedAt  DateTime?          // último uso autenticado
  createdAt   DateTime @default(now())

  @@index([userId])
}
```

### 4.3 Tablas de Better Auth

- `User`: `email` único, `name`, `image`, `emailVerified`, timestamps.
- `Session`: `token` único, `expiresAt`, `userId`, IP/user-agent. Sesiones en
  base de datos (no JWT).
- `Account`: credenciales de proveedor (contraseña hasheada para email/Google).
- `Verification`: tokens de verificación.

Todas mapean el nombre del modelo a snake_case (`@@map("user")`, etc.).

---

## 5. Capa de persistencia (`lib/db.ts`)

Una única **instancia** de Prisma, creada de forma condicional según el entorno
(`lib/db.ts`):

```ts
function createPrisma(): PrismaClient {
  if (process.env.TURSO_DATABASE_URL) {
    const adapter = new PrismaLibSql({
      url: process.env.TURSO_DATABASE_URL,
      authToken: process.env.TURSO_AUTH_TOKEN,
    });
    return new PrismaClient({ adapter });
  }
  const url = process.env.DATABASE_URL ?? "file:../dev.db";
  return new PrismaClient({ adapter: new PrismaLibSql({ url }) });
}

export const db = globalForPrisma.prisma ?? createPrisma();
```

- **Turso** (`@prisma/adapter-libsql`) cuando existen `TURSO_DATABASE_URL` +
  `TURSO_AUTH_TOKEN`.
- **SQLite en archivo** (`file:../dev.db`) en caso contrario.
- En desarrollo se reutiliza la instancia vía `globalThis` para sobrevivir al
  *hot reload*.
- Prisma 7 **exige un driver adapter**, por eso SQLite también usa
  `PrismaLibSql`.
- `next.config.ts` marca `@prisma/client`, `@prisma/adapter-libsql` y
  `@libsql/client` como `serverExternalPackages` para que no se empaqueten.

`lib/db.ts` exporta también el tipo `DbClient`, que permite **inyectar un
cliente** (útil en tests) en todas las funciones de negocio.

---

## 6. Capa de negocio única (`lib/tasks.ts`)

Es el corazón del sistema. Todas las funciones aceptan un `client: DbClient = db`
opcional para poder testear contra un cliente inyectado.

| Función | Responsabilidad |
| --- | --- |
| `listTasks(input, client)` | Lista filtrada por `userId`, estado y búsqueda; orden `fechaCreacion desc`; paginación. |
| `countPendingTasks(userId, client)` | Cuenta tareas no `COMPLETADA` (cifra del titular). |
| `getTask(id, userId, client)` | Obtiene una tarea; valida existencia y propiedad. |
| `createTask(input, client)` | Crea la tarea con estado por defecto y `fechaCulminada` coherente. |
| `updateTask(id, input, userId, client)` | Actualiza campos parciales; gestiona `fechaCulminada`. |
| `deleteTask(id, userId, client)` | Elimina; valida existencia y propiedad. |

Reglas implementadas aquí:

1. **Aislamiento por usuario.** `listTasks` construye `where: { userId }` y las
   lecturas/escrituras individuales comparan `task.userId !== userId` y lanzan
   `DomainError("No autorizada")` si no coincide (`lib/tasks.ts:67,98,125`).
2. **Ciclo de vida de `fechaCulminada`.** En `createTask` se asigna `new Date()`
   solo si el estado inicial es `COMPLETADA`. En `updateTask`, solo cambia
   cuando llega un `estado`:

   ```ts
   let fechaCulminada = current.fechaCulminada;
   if (data.estado) {
     fechaCulminada = data.estado === "COMPLETADA" ? new Date() : null;
   }
   ```

   Es decir: completar asigna fecha, reabrir (PENDIENTE/EN_PROCESO) la limpia.
3. **Descripción nula explícita.** `createTask` guarda
   `descripcion: data.descripcion ?? null` sin inventar ni duplicar el título.
4. **Errores de negocio.** Falta de autenticación, recurso inexistente y falta
   de autorización se modelan con `DomainError`, cuyo mensaje es seguro para
   mostrar al usuario/agente.

Todas las entradas se validan con Zod **dentro** de estas funciones
(`listTasksSchema.parse`, `createTaskSchema.parse`, etc.), de modo que ni la UI
ni MCP pueden saltarse la validación.

---

## 7. Validación y errores

### 7.1 `lib/validators.ts`

Fuente única de verdad de los límites, con **mensajes en español**:

| Esquema | Reglas |
| --- | --- |
| `TaskStatusEnum` | `PENDIENTE` \| `EN_PROCESO` \| `COMPLETADA` |
| `tituloSchema` | trim, min 1 ("El título es obligatorio"), max 100 ("Máximo 100 caracteres") |
| `descripcionSchema` | trim, max 500, opcional |
| `createTaskSchema` | `{ titulo, descripcion?, estado? }` |
| `updateTaskSchema` | campos parciales; `descripcion` admite `null` |
| `taskIdSchema` | string no vacío |
| `mcpTokenIdSchema` | id de token no vacío |
| `listTasksSchema` | `estado?`, `q?` (max 200), `limit` (1–100, default 50), `offset` (≥0, default 0) |

`limit`/`offset` usan `z.coerce.number()` para aceptar strings de query.

### 7.2 `lib/errors.ts`

`DomainError` es el tipo que separa **errores de negocio** (mensaje mostrable)
de **errores internos** (mensaje genérico, detalle solo en logs).

### 7.3 Traducción de errores a cada interfaz

Ambos adaptadores usan la misma estrategia (Zod → mensaje del esquema;
`DomainError` → su mensaje; otro → genérico + `console.error`):

- **Server Actions** — `err()` en `app/actions.ts:29`. Devuelve
  `{ ok: false, error }`.
- **Tools MCP** — `mcpErrorFrom()` en `lib/mcp.ts:43`. Devuelve
  `{ content:[{type:"text",text:JSON}], isError:true }`.

Mensaje genérico común:
`"No se pudo completar la operación. Inténtalo de nuevo."`

---

## 8. Autenticación de usuarios (Better Auth)

### 8.1 Servidor (`lib/auth.ts`)

```ts
export const auth = betterAuth({
  database: prismaAdapter(db, { provider: "sqlite" }),
  emailAndPassword: { enabled: true, minPasswordLength: 8 },
  socialProviders: { google: { clientId, clientSecret } },
  session: { expiresIn: 60 * 60 * 24 * 7, updateAge: 60 * 60 * 24 },
});
```

- Adaptador Prisma sobre la misma `db` (SQLite dev / Turso prod).
- Email + contraseña (registro abierto), mínimo 8 caracteres.
- Google OAuth.
- **Sesiones en base de datos**, 7 días, renovación cada 1 día.

### 8.2 Rutas (`app/api/auth/[...all]/route.ts`)

Monta el handler universal de Better Auth con `toNextJsHandler(auth)`:
`/api/auth/sign-up`, `/api/auth/sign-in`, `/api/auth/session`,
`/api/auth/sign-out` y callbacks de Google.

### 8.3 Resolución de sesión en el servidor

Ni la UI ni las Server Actions guardan estado de sesión en el cliente. Cada
petición resuelve la sesión desde las **cookies del propio request**:

```ts
const session = await auth.api.getSession({ headers: await headers() });
const userId = session?.user?.id ?? null;
```

Usado en `app/actions.ts:18`, `app/mcp/actions.ts:28`,
`app/(protegido)/layout.tsx:20` y `app/(protegido)/tareas/page.tsx:27`. Se cumple
el requisito «el servidor resuelve la sesión desde las cookies de la solicitud».

### 8.4 Cliente (`lib/auth-client.ts`)

Singleton de `better-auth/react` que expone `useSession()`, `signIn`, `signUp`,
`signOut` para los componentes de cliente. La navbar escucha `useSession()`
para reaccionar sin recarga a los cambios de sesión.

### 8.5 Errores de autenticación (`lib/auth-error.ts`)

Better Auth **no lanza** en errores HTTP: el cliente devuelve `{ data, error }`.
`authErrorToMessage` mapea `error.code` (p. ej. `INVALID_EMAIL_OR_PASSWORD`,
`PASSWORD_TOO_SHORT`, `USER_ALREADY_EXISTS`) a mensajes en español, con
`fallback` por código de estado HTTP (401/403/422/500).

### 8.6 Validación de `next` (`lib/auth-redirect.ts`)

`safeNextPath` solo acepta rutas locales: deben empezar por `/`, no por `//` ni
`/\`, y no contener `\` ni saltos de línea (evita *open redirects*).
`postAuthPath` devuelve esa ruta o `/tareas` por defecto.

---

## 9. UI de autenticación: modal, header y navbar

### 9.1 Modal de cuenta (`components/ui-auth/auth-modal.tsx`)

Un único `Dialog` (shadcn/Radix) con dos pestañas, **Iniciar sesión** y
**Registrarse**, más el botón **Continuar con Google**:

- Estado controlado: el header/landing decide qué pestaña abrir (`tab`).
- Al reabrir se limpian error y campos; al cambiar de pestaña o tras un fallo
  **se conservan** los valores tecleados (requisito de la spec).
- Envío con `signIn.email` / `signUp.email`; si hay `error` se muestra un único
  mensaje (`authErrorToMessage`) y **no** se llama a `onAuthSuccess`.
- Al éxito navega a `postAuthPath(next)` (o hace `router.refresh()` si ya está
  en esa ruta).
- Google usa `signIn.social({ provider:"google", callbackURL: postAuthPath(next) })`.
- Indicadores de carga accesibles (`Spinner`, `aria-busy`, textos "Entrando…").

### 9.2 Navbar compartida (`components/site-header.tsx`)

Vive en el layout raíz, así que aparece en landing y app:

- **Sin sesión**: botones "Iniciar sesión" (outline) y "Registrarse" (primario)
  que abren el modal en la pestaña correcta.
- **Con sesión**: avatar (imagen de Google o iniciales), nombre, enlaces
  "Mis tareas" (`/tareas`, `data-testid="nav-tareas"`) y "Tokens MCP"
  (`/mcp`, `nav-mcp`), y "Cerrar sesión" (`auth-signout-btn`, visible desde
  `sm`).
- **Móvil (<640px)**: la barra muestra el avatar y, a su derecha, el botón
  `nav-menu-btn`. Los enlaces y "Cerrar sesión" (`auth-signout-btn-movil`) se
  despliegan en el panel `#mobile-nav`; el cierre de sesión va al final,
  separado con un borde y a ancho completo. El panel se cierra con Escape
  (devolviendo el foco al botón), con clic fuera del header, o al navegar. Si
  el cierre de sesión falla, el panel permanece abierto y muestra el error
  junto a la acción.
- `data-testid` estables y áreas táctiles de 44px (`h-11 min-w-11`).
- Todos los botones usan el componente `Button` de shadcn.

---

## 10. Rutas y protección

Hay **tres capas** de protección, de la más barata a la autoritativa:

### Capa 1 — Middleware optimista (`proxy.ts`)

Sin tocar la base de datos, comprueba la **presencia de la cookie de sesión**
(`getSessionCookie`). Si no hay cookie, redirige a
`/?auth=login&next=<ruta+query>`. Si la hay, inyecta la cabecera `x-pathname`
en la request para que la capa 2 sepa a dónde volver. `matcher`: `/tareas`,
`/tareas/*`, `/mcp`, `/mcp/*`.

### Capa 2 — Layout protegido (`app/(protegido)/layout.tsx`)

Resuelve la sesión **de verdad contra la DB** (`auth.api.getSession`). Si es
inválida, redirige a la landing con `next` (leído de `x-pathname`). Es el punto
que decide renderizar o no el contenido protegido.

### Capa 3 — Defensa en profundidad en las páginas

- `app/(protegido)/tareas/page.tsx` repite el chequeo y redirige si falta.
- `app/(protegido)/mcp/page.tsx` llama a `listMcpTokensAction()`, que exige
  sesión, y redirige si `!result.ok`.

### Acceso dirigido y retorno

La landing lee `?auth=login|register` y `?next=...` (`app/page.tsx`).
`LandingCta` abre el modal en la pestaña solicitada y pasa `next` validado al
modal; tras autenticarse, el usuario vuelve a la ruta pedida (o `/tareas`).
Rutas:

| Ruta | Acceso | Contenido |
| --- | --- | --- |
| `/` | Pública | Landing + acceso dirigido |
| `/tareas` | Protegida | App de tareas |
| `/mcp` | Protegida | Tokens MCP e instrucciones |
| `/api/auth/*` | Pública | Better Auth |
| `/api/mcp` | Bearer token | Servidor MCP |

---

## 11. La app de tareas (`/tareas`)

`app/(protegido)/tareas/page.tsx` es un **Server Component** que:

1. Lee `searchParams` (`estado`, `q`) y los normaliza.
2. Resuelve `userId` de la sesión.
3. Carga en paralelo (`Promise.all`):
   - `listTasks({ userId, estado, q, limit: 50, offset: 0 })` → filas a mostrar.
   - `countPendingTasks(userId)` → cifra del titular (independiente del filtro).
4. Renderiza: titular, formulario, filtros, listado y footer.

El **layout desktop** usa una rejilla de 2 columnas con `100dvh` y scroll
interno solo en la lista; en móvil se apila como un documento único.

### 11.1 Formulario (`components/task-form.tsx`)

Componente de cliente con `useTransition`:

- Valida en cliente que el título no esté vacío (foco al campo), pero la
  validación autoritativa la hace el servidor.
- Llama a `createTaskAction(formData)` (Server Action).
- En éxito: `form.reset()` + `router.refresh()`.
- En error: muestra el mensaje junto al campo con `role="alert"`,
  `aria-invalid` y `aria-describedby`.
- Botón `create-btn` con `Spinner` + `aria-busy` durante la petición.

### 11.2 Server Actions (`app/actions.ts`)

Tres acciones (`"use server"`), todas resuelven `userId` de las cookies y
validan con Zod antes de llamar a `lib/tasks.ts`:

| Acción | Entrada | Llama |
| --- | --- | --- |
| `createTaskAction` | `FormData` | `createTask` |
| `updateTaskAction` | `id`, `FormData` | `updateTask` |
| `deleteTaskAction` | `id` | `deleteTask` |

Tras cada mutación: `revalidatePath("/tareas")` para invalidar la caché del RSC.
Retornan `ActionResult = { ok:true } | { ok:false; error:string }`.

### 11.3 Tarjeta de tarea (`components/task-item.tsx`)

Cada tarea es una `<li>` (`bg-elevated`, borde sutil, radio) con:

- Indicador de estado (punto neón si `COMPLETADA`), título (`break-words`),
  descripción opcional y estado/fecha a la derecha.
- **Select shadcn** (`status-select`) para cambiar de estado → `updateTaskAction`.
- **Modo edición**: inputs `edit-title` / `edit-desc` y botón `save-btn`.
- **Eliminar**: `delete-btn` abre un `AlertDialog` shadcn con `delete-cancel` /
  `delete-confirm` (nada de `window.confirm`).
- Fecha formateada con `Intl.DateTimeFormat("es", …)`.

### 11.4 Componentes UI base (`components/ui/`)

Primitivas shadcn envueltas: `button.tsx` (con `buttonVariants` de `cva`),
`dialog.tsx`, `alert-dialog.tsx`, `select.tsx`, `toggle-group.tsx`,
`input.tsx`, `input-group.tsx`, `label.tsx`, `field.tsx`, `spinner.tsx`.

`field.tsx` define `FieldGroup`, `Field`, `FieldLabel`, `FieldDescription` y
`FieldError` (este último con `role="alert"` y `aria-live="polite"`), la base de
la accesibilidad de formularios.

`Button` documenta el **mapa de intención** (`components/ui/button.tsx:6`):
primaria `default`, secundaria `secondary`/`outline`, sutil en fila `ghost`,
destructiva `destructive`; tamaños `default`/`sm`/`lg`/`icon`.

---

## 12. Titular del día, filtros y búsqueda

### 12.1 Titular (`components/day-headline.tsx`)

Muestra "Hoy quedan N" con la cifra en **neón** (`text-accent`), o "Todo al día"
si `N=0`. La cifra llega de `countPendingTasks`, que cuenta **todas** las tareas
no completadas del usuario, **con independencia del filtro, la búsqueda o el
máximo de filas del listado**. El `key={pendientes}` + `animate-headline-pulse`
produce un pulso (solo `opacity`/`transform`, ≤300 ms) al cambiar; con
`prefers-reduced-motion` se suprime.

### 12.2 Filtros y búsqueda (`components/task-filters.tsx`)

- **Filtro de estado** con `ToggleGroup` (selección única): `TODAS`,
  `PENDIENTE`, `EN_PROCESO`, `COMPLETADA` (`filter-*`). Escribe `?estado=` en la
  URL.
- **Búsqueda** (`search`) con **debounce ~300 ms** antes de escribir `?q=` en la
  URL.
- **Limpiar** (botón X): borra `q`, vacía el campo y devuelve el foco.
- **Anuncio accesible**: `aria-live="polite"` con "N tareas encontradas"
  (`filter-count`).
- El estado se refleja en la URL (`?estado=…&q=…`), lo que hace la vista
  compartible y navegable con atrás/adelante. El input se sincroniza cuando la
  URL cambia por fuera (durante el render, no con efecto).

---

## 13. Tokens MCP (`/mcp`)

### 13.1 Ciclo de vida (`lib/mcp-tokens.ts`)

| Constante | Valor |
| --- | --- |
| `MCP_TOKEN_PREFIX` | `"tmcp_"` |
| `MCP_TOKEN_DEFAULT_EXPIRY_DAYS` | `90` |
| `MCP_TOKEN_PREFIX_LENGTH` | `8` |

- `createMcpToken(userId)`: genera `tmcp_` + `randomBytes(32).toString("base64url")`
  (**256 bits** de aleatoriedad), calcula `expiresAt` a 90 días, persiste
  **solo** el hash SHA-256 y el prefijo visible, y devuelve `{ token, record }`.
  El valor en claro **solo existe en memoria** y se devuelve una única vez.
- `hashMcpToken(token)`: SHA-256 hex (mismo esquema que `lib/mcp-auth.ts`).
- `listMcpTokens(userId)`: solo los del usuario, orden `createdAt desc`.
- `revokeMcpToken(id, userId)`: borra la fila; si no existe o es de otro usuario,
  lanza el **mismo** error ("No se pudo revocar el token") para no filtrar
  información.
- `toMcpTokenView(record)`: vista serializable **sin hash**, con fechas ISO.

### 13.2 Server Actions (`app/mcp/actions.ts`)

`listMcpTokensAction`, `generateMcpTokenAction`, `revokeMcpTokenAction`: exigen
sesión, operan sobre el usuario autenticado y devuelven `McpTokenView[]` (y, al
generar, el token en claro una sola vez). `revalidatePath("/mcp")` tras mutar.

### 13.3 UI (`components/mcp/mcp-tokens.tsx`)

- Botón "Generar token" → `Dialog` de confirmación → muestra el **token
  completo una única vez** (`mcp-created-token`) con aviso
  (`mcp-created-warning`) y botón copiar.
- Al cerrar el diálogo, `createdToken` se pone a `null`: el valor desaparece y
  solo queda el prefijo.
- Lista con prefijo (`tmcp_ab12…`), creado, último uso y expiración; marca
  "Expirado" si procede.
- "Revocar" abre un `AlertDialog` de confirmación (`mcp-revoke-confirm`).

`components/mcp/connection-guide.tsx` muestra las instrucciones: endpoint
`<origin>/api/mcp`, formato `Authorization: Bearer <token>` y un bloque de
configuración copiable. `useOrigin()` resuelve el origen en el navegador sin
avisos de hidratación. `CopyButton` usa `lib/clipboard.ts` (Clipboard API con
fallback a `textarea` + `execCommand`).

---

## 14. El servidor MCP (`/api/[transport]`)

### 14.1 Autenticación Bearer (`lib/mcp-auth.ts`)

`authenticateMcpBearer(request)`:

1. Lee `Authorization: Bearer <token>` (si falta o no empieza por `Bearer `,
   `null`).
2. Calcula el SHA-256 y busca `McpToken` por ese hash.
3. Si no existe o `expiresAt < now`, `null`.
4. Si es válido, actualiza `lastUsedAt = now` y devuelve `userId`.

### 14.2 Ruta (`app/api/[transport]/route.ts`)

- Exporta `GET`, `POST` y `DELETE` = `authenticatedHandler`.
- Si no hay `userId`, responde **401** con error JSON-RPC
  (`code -32001`) y no ejecuta ninguna tool.
- Si hay `userId`, construye **por petición** un handler MCP ligado a ese
  usuario: `handlerForUser(userId)` crea el `createMcpHandler` y registra las 5
  tools, cada una pasando `{ ...params, userId }` a `lib/mcp.ts`.
- El `inputSchema` publicado en `tools/list` describe **tipos** y deja los
  límites en la `description`; la validación real (con mensajes en español) la
  hace `lib/validators.ts` dentro de `lib/mcp.ts`.

**Por qué el `userId` no puede venir del cliente:** el SDK valida los
`arguments` contra el `inputSchema` y **descarta** las claves no declaradas
(por eso `userId` no se declara). Además, `handlerForUser(userId)` fija el
`userId` del token al construir las closures. Hay un test que inyecta el
`userId` de otro usuario en los `arguments` y verifica que se ignora
(`app/api/[transport]/route.test.ts:135`).

### 14.3 Las tools (`lib/mcp.ts`)

| Tool | Esquema de entrada | Salida |
| --- | --- | --- |
| `list_tasks` | `estado?`, `q?`, `limit?(1-100,def 50)`, `offset?` | JSON de tareas |
| `get_task` | `id` | JSON de la tarea |
| `create_task` | `titulo(1-100)`, `descripcion?(max 500)`, `estado?` | JSON de la tarea |
| `update_task` | `id`, `titulo?`, `descripcion?`, `estado?` | JSON de la tarea |
| `delete_task` | `id` | `{ deleted:true, id }` |

Cada handler: `requireUserId` → parse Zod → llama a `lib/tasks.ts` → `mcpText`
o `mcpErrorFrom`. Formato de respuesta:
`{ content: [{ type: "text", text: JSON.stringify(payload) }] }`; errores con
`isError: true`.

### 14.4 Transporte

`mcp-handler` sobre Streamable HTTP. El endpoint base es `/api` con transporte
dinámico (`[transport]`); la URL para clientes es `/api/mcp`. Ejemplo `curl` en
`README.md:98`.

---

## 15. Consistencia de estado UI ↔ MCP

Es una consecuencia directa del diseño, no una sincronización explícita:

- Ambas vías escriben en **la misma tabla** `Task` a través de `lib/tasks.ts`.
- No hay *stores* duplicados ni cachés de negocio.
- La UI refresca con `revalidatePath` (Server Actions) y `router.refresh()`.
- Como el agente y la web comparten la DB, una tarea creada por MCP aparece en la
  web del mismo usuario y viceversa.

Esto se cubre en tests (`lib/tasks.test.ts`, `lib/mcp.test.ts`,
`app/api/[transport]/route.test.ts`) y en el E2E (`e2e/todo.spec.ts`).

---

## 16. Landing pública (`/`)

`app/page.tsx` renderiza la presentación para visitantes anónimos **sin mostrar
datos de ningún usuario**:

- `LandingHero` (`components/landing/landing-hero.tsx`): promesa del producto,
  vista compacta de la lista, CTA y anclas a secciones.
- `DemoBoard` (`components/landing/demo-board.tsx`): **demo 100% local**. Añade
  filas, las abre y las marca/completa solo en estado de React; **cero llamadas
  al servidor, cero persistencia**. Con JS deshabilitado se ven las filas de
  ejemplo (`<noscript>` con `demo-noscript`).
- `McpSetup` (`landing-sections.tsx`): pasos numerados (cuenta → token →
  cliente) sin duraciones inventadas + `McpConfigFragment` copiable.
- `Tools`: tabla de las 5 tools con sus parámetros.
- `LandingClose` + `LandingFooter`: cierre con CTA y mapa del sitio.

`LandingCta` decide según la sesión: "Ir a mis tareas" (`/tareas`) si hay
sesión, o "Crear cuenta" (primario) + "Iniciar sesión" si no. Interpreta
`?auth=` y `?next=`.

`Reveal` (`components/landing/reveal.tsx`) implementa la entrada escalonada con
`IntersectionObserver` y clases `data-reveal`; el *flag* `data-motion` lo pone un
script inline en `app/layout.tsx` y caduca a los 1,2 s si el módulo no hidrata,
de modo que sin JS **todo el contenido queda visible**.

---

## 17. Sistema de diseño y accesibilidad

### 17.1 Tema (tokens en `app/globals.css`)

Tema oscuro "turno de noche", sin degradados:

| Token | Color | Uso |
| --- | --- | --- |
| `--color-ground` | `#0a0e1a` | Fondo de página |
| `--color-surface` | `#131a2e` | Superficie |
| `--color-elevated` | `#1a2340` | Superficie elevada (cards) |
| `--color-ink` | `#eef1ff` | Texto principal |
| `--color-muted` | `#9aa3c0` | Texto secundario |
| `--color-accent` | `#2dffa8` | Neón (acento único) |
| `--color-destructive` | `#ff7a7a` | Destructivo |
| `--color-on-accent` | `#06130c` | Texto sobre el neón |

**Acento único**: el neón se reserva a la cifra del día, la acción primaria y el
estado `COMPLETADA`, nunca a filtros ni textos secundarios.

Tipografía: **Albert Sans** (`next/font/google`), cuerpo 17–19px en tinta plena.

### 17.2 Accesibilidad

- Foco visible de 2px (`:focus-visible { outline: 2px solid var(--color-accent) }`
  y `focus-visible:ring-2` en los componentes).
- Formularios con `FieldLabel` visible, `aria-describedby`, `aria-invalid` y
  `FieldError` con `role="alert"`.
- Diálogos/selects gestionan foco, cierre con Escape y navegación por teclado
  (shadcn/Radix). Prohibido `window.alert/confirm/prompt`.
- `aria-live="polite"` para el recuento de resultados.
- Contraste AA en texto principal y secundario sobre las superficies oscuras.
- Áreas táctiles ≥44px en móvil.

### 17.3 Movimiento

- Animaciones limitadas a `transform`/`opacity`.
- `prefers-reduced-motion: reduce` desactiva animaciones/transiciones y deja
  todo visible (`app/globals.css:200`).
- Entradas escalonadas (`Reveal`) y transiciones de diálogo/select con
  `ease-out` ≤300 ms.

---

## 18. Entornos, Turso y despliegue

### 18.1 Selección de entorno

| Entorno | Base de datos | Credenciales |
| --- | --- | --- |
| Local dev / Vitest / Playwright | Turso **test** o SQLite archivo | `.env` local (`TURSO_*` de test) |
| Vercel Production/Preview | Turso **prod** | Variables del dashboard |

Regla estricta: **los tests nunca tocan prod**; Vercel usa solo credenciales de
prod (`openspec/specs/turso-environments/spec.md`).

### 18.2 Esquema en Turso (`scripts/apply-schema-turso.mjs`)

El CLI `prisma db push` no acepta `libsql://` (error P1012), así que el DDL se
genera con `prisma migrate diff --script` y se aplica con `@libsql/client`:

- Convierte `CREATE TABLE` / `CREATE [UNIQUE] INDEX` a `IF NOT EXISTS`
  (idempotente).
- Añade columnas aditivas post-esquema (p. ej. `mcp_token.tokenPrefix`) con
  `ALTER TABLE` idempotente.
- Detecta tablas desalineadas y, por defecto, **falla** anunciándolas (no borra
  datos); con `--recreate-outdated` las recrea.
- En el build se usa con `--skip-if-missing`: sin `TURSO_*` avisa y sale 0 sin
  romper builds locales.

El script de `build` en `package.json` es:
`node scripts/apply-schema-turso.mjs --skip-if-missing && prisma generate && next build`.

### 18.3 Limpieza de tests (`scripts/clean-turso-test.mjs`)

Antes del E2E, `DELETE FROM Task` (limpieza por tablas, **sin** borrar ni
recrear la DB), con reintentos por la latencia en ráfagas de Turso. Este script
bloquea el arranque del `webServer` de Playwright, por eso reintenta.

### 18.4 Secretos

`.env` local (gitignored) y variables de Vercel; **nunca** commiteados.
`.env.example` solo documenta nombres con placeholders.

---

## 19. Testing

### 19.1 Unitarios / integración (Vitest)

`vitest.config.ts`: entorno `node`, `fileParallelism: false` (comparten la DB de
test), timeouts de 30 s, alias `@` → raíz.

- **Sin DB** (mocks/funciones puras): `app/actions.test.ts`,
  `app/mcp/actions.test.ts`, `lib/validators.test.ts`, `lib/auth-error.test.ts`,
  `lib/auth-redirect.test.ts`, `components/task-item.test.tsx`,
  `components/ui/button.test.tsx`.
- **Integración contra Turso-test** (`lib/test-db.ts`): `lib/tasks.test.ts`,
  `lib/mcp.test.ts`, `lib/mcp-tokens.test.ts` y
  `app/api/[transport]/route.test.ts` (esta última ejercicio real de la ruta:
  `tools/list`, `tools/call`, suplantación de `userId`, error interno que no
  filtra detalle, validación en español, tokens generados/revocados/expirados).

`lib/test-db.ts` exige `TURSO_*` (falla rápido para no testear contra otra DB) y
`cleanTasks()` borra en orden respetando claves foráneas.

### 19.2 E2E (Playwright)

`playwright.config.ts`: exige `TURSO_*`; `webServer` ejecuta
`clean-turso-test.mjs && npm run dev -- --port 3000`, con
`reuseExistingServer: false` (el puerto 3000 debe estar libre).

Specs (`e2e/`): `landing`, `todo`, `todo-auth`, `proteccion`, `mcp-tokens`,
`titular`, `nav-movil`. Conservan los `data-testid` de la UI.

### 19.3 Verificación completa (`AGENTS.md` §4)

```bash
npm run lint
npm run typecheck
set -a; source .env   # Vitest no lee .env solo
npm test
npm run test:e2e      # carga .env por sí solo; puerto 3000 libre
```

---

## 20. Flujos end-to-end (trazado de datos)

### Flujo A — Crear una tarea desde la web

```text
Usuario escribe título → TaskForm
  → createTaskAction(formData)             [app/actions.ts]
    → auth.api.getSession(cookies) → userId
    → createTaskSchema.parse              [lib/validators.ts]
    → createTask({ titulo, userId })      [lib/tasks.ts]
      → db.task.create(...)               [lib/db.ts → Prisma → DB]
    → revalidatePath("/tareas")
  → router.refresh() → RSC vuelve a renderizar el listado
```

### Flujo B — Un agente completa una tarea

```text
Agente → POST /api/mcp  { Authorization: Bearer tmcp_…, tools/call update_task }
  → authenticateMcpBearer(request)        [lib/mcp-auth.ts]
      → SHA-256(token) → McpToken por hash → valida expiresAt
      → actualiza lastUsedAt → userId
  → handlerForUser(userId) → closure con userId fijo
    → inputSchema valida/descarta arguments (userId del cuerpo ignorado)
    → mcpUpdateTask({ ...params, userId }) [lib/mcp.ts]
      → updateTaskSchema.parse             [lib/validators.ts]
      → updateTask(id, {estado}, userId)   [lib/tasks.ts]
          → verifica task.userId === userId
          → estado COMPLETADA ⇒ fechaCulminada = now
      → mcpText(task)  → { content:[{type:"text",text:JSON}] }
```

Al recargar, la web del mismo usuario muestra la tarea como completada. **La
misma fila** de la misma tabla.

### Flujo C — Deep link a ruta protegida sin sesión

```text
GET /tareas (sin cookie)
  → proxy.ts: sin cookie → 302 → /?auth=login&next=/tareas
  → landing abre modal en "login", next="/tareas" validado
  → usuario se autentica → postAuthPath("/tareas") → /tareas
```

### Flujo D — Generar y usar un token MCP

```text
/mcp → "Generar token" → generateMcpTokenAction()
  → createMcpToken(userId): 32 bytes random, prefijo tmcp_
      → persiste hash SHA-256 + tokenPrefix + expiresAt(+90d)
      → devuelve token en claro UNA vez
  → UI lo muestra y permite copiarlo; al cerrar, se pierde
Agente usa el token → /api/mcp → resuelve al userId propietario
/mcp → "Revocar" → borra la fila → el token responde 401 de inmediato
```

---

## 21. Seguridad

- **Aislamiento por usuario**: `userId` siempre desde la identidad autenticada
  (cookie de sesión o token Bearer). En MCP, cualquier `userId` del cuerpo se
  descarta (test explícito).
- **Autorización por recurso**: `get/update/delete` verifican que la tarea
  pertenece al `userId`; si no, `DomainError("No autorizada")`.
- **Tokens MCP**: 256 bits de aleatoriedad, prefijo `tmcp_`, persistidos como
  hash SHA-256, expiración 90 días, revocación inmediata, `lastUsedAt`. Sin
  valor en claro recuperable ni tokens de otros usuarios.
- **Open redirect prevenido**: `safeNextPath`/`postAuthPath`.
- **Errores internos no se filtran**: `DomainError`/`ZodError` sí; cualquier otro
  error devuelve mensaje genérico y se registra solo en el servidor.
- **Secretos fuera del repo**: `.env` gitignored; `.env.example` con
  placeholders.
- **Sin `window.alert/confirm/prompt`**: todos los diálogos pasan por shadcn.

---

## 22. Metodología OpenSpec

El repositorio usa el flujo **spec-driven** de OpenSpec (`openspec/`):

- `openspec/specs/<capacidad>/spec.md`: especificación vigente con requisitos
  (`SHALL`) y escenarios (`WHEN/THEN`). Capacidades actuales:
  `landing-page`, `mcp-tasks`, `mcp-tokens`, `todo-tasks`, `turso-environments`,
  `user-auth`, `user-auth-ui`.
- `openspec/changes/archive/<fecha>-<cambio>/`: cambios archivados con
  `proposal.md`, `design.md`, `tasks.md` y deltas en `specs/`.
- `openspec/config.yaml`: `schema: spec-driven`.

`AGENTS.md` obliga a: consultar/actualizar `requirement.md`, definir la spec del
cambio, mantener `tasks.md` atómico y validar con
`openspec validate <cambio> --strict` antes de cerrar.

Las specs son **contratos verificables**: por ejemplo, `mcp-tasks` exige que el
`userId` salga del token (`spec.md:10`), `todo-tasks` exige el titular
independiente del filtro (`spec.md:116`), y `mcp-tokens` exige visualización
única y hash SHA-256 (`spec.md:9`). El código implementa exactamente esos
contratos y los tests los comprueban.

---

## 23. Mapa de archivos

```text
app/
  layout.tsx                      # layout raíz: fuente, navbar, script de motion
  page.tsx                        # landing pública (lee ?auth y ?next)
  globals.css                     # tema oscuro, tokens, animaciones, accesibilidad
  actions.ts                      # Server Actions de tareas (create/update/delete)
  mcp/actions.ts                  # Server Actions de tokens MCP
  api/auth/[...all]/route.ts      # handler Better Auth
  api/[transport]/route.ts        # servidor MCP (Bearer → handler por usuario)
  (protegido)/
    layout.tsx                    # capa 2 de protección (sesión real)
    tareas/page.tsx               # app de tareas
    mcp/page.tsx                  # página de tokens MCP
components/
  site-header.tsx                 # navbar compartida (sesión, modal, nav móvil)
  task-form.tsx                   # formulario de creación
  task-item.tsx                   # tarjeta: editar / estado / eliminar
  task-filters.tsx                # filtro de estado + búsqueda con debounce
  day-headline.tsx                # titular del día con cifra neón
  ui/                             # primitivas shadcn (button, dialog, select, field…)
  ui-auth/auth-modal.tsx          # modal login/registro + Google
  mcp/                            # mcp-tokens, connection-guide, copy-button
  landing/                        # hero, demo-board, sections, mcp-config, reveal, cta, close
lib/
  db.ts                           # conexión única Prisma (Turso/SQLite)
  tasks.ts                        # capa de negocio única
  validators.ts                   # esquemas Zod (mensajes en español)
  errors.ts                       # DomainError
  mcp.ts                          # tools MCP (adaptador a lib/tasks.ts)
  mcp-auth.ts                     # autenticación Bearer → userId
  mcp-tokens.ts                   # ciclo de vida de tokens (hash, prefijo, expiración)
  auth.ts                         # configuración Better Auth
  auth-client.ts                  # cliente Better Auth (useSession, signIn…)
  auth-error.ts                   # mapeo de errores de auth a español
  auth-redirect.ts                # validación de `next` (anti open-redirect)
  clipboard.ts / use-origin.ts    # utilidades de cliente
  test-db.ts                      # cliente Prisma de test + limpieza
  generated/prisma/               # cliente Prisma generado (no commitear)
prisma/schema.prisma              # modelo de datos
proxy.ts                          # capa 1 de protección (middleware optimista)
scripts/
  apply-schema-turso.mjs          # esquema idempotente en Turso
  clean-turso-test.mjs            # limpieza por tablas para E2E
e2e/                              # specs Playwright
openspec/                         # specs + cambios (spec-driven)
requirement.md / AGENTS.md        # requisitos y directrices operativas
```

---

### Resumen en una frase

**Una sola lista de tareas, una sola capa de negocio y una sola base de datos,
con dos puertas de entrada —la web autenticada por sesión y el agente
autenticado por token Bearer— que comparten validación, aislamiento por usuario
y consistencia de estado.**
