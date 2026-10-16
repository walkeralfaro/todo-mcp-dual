# Design: Todo App Dual (UI + MCP)

## Context

Proyecto greenfield (`openspec/specs/` vacío). Ver `proposal.md - Why`. Restricciones: `requirement.md` + `AGENTS.md` (estado único, TypeScript estricto, Zod en MCP y Server Actions, Vitest + Playwright). Sin código Next.js aún.

## Goals / Non-Goals

**Goals:**
- Estado único Prisma compartido por Server Actions y Tools MCP.
- 5 tools MCP clásicas en inglés con guardrails de contexto.
- UI española CRUD total con shadcn, responsive, sin paginador visual v1.
- Híbrido SQLite local / Turso prod sin fricción en tests.

**Non-Goals:**
- Auth MCP, multi-usuario, roles, historial `TaskEvent`, paginación visual, dark mode obligatorio, realtime websockets (basta revalidación tras mutación).

## Decisions

- **Scaffolding `create-next-app` + shadcn/ui + Prisma:** estándar App Router; alternativa manual con Vite descartada por Server Actions y `revalidatePath`.
- **Prisma `db` singleton (`lib/db.ts`) con driver dual:** `adapter-libsql` solo si hay `TURSO_*`, si no SQLite file; evita dos clientes y permite Vitest `:memory:`. Alternativa dos schemas descartada por divergencia.
- **Servicio `lib/tasks.ts` como única mutación:** Server Actions (`app/actions.ts`) y tools MCP delegan aquí (incluye regla fechaCulminada); nada de Prisma directo en UI ni en ruta MCP.
- **`lib/validators.ts` Zod compartido:** mismos schemas en Actions y MCP, mensajes ES; alternativa duplicar schemas descartada.
- **`@vercel/mcp-adapter` Streamable HTTP en `app/api/mcp/route.ts`:** default actual del adapter; SSE legacy descartado salvo que un cliente concreto lo exija.
- **Tools delgadas:** parse Zod -> `lib/tasks` -> `JSON.stringify` en `content[0].text`; errores (validación / P2025) mapeados a texto controlado.
- **UI Server Components + Client islands:** lista/filtros/búsqueda en cliente con `useOptimistic` opcional; modal shadcn `Dialog` para editar; `confirm`/`AlertDialog` para borrar; `revalidatePath('/')` tras mutar.
- **Testing:** Vitest con DB `:memory:` por fichero (servicio, validators, handler MCP mockeado); Playwright Chromium serial contra dev local (crear/listar/filtrar/editar/completar/borrar).

## Risks / Trade-offs

- [Turso en serverless + migraciones] → Mitigación: migraciones en build/CI (`prisma migrate deploy` o `db push` documentado), `TURSO_*` solo en prod/preview.
- [MCP abierto sin auth] → Mitigación: documentar como v1, rate-limit/secret en follow-up; no exponer datos sensibles.
- [`list_tasks` sin paginación UI + agentes que piden todo] → Mitigación: limit default 50 / max 100 + offset.
- [shadcn pesado para una Todo] → Mitigación: solo `Button/Input/Dialog/Badge`; Tailwind puro para el resto.
- [`@vercel/mcp-adapter` API cambiante] → Mitigación: aislar creación del servidor en `lib/mcp.ts`, pin de versión.

## Migration Plan

Greenfield, sin migración. Deploy: `prisma generate` en install, `migrate deploy` en Vercel build, envs `TURSO_DATABASE_URL`/`TURSO_AUTH_TOKEN` en prod/preview, `DATABASE_URL=file:./dev.db` en dev. Rollback: revert del change (no hay datos legacy).

## Open Questions

- Ninguna bloqueante. Deferible: ¿añadir `HEAD/GET` healthcheck de `/api/mcp` para observabilidad sin tocar specs/tasks?
