import type { DbClient } from "./db";
import { db } from "./db";
import { createTask, deleteTask, getTask, listTasks, updateTask } from "./tasks";
import {
  createTaskSchema,
  listTasksSchema,
  taskIdSchema,
  updateTaskSchema,
} from "./validators";

/** Formato de respuesta estándar MCP para tools de texto. */
export type McpResult = {
  content: { type: "text"; text: string }[];
  isError?: boolean;
};

export function mcpText(payload: unknown): McpResult {
  return {
    content: [{ type: "text" as const, text: JSON.stringify(payload) }],
  };
}

function mcpError(message: string): McpResult {
  return {
    content: [{ type: "text" as const, text: JSON.stringify({ error: message }) }],
    isError: true,
  };
}

const LIMIT_DEFAULT = 50;
const LIMIT_MAX = 100;

export async function mcpListTasks(params: unknown, client: DbClient = db) {
  try {
    const input = listTasksSchema.parse(params ?? {});
    const tasks = await listTasks(input, client);
    return mcpText(tasks);
  } catch (e) {
    return mcpError(e instanceof Error ? e.message : "Error inesperado");
  }
}

export async function mcpGetTask(params: unknown, client: DbClient = db) {
  try {
    const { id } = (params as { id?: unknown }) ?? {};
    const task = await getTask(taskIdSchema.parse(id), client);
    return mcpText(task);
  } catch (e) {
    return mcpError(e instanceof Error ? e.message : "Error inesperado");
  }
}

export async function mcpCreateTask(params: unknown, client: DbClient = db) {
  try {
    const task = await createTask(createTaskSchema.parse(params), client);
    return mcpText(task);
  } catch (e) {
    return mcpError(e instanceof Error ? e.message : "Error inesperado");
  }
}

export async function mcpUpdateTask(params: unknown, client: DbClient = db) {
  try {
    const { id, ...rest } = (params as { id?: unknown }) ?? {};
    const task = await updateTask(taskIdSchema.parse(id), updateTaskSchema.parse(rest), client);
    return mcpText(task);
  } catch (e) {
    return mcpError(e instanceof Error ? e.message : "Error inesperado");
  }
}

export async function mcpDeleteTask(params: unknown, client: DbClient = db) {
  try {
    const { id } = (params as { id?: unknown }) ?? {};
    const task = await deleteTask(taskIdSchema.parse(id), client);
    return mcpText({ deleted: true, id: task.id });
  } catch (e) {
    return mcpError(e instanceof Error ? e.message : "Error inesperado");
  }
}

export const MCP_TOOL_NAMES = [
  "list_tasks",
  "get_task",
  "create_task",
  "update_task",
  "delete_task",
] as const;

export { LIMIT_DEFAULT, LIMIT_MAX };
