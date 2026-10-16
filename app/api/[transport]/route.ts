import { createMcpHandler } from "mcp-handler";
import { z } from "zod";
import {
  mcpCreateTask,
  mcpDeleteTask,
  mcpGetTask,
  mcpListTasks,
  mcpUpdateTask,
} from "@/lib/mcp";
import { TaskStatusEnum } from "@/lib/validators";

const handler = createMcpHandler(
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

export { handler as GET, handler as POST, handler as DELETE };
