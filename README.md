# TODO-mcp

> Todo App con arquitectura dual: UI Next.js + servidor MCP sobre el mismo SQLite.

Una app moderna de gestión de tareas donde humanos y agentes de IA operan sobre el mismo estado. El frontend usa Server Actions y el endpoint `/api/[transport]` expone tools MCP, ambos sobre la misma capa Prisma (`lib/tasks.ts`).

## Features

- Lista de tareas con filtros por estado (`TODAS`, `PENDIENTE`, `EN_PROCESO`, `COMPLETADA`) y búsqueda `?q=`.
- Creación, actualización de estado y borrado desde UI con Server Actions.
- Servidor MCP con 5 tools CRUD para agentes externos.
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
| IA | `@modelcontextprotocol/server`, `mcp-handler`, `@vercel/mcp-adapter` |
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
> E2E corre contra Turso-test: `playwright.config.ts` limpia la tabla `Task` y levanta el server con `TURSO_*` del entorno. Lanza con `set -a; source .env; npx playwright test`.

## Deploy a Vercel (Turso prod)

1. En el dashboard de Vercel (Production + Preview) define `TURSO_DATABASE_URL` y `TURSO_AUTH_TOKEN` con la DB de **prod**.
2. Aplica el esquema a prod una vez (desde tu máquina, sin commitear credenciales):
  ```bash
  TURSO_DATABASE_URL="libsql://..." TURSO_AUTH_TOKEN="..." node scripts/apply-schema-turso.mjs
  ```
3. El build ya incluye `prisma generate && next build` precedido del esquema idempotente (`--skip-if-missing`: crea la tabla si falta, no toca nada si existe); no hay paso manual de esquema.

## Usage

### UI

- `/?estado=TODAS` — todas (default)
- `/?estado=PENDIENTE& q=texto` — filtro + búsqueda en título/descripción
- Crear desde `components/task-form.tsx`, cambiar estado / borrar desde `components/task-item.tsx`

### MCP

Endpoint base: `/api` con transporte dinámico (`app/api/[transport]/route.ts`).

Ejemplo con `curl` (Streamable HTTP):

```bash
curl -X POST http://localhost:3000/api/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}'
```

Configuración ejemplo para cliente MCP:

```json
{
  "mcpServers": {
    "todo-mcp": { "url": "http://localhost:3000/api/mcp" }
  }
}
```

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

Límites Zod en `lib/validators.ts`: título 1-100, descripción max 500, `listTasksSchema` con `limit` max 100.

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

## Scripts

```bash
npm run dev       # desarrollo
npm run build     # prisma generate + next build
npm start         # producción
npm test          # Vitest (contra Turso-test: set -a; source .env primero)
npm run test:watch
npx playwright test  # E2E (contra Turso-test, limpia Task antes de arrancar)
npx prisma db push   # sincronizar schema SQLite local
node scripts/apply-schema-turso.mjs  # aplicar esquema a Turso (con TURSO_* en entorno)
node scripts/clean-turso-test.mjs    # vaciar Task en Turso-test
```

## Testing

- `lib/validators.test.ts`, `app/actions.test.ts`, `app/api/[transport]/route.test.ts`, `components/task-item.test.tsx` — sin Turso (local/mocks).
- `lib/tasks.test.ts`, `lib/mcp.test.ts` — integración contra Turso-test con limpieza por `DELETE FROM Task` (helper `lib/test-db.ts`).
- `e2e/todo.spec.ts` — flujo crear/listar/actualizar contra Turso-test.

```bash
set -a; source .env   # expone TURSO_* de TEST (Vitest/Playwright no leen .env solos)
npm test
npx playwright test
```

## Project Structure

```text
app/
  page.tsx              # lista + filtros + form
  actions.ts            # Server Actions
  api/[transport]/route.ts  # servidor MCP
components/
  task-form.tsx task-item.tsx task-filters.tsx day-headline.tsx
lib/
  tasks.ts validators.ts mcp.ts db.ts
  generated/prisma/  # cliente Prisma 7 (generado, no commitear)
prisma.config.ts  # datasource URL para el CLI (Prisma 7)
prisma/schema.prisma
e2e/todo.spec.ts
openspec/ requirement.md AGENTS.md
```

## Troubleshooting

- `DATABASE_URL` no encontrada: copia `.env.example` a `.env`, default `file:../dev.db` en `lib/db.ts:16`.
- DB vacía / schema desactualizado (local): `npx prisma db push`.
- `P1012 the URL must start with file:` al apuntar a Turso: esperado, el CLI no soporta `libsql://`. Usa `node scripts/apply-schema-turso.mjs` con `TURSO_*` en entorno.
- Tests contra Turso fallan con "faltan TURSO_*": Vitest no lee `.env` solo; lanza con `set -a; source .env` antes.
- E2E falla por puerto ocupado: Playwright usa `reuseExistingServer: false`, cierra `npm run dev` en puerto 3000 antes de `npx playwright test`.
