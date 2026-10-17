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

const baseHandler = createMcpHandler(
  (server) => {
    server.registerTool(
      "list_tasks",
      {
        title: "List tasks",
        description: "Lista tareas con filtro por estado, búsqueda y paginación.",
        inputSchema: z.object({
          estado: TaskStatusEnum.optional().describe("Filtrar por estado"),
          q: z.string().optional().describe("Búsqueda en título/descripción"),
          limit: z.number().int().min(1).max(100).optional().describe("Límite (default 50, max 100)"),
          offset: z.number().int().min(0).optional().describe("Desplazamiento (default 0)"),
        }),
      },
      async (params) => mcpListTasks(params),
    );
    server.registerTool(
      "get_task",
      {
        title: "Get task",
        description: "Obtiene una tarea por id.",
        inputSchema: z.object({ id: z.string().describe("Id de la tarea") }),
      },
      async (params) => mcpGetTask(params),
    );
    server.registerTool(
      "create_task",
      {
        title: "Create task",
        description: "Crea una tarea. Si solo te dan un nombre, envía solo `titulo` y omite `descripcion`.",
        inputSchema: z.object({
          titulo: z.string().min(1).max(100).describe("Título (1-100)"),
          descripcion: z
            .string()
            .max(500)
            .optional()
            .describe(
              "Omitir salvo que el usuario la dé literalmente o pida duplicar el título. No inferir ni copiar `titulo`. (max 500)",
            ),
          estado: TaskStatusEnum.optional().describe("Estado inicial"),
        }),
      },
      async (params) => mcpCreateTask(params),
    );
    server.registerTool(
      "update_task",
      {
        title: "Update task",
        description: "Actualiza título, descripción y/o estado de una tarea.",
        inputSchema: z.object({
          id: z.string().describe("Id de la tarea"),
          titulo: z.string().min(1).max(100).optional(),
          descripcion: z.string().max(500).nullable().optional(),
          estado: TaskStatusEnum.optional(),
        }),
      },
      async (params) => mcpUpdateTask(params),
    );
    server.registerTool(
      "delete_task",
      {
        title: "Delete task",
        description: "Elimina una tarea.",
        inputSchema: z.object({ id: z.string().describe("Id de la tarea") }),
      },
      async (params) => mcpDeleteTask(params),
    );
  },
  { serverInfo: { name: "todo-mcp", version: "0.1.0" }, verboseLogs: false },
);

/**
 * Middleware de autenticación MCP (Opción B: Bearer token).
 * Valida el token contra `McpToken` (hash SHA-256), resuelve `userId` y lo
 * inyecta en `params` de cada request JSON-RPC para aislar por usuario.
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

  // Inyectar `userId` en los params de cada request JSON-RPC.
  let modifiedRequest: Request = request;
  const contentType = request.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    try {
      const body = (await request.clone().json()) as unknown;
      const withUserId = injectUserId(body, userId);
      if (withUserId !== body) {
        modifiedRequest = new Request(request.url, {
          method: request.method,
          headers: { ...Object.fromEntries(request.headers.entries()), "content-type": "application/json" },
          body: JSON.stringify(withUserId),
        });
      }
    } catch {
      // Si no es JSON válido, dejar pasar al handler base (que responderá error de parseo).
    }
  }

  return baseHandler(modifiedRequest);
}

/**
 * Inyecta `userId` en el campo `params` de un cuerpo JSON-RPC (simple o batch).
 * Solo modifica si `params` es un objeto y aún no trae `userId`.
 */
function injectUserId(body: unknown, userId: string): unknown {
  if (Array.isArray(body)) {
    return body.map((item) => injectUserId(item, userId));
  }
  if (body && typeof body === "object" && !("params" in body)) {
    return body;
  }
  const rpc = body as { params?: unknown; [key: string]: unknown };
  if (rpc.params && typeof rpc.params === "object" && !Array.isArray(rpc.params)) {
    const params = rpc.params as Record<string, unknown>;
    if (!("userId" in params)) {
      params.userId = userId;
    }
  }
  return rpc;
}

export { authenticatedHandler as GET, authenticatedHandler as POST, authenticatedHandler as DELETE };
