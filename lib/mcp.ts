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

function requireUserId(params: unknown): string {
  const p = (params as { userId?: string }) ?? {};
  if (!p.userId) throw new Error("No autenticado");
  return p.userId;
}

export async function mcpListTasks(params: unknown, client: DbClient = db) {
  try {
    const p = (params as Record<string, unknown>) ?? {};
    const userId = requireUserId(p);
    const input = listTasksSchema.parse(p);
    const tasks = await listTasks({ ...input, userId }, client);
    return mcpText(tasks);
  } catch (e) {
    return mcpError(e instanceof Error ? e.message : "Error inesperado");
  }
}

export async function mcpGetTask(params: unknown, client: DbClient = db) {
  try {
    const p = (params as { id?: string; userId?: string }) ?? {};
    const userId = requireUserId(p);
    const task = await getTask(taskIdSchema.parse(p.id), userId, client);
    return mcpText(task);
  } catch (e) {
    return mcpError(e instanceof Error ? e.message : "Error inesperado");
  }
}

export async function mcpCreateTask(params: unknown, client: DbClient = db) {
  try {
    const p = (params as Record<string, unknown>) ?? {};
    const userId = requireUserId(p);
    const task = await createTask({ ...createTaskSchema.parse(p), userId }, client);
    return mcpText(task);
  } catch (e) {
    return mcpError(e instanceof Error ? e.message : "Error inesperado");
  }
}

export async function mcpUpdateTask(params: unknown, client: DbClient = db) {
  try {
    const p = (params as { id?: string; userId?: string } & Record<string, unknown>) ?? {};
    const userId = requireUserId(p);
    const { id, ...rest } = p;
    const task = await updateTask(taskIdSchema.parse(id), updateTaskSchema.parse(rest), userId, client);
    return mcpText(task);
  } catch (e) {
    return mcpError(e instanceof Error ? e.message : "Error inesperado");
  }
}

export async function mcpDeleteTask(params: unknown, client: DbClient = db) {
  try {
    const p = (params as { id?: string; userId?: string }) ?? {};
    const userId = requireUserId(p);
    const task = await deleteTask(taskIdSchema.parse(p.id), userId, client);
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
