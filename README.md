# TODO-mcp

> Todo App con arquitectura dual: UI Next.js + servidor MCP sobre el mismo SQLite.

Una app moderna de gestión de tareas donde humanos y agentes de IA operan sobre el mismo estado. El frontend usa Server Actions y el endpoint `/api/[transport]` expone tools MCP, ambos sobre la misma capa Prisma (`lib/tasks.ts`).

## Features

- Lista de tareas con filtros por estado (`TODAS`, `PENDIENTE`, `EN_PROCESO`, `COMPLETADA`) y búsqueda `?q=`.
- Landing pública en `/`; la app de tareas vive en `/tareas` y los tokens MCP en `/mcp` (ambas protegidas por sesión).
- Creación, actualización de estado y borrado desde UI con Server Actions.
- Servidor MCP con 5 tools CRUD para agentes externos.
- Tokens de acceso MCP por usuario: se generan en `/mcp`, el valor se muestra una sola vez, se persiste solo su hash SHA-256, expiran a los 90 días y se revocan de inmediato.
- Estado único: sin duplicar lógica de negocio, UI y MCP comparten `lib/tasks.ts` + SQLite.
- Validación estricta con Zod en Server Actions y tools MCP.
- `fechaCulminada` automática al pasar a `COMPLETADA`, se limpia al salir de ese estado.

## Architecture

```text
UI (app/page.tsx + components/)
  -> Server Actions (app/actions.ts)
    -> lib/tasks.ts -> Prisma -> SQLite (dev.db)

AI Agent -> /api/[transport] (mcp-handler)
  -> lib/mcp.ts
    -> lib/tasks.ts -> Prisma -> SQLite (dev.db)
```

> [!NOTE]
> `lib/tasks.ts` es la única capa de negocio. `app/actions.ts` y `lib/mcp.ts` son adaptadores delgados con validación Zod y formato de respuesta propio.

## Tech Stack

| Capa | Tecnología |
| --- | --- |
| Framework | Next.js 16 App Router, React 19 |
| Estilos | Tailwind CSS 4, shadcn/ui, lucide-react |
| Persistencia | Prisma 7 + SQLite (`file:../dev.db`), adapter libSQL/Turso para prod |
| IA | `mcp-handler` sobre `@modelcontextprotocol/server` |
| Validación | Zod 4 |
| Tests | Vitest 5, Playwright 1.64 |

## Getting Started

Prerequisites:

- Node.js 22+
- npm

```bash
npm install
cp .env.example .env
npx prisma db push
npm run dev
```

Abre `http://localhost:3000`.

Variables de entorno (`.env.example`):

```bash
DATABASE_URL="file:../dev.db"
# Turso (ver lib/db.ts: si existe TURSO_DATABASE_URL se usa Turso).
# Local = credenciales de TEST; Vercel = credenciales de PROD. Los tests NUNCA tocan prod.
# TURSO_DATABASE_URL="libsql://..."
# TURSO_AUTH_TOKEN="..."
```

> [!TIP]
> E2E corre contra Turso-test: `playwright.config.ts` exige `TURSO_*` en el entorno, limpia las tablas y levanta el server. `npm run test:e2e` carga `.env` por sí solo (`node --env-file=.env`); solo necesitas parar cualquier `npm run dev` previo en el puerto 3000.

## Deploy a Vercel (Turso prod)

1. En el dashboard de Vercel (Production + Preview) define `TURSO_DATABASE_URL` y `TURSO_AUTH_TOKEN` con la DB de **prod**.
2. Aplica el esquema a prod una vez (desde tu máquina, sin commitear credenciales):
  ```bash
  TURSO_DATABASE_URL="libsql://..." TURSO_AUTH_TOKEN="..." node scripts/apply-schema-turso.mjs
  ```
3. El build ya incluye `prisma generate && next build` precedido del esquema idempotente (`--skip-if-missing`: crea la tabla si falta, no toca nada si existe); no hay paso manual de esquema.

## Usage

### UI

