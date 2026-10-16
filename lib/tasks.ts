import type { Prisma, PrismaClient, Task } from "@prisma/client";
import { db, type DbClient } from "./db";
import {
  createTaskSchema,
  listTasksSchema,
  taskIdSchema,
  updateTaskSchema,
  type CreateTaskInput,
  type ListTasksInput,
  type UpdateTaskInput,
} from "./validators";

/**
 * Capa de servicio única para tareas.
 * Usada por Server Actions y Tools MCP (principio de estado único).
 *
 * Regla de `fechaCulminada`:
 * - al pasar a COMPLETADA se asigna `new Date()`
 * - al salir de COMPLETADA hacia PENDIENTE/EN_PROCESO se limpia a null
 */

export async function listTasks(
  input: ListTasksInput = { limit: 50, offset: 0 },
  client: DbClient = db,
): Promise<Task[]> {
  const { estado, q, limit, offset } = listTasksSchema.parse(input);
  const where: Prisma.TaskWhereInput = {};
  if (estado) where.estado = estado;
  if (q) {
    where.OR = [
      { titulo: { contains: q } },
      { descripcion: { contains: q } },
    ];
  }
  return client.task.findMany({
    where,
    orderBy: { fechaCreacion: "desc" },
    take: limit,
    skip: offset,
  });
}

export async function getTask(id: string, client: DbClient = db): Promise<Task> {
  const parsedId = taskIdSchema.parse(id);
  const task = await client.task.findUnique({ where: { id: parsedId } });
  if (!task) throw new Error("La tarea no existe");
  return task;
}

export async function createTask(
  input: CreateTaskInput,
  client: DbClient = db,
): Promise<Task> {
  const data = createTaskSchema.parse(input);
  const estado = data.estado ?? "PENDIENTE";
  return client.task.create({
    data: {
      titulo: data.titulo,
      descripcion: data.descripcion ?? null,
      estado,
      fechaCulminada: estado === "COMPLETADA" ? new Date() : null,
    },
  });
}

export async function updateTask(
  id: string,
  input: UpdateTaskInput,
  client: DbClient | PrismaClient = db,
): Promise<Task> {
  const parsedId = taskIdSchema.parse(id);
  const data = updateTaskSchema.parse(input);
  const current = await (client as DbClient).task.findUnique({
    where: { id: parsedId },
  });
  if (!current) throw new Error("La tarea no existe");

  const nextEstado = data.titulo !== undefined || data.descripcion !== undefined || data.estado
    ? (data.estado ?? current.estado)
    : current.estado;

  let fechaCulminada = current.fechaCulminada;
  if (data.estado) {
    if (data.estado === "COMPLETADA") fechaCulminada = new Date();
    else fechaCulminada = null;
  }

  return (client as DbClient).task.update({
    where: { id: parsedId },
    data: {
      ...(data.titulo !== undefined ? { titulo: data.titulo } : {}),
      ...(data.descripcion !== undefined ? { descripcion: data.descripcion } : {}),
      ...(data.estado ? { estado: data.estado } : {}),
      ...(data.estado ? { fechaCulminada } : {}),
      ...(nextEstado === current.estado && !data.estado ? {} : {}),
    },
  });
}

export async function deleteTask(id: string, client: DbClient = db): Promise<Task> {
  const parsedId = taskIdSchema.parse(id);
  const current = await client.task.findUnique({ where: { id: parsedId } });
  if (!current) throw new Error("La tarea no existe");
  return client.task.delete({ where: { id: parsedId } });
}
