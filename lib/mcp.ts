import type { DbClient } from "./db";
import { db } from "./db";
import { ZodError } from "zod";
import { DomainError } from "./errors";
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

/** Mensaje genérico para fallos no esperados; el detalle queda en el log. */
const GENERIC_ERROR = "No se pudo completar la operación. Inténtalo de nuevo.";

/**
 * Traduce un fallo a la respuesta de error de la tool:
 * - validación (Zod): el mensaje del esquema, en español;
 * - error de negocio: su mensaje (`No autenticado`, `La tarea no existe`,
 *   `No autorizada`), que la spec exige devolver al agente;
 * - cualquier otro fallo (Prisma, red…): mensaje genérico, con el detalle
 *   únicamente en el log del servidor.
 */
function mcpErrorFrom(e: unknown): McpResult {
  if (e instanceof ZodError) return mcpError(e.issues[0]?.message ?? "Datos no válidos");
  if (e instanceof DomainError) return mcpError(e.message);
  console.error("[mcp] fallo interno en la tool:", e);
  return mcpError(GENERIC_ERROR);
}

const LIMIT_DEFAULT = 50;
const LIMIT_MAX = 100;

function requireUserId(params: unknown): string {
  const p = (params as { userId?: string }) ?? {};
  if (!p.userId) throw new DomainError("No autenticado");
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
    return mcpErrorFrom(e);
  }
}

export async function mcpGetTask(params: unknown, client: DbClient = db) {
  try {
    const p = (params as { id?: string; userId?: string }) ?? {};
    const userId = requireUserId(p);
    const task = await getTask(taskIdSchema.parse(p.id), userId, client);
    return mcpText(task);
  } catch (e) {
    return mcpErrorFrom(e);
  }
}

export async function mcpCreateTask(params: unknown, client: DbClient = db) {
  try {
    const p = (params as Record<string, unknown>) ?? {};
    const userId = requireUserId(p);
    const task = await createTask({ ...createTaskSchema.parse(p), userId }, client);
    return mcpText(task);
  } catch (e) {
    return mcpErrorFrom(e);
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
    return mcpErrorFrom(e);
  }
}

export async function mcpDeleteTask(params: unknown, client: DbClient = db) {
  try {
    const p = (params as { id?: string; userId?: string }) ?? {};
    const userId = requireUserId(p);
    const task = await deleteTask(taskIdSchema.parse(p.id), userId, client);
    return mcpText({ deleted: true, id: task.id });
  } catch (e) {
    return mcpErrorFrom(e);
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