- `/` — landing pública (presentación y acceso con sesión).
- `/tareas` — app de tareas (protegida): lista + filtros + formulario.
- `/mcp` — tokens MCP (protegida): generar, copiar una vez y revocar.
- `/tareas?estado=PENDIENTE&q=texto` — filtro + búsqueda en título/descripción.
- Crear desde `components/task-form.tsx`, cambiar estado / borrar desde `components/task-item.tsx`

### MCP

Endpoint base: `/api` con transporte dinámico (`app/api/[transport]/route.ts`). Todas las peticiones exigen un token de acceso: se genera en `/mcp` con la sesión iniciada, se muestra una sola vez y se envía como `Authorization: Bearer <token>`.

Ejemplo con `curl` (Streamable HTTP):

```bash
# MCP_TOKEN=tmcp_... (generado en http://localhost:3000/mcp)
curl -X POST http://localhost:3000/api/mcp \
  -H "Authorization: Bearer $MCP_TOKEN" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}'
```

Configuración ejemplo para cliente MCP:

```json
{
  "mcpServers": {
    "todo-mcp": {
      "url": "http://localhost:3000/api/mcp",
      "headers": { "Authorization": "Bearer tmcp_..." }
    }
  }
}
```

Los tokens se persisten como hash SHA-256 (`McpToken.token`) con prefijo visible (`tokenPrefix`) y `expiresAt` a 90 días. Revocar en `/mcp` borra la fila: las peticiones con ese token pasan a responder 401 de inmediato.

## MCP Tools

Definidas en `lib/mcp.ts` y registradas en `app/api/[transport]/route.ts`:

| Tool | Descripción | Input |
| --- | --- | --- |
| `list_tasks` | Lista con filtro, búsqueda y paginación | `estado?`, `q?`, `limit?` (1-100, default 50), `offset?` |
| `get_task` | Obtiene una por id | `id` |
| `create_task` | Crea una tarea | `titulo` (1-100), `descripcion?` (max 500), `estado?` |
| `update_task` | Actualiza título/descripción/estado | `id`, `titulo?`, `descripcion?`, `estado?` |
| `delete_task` | Elimina | `id` |

Respuestas en formato MCP:

```ts
{ content: [{ type: 'text', text: '...' }] }
```

Errores: `{ content: [{ type: 'text', text: '{"error":"..."}' }], isError: true }`.

Límites Zod en `lib/validators.ts`: título 1-100, descripción max 500, `listTasksSchema` con `limit` max 100. Los esquemas publicados en `tools/list` describen el tipo de cada campo y sus límites en la descripción; la validación (y sus mensajes en español) se aplica en `lib/validators.ts`, así que el error que recibe el agente es controlado y en español.

## Data Model

`prisma/schema.prisma`:

```prisma
enum TaskStatus {
  PENDIENTE
  EN_PROCESO
  COMPLETADA
}

model Task {
  id             String     @id @default(cuid())
  titulo         String
  descripcion    String?
  estado         TaskStatus @default(PENDIENTE)
  fechaCreacion  DateTime   @default(now())
  fechaCulminada DateTime?
  @@index([estado, fechaCreacion])
}
```

Además, `McpToken` guarda los accesos MCP (hash SHA-256 + prefijo visible, `expiresAt` y `lastUsedAt`), y las tablas de Better Auth (`User`, `Session`, `Account`, `Verification`).

## Scripts

```bash
npm run dev       # desarrollo
npm run build     # esquema Turso idempotente + prisma generate + next build
npm start         # producción
npm run lint      # ESLint 9 con eslint-config-next (config plana) — no necesita entorno
npm run typecheck # tsc --noEmit — no necesita entorno
npm test          # Vitest (contra Turso-test: set -a; source .env primero)
npm run test:watch
npm run test:e2e  # E2E Playwright (carga .env por sí solo; limpia tablas antes de arrancar)
npm run db:push      # sincronizar schema SQLite local
npm run db:migrate   # prisma migrate deploy
node scripts/apply-schema-turso.mjs  # aplicar esquema a Turso (con TURSO_* en entorno)
node scripts/clean-turso-test.mjs    # vaciar tablas de Turso-test
```

