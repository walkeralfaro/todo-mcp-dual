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
| Framework | Next.js 15 App Router, React 19 |
| Estilos | Tailwind CSS 4, shadcn/ui, lucide-react |
| Persistencia | Prisma 6 + SQLite (`file:../dev.db`), adapter libSQL/Turso para prod |
| IA | `@modelcontextprotocol/sdk`, `mcp-handler`, `@vercel/mcp-adapter` |
| Validación | Zod 3 |
| Tests | Vitest 2, Playwright 1.49 |

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
# Producción con Turso:
# TURSO_DATABASE_URL="libsql://..."
# TURSO_AUTH_TOKEN="..."
```

> [!TIP]
> E2E usa su propia DB: `playwright.config.ts` arranca con `DATABASE_URL="file:../e2e.db"` y hace `prisma db push` antes de levantar el server.

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
npm test          # Vitest unitario/integración
npm run test:watch
npx playwright test  # E2E (usa e2e.db)
npx prisma db push   # sincronizar schema SQLite
```

## Testing

- `lib/validators.test.ts`, `lib/tasks.test.ts`, `lib/mcp.test.ts`, `app/actions.test.ts` — Vitest con SQLite.
- `e2e/todo.spec.ts`, `components/task-item.test.tsx` — flujo crear/listar/actualizar.
- `app/api/[transport]/route.test.ts` — handler MCP.

```bash
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
prisma/schema.prisma
e2e/todo.spec.ts
openspec/ requirement.md AGENTS.md
```

## Troubleshooting

- `DATABASE_URL` no encontrada: copia `.env.example` a `.env`, default `file:../dev.db` en `lib/db.ts:16`.
- DB vacía / schema desactualizado: `npx prisma db push`.
- E2E falla por puerto ocupado: Playwright usa `reuseExistingServer: false`, cierra `npm run dev` en puerto 3000 antes de `npx playwright test`.
