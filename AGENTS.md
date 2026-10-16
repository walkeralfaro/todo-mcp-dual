# AGENTS.md: Directrices Operativas para OpenCode / Agentes de IA

Este documento guía el comportamiento, los flujos de trabajo y las restricciones técnicas para los agentes de IA que participan en el desarrollo, mantenimiento y verificación de la Todo App.

---

## 1. Contexto y Arquitectura del Repositorio
- **Framework:** Next.js (App Router) con React 19 y Tailwind CSS.
- **Persistencia:** SQLite gestionada a través de Prisma ORM.
- **MCP Backend:** Implementado en la ruta `/api/mcp` utilizando `@modelcontextprotocol/sdk` y `@vercel/mcp-adapter`. Validación estricta de payloads con Zod.
- **Principio de Estado Único:** Las Server Actions del frontend y las *Tools* del servidor MCP comparten exactamente la misma capa de Prisma y la base de datos SQLite. No deben existir duplicidades de lógica de negocio en la capa de datos.

---

## 2. Flujo de Trabajo Obligatorio (OpenSpec)
Antes de escribir código o implementar nuevas funcionalidades, asegúrate de seguir esta secuencia:
1. **Consultar y Actualizar `requirement.md`:** Respetar los requerimientos funcionales y tecnológicos establecidos.
2. **Generar/Actualizar `spec.md`:** Definir con precisión el comportamiento técnico y los contratos de las herramientas o componentes.
3. **Mantener `plan.md` y `tasks.md`:** Todo el desarrollo debe descomponerse en tareas atómicas y verificables. Marca las tareas como completadas (`[x]`) conforme avances.

---

## 3. Normas de Codificación y Estilo
- **TypeScript Estricto:** Evita el uso de `any`. Tipa explícitamente los parámetros de las Server Actions, esquemas Zod y respuestas de Prisma.
- **Separación de Responsabilidades:**
  - Los componentes de React (UI) deben invocar exclusivamente Server Actions o endpoints validados.
  - Las *Tools* de MCP deben retornar estrictamente el formato de contenido esperado por el SDK (`{ content: [{ type: 'text', text: '...' }] }`).
- **Manejo de Errores:** Captura excepciones tanto en el backend MCP como en las Server Actions devolviendo mensajes claros y controlados.

---

## 4. Protocolo de Testing (Calidad Requerida)
Ninguna funcionalidad se considerará terminada si no incluye su respectiva cobertura de pruebas:
- **Vitest:** Ejecutar pruebas unitarias e integración para validar la lógica de Prisma, validadores Zod y el comportamiento del servidor MCP.
- **Playwright:** Ejecutar pruebas E2E para comprobar los flujos interactivos en la interfaz web de Next.js.
- **Comando de Verificación:** Asegúrate de ejecutar la suite de pruebas localmente antes de finalizar cualquier tarea (`npm test` o el equivalente configurado en el proyecto).

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