## Testing

Comandos y entorno que necesita cada uno:

| Comando | Entorno | Qué cubre |
| --- | --- | --- |
| `npm run lint` | — | ESLint (Next 16 + TypeScript) |
| `npm run typecheck` | — | `tsc --noEmit` |
| `npm test` | `TURSO_*` exportados | Vitest completo (unitarios + integración) |
| `npm run test:e2e` | `.env` (lo carga el propio script) | Playwright E2E |

- Sin Turso (mocks o funciones puras): `app/actions.test.ts`, `app/mcp/actions.test.ts`, `lib/validators.test.ts`, `lib/auth-error.test.ts`, `lib/auth-redirect.test.ts`, `components/task-item.test.tsx`, `components/ui/button.test.tsx`.
- Integración contra Turso-test (helper `lib/test-db.ts`, limpieza por tablas): `lib/tasks.test.ts`, `lib/mcp.test.ts`, `lib/mcp-tokens.test.ts`, `app/api/[transport]/route.test.ts` (esta última cubre `tools/list`, `tools/call` y los errores de validación por la ruta real).
- E2E (`e2e/`): `landing.spec.ts`, `todo.spec.ts`, `todo-auth.spec.ts`, `proteccion.spec.ts`, `mcp-tokens.spec.ts`, `titular.spec.ts`, `nav-movil.spec.ts` — contra Turso-test; `playwright.config.ts` limpia las tablas y levanta el server antes de arrancar.

```bash
npm run lint
npm run typecheck

set -a; source .env   # expone TURSO_* de TEST (Vitest no lee .env solo)
npm test

npm run test:e2e      # carga .env por sí solo y limpia Task antes de arrancar
```

## Project Structure

```text
app/
  layout.tsx            # header compartido (sesión)
  page.tsx              # landing pública
  (protegido)/tareas/page.tsx  # lista + filtros + form
  (protegido)/mcp/page.tsx     # tokens MCP
  actions.ts            # Server Actions de tareas
  mcp/actions.ts        # Server Actions de tokens MCP
  api/[transport]/route.ts  # servidor MCP (auth Bearer + tools ligadas al usuario)
components/
  site-header.tsx task-form.tsx task-item.tsx task-filters.tsx day-headline.tsx
  landing/ mcp/ ui/ ui-auth/  # landing, tokens MCP y primitivas
lib/
  tasks.ts mcp-tokens.ts mcp-auth.ts validators.ts mcp.ts db.ts
  errors.ts use-origin.ts     # error de dominio y origen del cliente
  generated/prisma/  # cliente Prisma 7 (generado, no commitear)
eslint.config.mjs postcss.config.mjs vitest.config.ts playwright.config.ts
prisma.config.ts  # datasource URL para el CLI (Prisma 7)
prisma/schema.prisma
e2e/  # landing, todo, todo-auth, proteccion, mcp-tokens, titular, nav-movil
openspec/ requirement.md AGENTS.md
```

## Troubleshooting

- `DATABASE_URL` no encontrada: copia `.env.example` a `.env`, default `file:../dev.db` en `lib/db.ts:16`.
- DB vacía / schema desactualizado (local): `npx prisma db push`.
- `P1012 the URL must start with file:` al apuntar a Turso: esperado, el CLI no soporta `libsql://`. Usa `node scripts/apply-schema-turso.mjs` con `TURSO_*` en entorno.
- Tests contra Turso fallan con "faltan TURSO_*": Vitest no lee `.env` solo; lanza `set -a; source .env` antes de `npm test`. `npm run test:e2e` sí lo carga por su cuenta.
- Timeout de conexión contra Turso (`ConnectTimeoutError` / `fetch failed`): fallo de red del entorno hacia `*.turso.io`, no del test. Reintenta el comando; el resto de la suite sigue en verde.
- E2E falla por puerto ocupado: Playwright usa `reuseExistingServer: false`, cierra `npm run dev` en puerto 3000 antes de `npm run test:e2e`.
