import { createMcpHandler } from "mcp-handler";
import { z } from "zod";
import {
  mcpCreateTask,
  mcpDeleteTask,
  mcpGetTask,
  mcpListTasks,
  mcpUpdateTask,
} from "@/lib/mcp";
import { authenticateMcpBearer } from "@/lib/mcp-auth";
import { TaskStatusEnum } from "@/lib/validators";

/**
 * Handler MCP ligado a un único usuario.
 *
 * El SDK valida los `arguments` de cada `tools/call` contra el `inputSchema`
 * (Zod descarta las claves que el esquema no declara) y entrega al handler solo
 * ese resultado ya validado; por eso el `userId` no puede viajar dentro del
 * cuerpo JSON-RPC. Se fija aquí, por petición, a partir del token Bearer ya
 * verificado: la tool opera siempre sobre el usuario del token y nunca sobre un
 * valor que venga del cliente.
 *
 * Los `inputSchema` publicados describen los tipos y dejan los límites en su
 * `description` (lo que el agente necesita para invocar), pero no repiten las
 * reglas de negocio: la validación con mensajes en español vive en
 * `lib/validators.ts` y la aplica `lib/mcp.ts`, que responde un error
 * controlado en vez del texto genérico del SDK.
 */
function handlerForUser(userId: string) {
  return createMcpHandler(
    (server) => {
      server.registerTool(
        "list_tasks",
        {
          title: "List tasks",
          description: "Lista tareas con filtro por estado, búsqueda y paginación.",
          inputSchema: z.object({
            estado: TaskStatusEnum.optional().describe("Filtrar por estado"),
            q: z.string().optional().describe("Búsqueda en título/descripción"),
            limit: z.number().optional().describe("Límite de filas (1-100, default 50)"),
            offset: z.number().optional().describe("Desplazamiento (default 0)"),
          }),
        },
        async (params) => mcpListTasks({ ...params, userId }),
      );
      server.registerTool(
        "get_task",
        {
          title: "Get task",
          description: "Obtiene una tarea por id.",
          inputSchema: z.object({ id: z.string().describe("Id de la tarea") }),
        },
        async (params) => mcpGetTask({ ...params, userId }),
      );
      server.registerTool(
        "create_task",
        {
          title: "Create task",
          description: "Crea una tarea. Si solo te dan un nombre, envía solo `titulo` y omite `descripcion`.",
          inputSchema: z.object({
            titulo: z.string().describe("Título (1-100)"),
            descripcion: z
              .string()
              .optional()
              .describe(
                "Omitir salvo que el usuario la dé literalmente o pida duplicar el título. No inferir ni copiar `titulo`. (max 500)",
              ),
            estado: TaskStatusEnum.optional().describe("Estado inicial"),
          }),
        },
        async (params) => mcpCreateTask({ ...params, userId }),
      );
      server.registerTool(
        "update_task",
        {
          title: "Update task",
          description: "Actualiza título, descripción y/o estado de una tarea.",
          inputSchema: z.object({
            id: z.string().describe("Id de la tarea"),
            titulo: z.string().optional().describe("Título (1-100)"),
            descripcion: z.string().nullable().optional().describe("Descripción (max 500)"),
            estado: TaskStatusEnum.optional(),
          }),
        },
        async (params) => mcpUpdateTask({ ...params, userId }),
      );
      server.registerTool(
        "delete_task",
        {
          title: "Delete task",
          description: "Elimina una tarea.",
          inputSchema: z.object({ id: z.string().describe("Id de la tarea") }),
        },
        async (params) => mcpDeleteTask({ ...params, userId }),
      );
    },
    { serverInfo: { name: "todo-mcp", version: "0.1.0" }, verboseLogs: false },
  );
}

/**
 * Middleware de autenticación MCP (Opción B: Bearer token).
 * Valida el token contra `McpToken` (hash SHA-256), resuelve el `userId` y
 * atiende la petición con el handler de ese usuario.
 */
async function authenticatedHandler(request: Request): Promise<Response> {
  const userId = await authenticateMcpBearer(request);
  if (!userId) {
    return new Response(
      JSON.stringify({
        jsonrpc: "2.0",
        error: { code: -32001, message: "No autenticado: token MCP inválido o ausente" },
      }),
      { status: 401, headers: { "content-type": "application/json" } },
    );
  }

  return handlerForUser(userId)(request);
}

export { authenticatedHandler as GET, authenticatedHandler as POST, authenticatedHandler as DELETE };
