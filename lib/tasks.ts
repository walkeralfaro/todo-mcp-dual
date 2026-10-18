import type { Prisma, Task } from "./generated/prisma/client";
import { db, type DbClient } from "./db";
import { DomainError } from "./errors";
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
  input: ListTasksInput & { userId: string },
  client: DbClient = db,
): Promise<Task[]> {
  const { userId } = input;
  const { estado, q, limit, offset } = listTasksSchema.parse(input);
  const where: Prisma.TaskWhereInput = { userId };
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

/**
 * Cuenta las tareas no completadas del usuario (cifra del titular del día).
 * No depende del filtro ni de la ventana del listado: siempre cuenta todas
 * las tareas del usuario cuyo estado no es COMPLETADA.
 */
export async function countPendingTasks(
  userId: string,
  client: DbClient = db,
): Promise<number> {
  return client.task.count({
    where: { userId, estado: { not: "COMPLETADA" } },
  });
}

export async function getTask(
  id: string,
  userId: string,
  client: DbClient = db,
): Promise<Task> {
  const parsedId = taskIdSchema.parse(id);
  const task = await client.task.findUnique({ where: { id: parsedId } });
  if (!task) throw new DomainError("La tarea no existe");
  if (task.userId !== userId) throw new DomainError("No autorizada");
  return task;
}

export async function createTask(
  input: CreateTaskInput & { userId: string },
  client: DbClient = db,
): Promise<Task> {
  const data = createTaskSchema.parse(input);
  const estado = data.estado ?? "PENDIENTE";
  return client.task.create({
    data: {
      titulo: data.titulo,
      descripcion: data.descripcion ?? null,
      estado,
      userId: input.userId,
      fechaCulminada: estado === "COMPLETADA" ? new Date() : null,
    },
  });
}

export async function updateTask(
  id: string,
  input: UpdateTaskInput,
  userId: string,
  client: DbClient = db,
): Promise<Task> {
  const parsedId = taskIdSchema.parse(id);
  const data = updateTaskSchema.parse(input);
  const current = await client.task.findUnique({ where: { id: parsedId } });
  if (!current) throw new DomainError("La tarea no existe");
  if (current.userId !== userId) throw new DomainError("No autorizada");

  // `fechaCulminada` solo cambia al cambiar de estado: se asigna al completar
  // y se limpia al salir de COMPLETADA.
  let fechaCulminada = current.fechaCulminada;
  if (data.estado) {
    fechaCulminada = data.estado === "COMPLETADA" ? new Date() : null;
  }

  return client.task.update({
    where: { id: parsedId },
    data: {
      ...(data.titulo !== undefined ? { titulo: data.titulo } : {}),
      ...(data.descripcion !== undefined ? { descripcion: data.descripcion } : {}),
      ...(data.estado ? { estado: data.estado, fechaCulminada } : {}),
    },
  });
}

export async function deleteTask(
  id: string,
  userId: string,
  client: DbClient = db,
): Promise<Task> {
  const parsedId = taskIdSchema.parse(id);
  const current = await client.task.findUnique({ where: { id: parsedId } });
  if (!current) throw new DomainError("La tarea no existe");
  if (current.userId !== userId) throw new DomainError("No autorizada");
  return client.task.delete({ where: { id: parsedId } });
}
