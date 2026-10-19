# AGENTS.md: Directrices Operativas para OpenCode / Agentes de IA

Este documento guía el comportamiento, los flujos de trabajo y las restricciones técnicas para los agentes de IA que participan en el desarrollo, mantenimiento y verificación de la Todo App.

---

## 1. Contexto y Arquitectura del Repositorio
- **Framework:** Next.js (App Router) con React 19 y Tailwind CSS.
- **Persistencia:** SQLite gestionada a través de Prisma ORM.
- **MCP Backend:** Implementado en la ruta `/api/mcp` con `mcp-handler` sobre `@modelcontextprotocol/server`. Validación estricta de payloads con Zod en `lib/validators.ts`; el `userId` de cada tool sale siempre del token Bearer, nunca del cuerpo JSON-RPC.
- **Principio de Estado Único:** Las Server Actions del frontend y las *Tools* del servidor MCP comparten exactamente la misma capa de Prisma y la base de datos SQLite. No deben existir duplicidades de lógica de negocio en la capa de datos.
- **Documentación de arquitectura:** `docs/arquitectura-todo-mcp.html` es el documento interactivo autocontenido (generado con archify, versionado con sus recibos `.finalize.json`) y es la fuente de verdad. `scripts/sync-arquitectura.mjs` lo publica en `public/arquitectura.html` y `next.config.ts` lo sirve en `/arquitectura`. Los hooks `predev`/`prebuild` ejecutan esa copia antes de arrancar y de compilar, de modo que `public/arquitectura.html` no se edita ni se regenera a mano: se actualiza re-ejecutando el script (`npm run prebuild`).
- **Especificaciones:** la fuente de verdad son las capacidades en `openspec/specs/<capacidad>/spec.md` (una carpeta por capacidad, requisito del tooling de OpenSpec). `scripts/sync-especificaciones.mjs` las consolida en `docs/especificaciones.md` (índice legible con requisitos y escenarios por capacidad), que se regenera con `npm run specs:doc` y en `predev`/`prebuild`; ese documento es generado y no se edita a mano. Las capacidades son un inventario **cerrado** de seis (`todo-tasks`, `task-ui`, `identity`, `mcp`, `public-site`, `platform`), detallado en `openspec/config.yaml`.

---

## 2. Flujo de Trabajo Obligatorio (OpenSpec)
Antes de escribir código o implementar nuevas funcionalidades, asegúrate de seguir esta secuencia:
1. **Consultar y Actualizar `requirement.md`:** Respetar los requerimientos funcionales y tecnológicos establecidos.
2. **Definir la spec:** Crear/actualizar el cambio en `openspec/changes/<cambio>/` (`proposal.md`, `design.md` y los deltas en `specs/`) precisando el comportamiento técnico y los contratos de las herramientas o componentes. **No crees una capacidad nueva por cada change:** modifica la capacidad existente que ya cubra el comportamiento (inventario cerrado en `openspec/config.yaml` y en `docs/especificaciones.md`); una carpeta nueva exige justificación explícita en el proposal.
3. **Mantener `tasks.md`:** Todo el desarrollo debe descomponerse en tareas atómicas y verificables. Marca las tareas como completadas (`[x]`) conforme avances y valida con `openspec validate <cambio> --strict`.

---

## 3. Normas de Codificación y Estilo
- **TypeScript Estricto:** Evita el uso de `any`. Tipa explícitamente los parámetros de las Server Actions, esquemas Zod y respuestas de Prisma.
- **Separación de Responsabilidades:**
  - Los componentes de React (UI) deben invocar exclusivamente Server Actions o endpoints validados.
  - Las *Tools* de MCP deben retornar estrictamente el formato de contenido esperado por el SDK (`{ content: [{ type: 'text', text: '...' }] }`).
- **Manejo de Errores:** Captura excepciones tanto en el backend MCP como en las Server Actions devolviendo mensajes claros y controlados.

---

## 4. Protocolo de Testing (Proporcional al Cambio)

La cobertura de pruebas se exige en proporción al riesgo y al tipo de cambio, no por defecto:

- **Cambios puramente presentacionales** (estilos, textos, layout, componentes sin lógica): no requieren tests nuevos. Verificación mínima: `npm run lint` y `npm run typecheck`, más una revisión visual si aplica. No ejecutar `npm test` ni `npm run test:e2e`.
- **Cambios de UI/interacción sin lógica de negocio** (reubicar o agrupar controles, menús desplegables, estados de apertura/cierre, navegación entre rutas existentes): no requieren E2E, Playwright, Turso ni bases de datos. Verificación mínima: `npm run lint`, `npm run typecheck` y revisión manual del flujo; si el cambio introduce lógica testeable (normalización, formateo, recortes de texto), se extrae a `lib/*.ts` con su `lib/*.test.ts` y se ejecuta únicamente ese test con Vitest (entorno `node`, sin BD).
- **Cambios de comportamiento** (Prisma, validadores Zod, Server Actions, tools MCP, contratos de API): añadir o actualizar tests unitarios/integración en la capa afectada y ejecutar únicamente esos tests con Vitest.
- **Playwright (E2E)** solo para flujos de usuario críticos que el cambio toque (autenticación, CRUD principal, protección de rutas). No se ejecuta la suite E2E por cambios que no los afecten.
- **No se ejecuta la suite completa por defecto.** Cada cambio corre solo el subconjunto relevante; la verificación completa (`npm run lint`, `npm run typecheck`, `npm test`, `npm run test:e2e`) se reserva para hitos o antes de un release. `npm run test:e2e` carga `.env` por sí solo y necesita el puerto 3000 libre.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
