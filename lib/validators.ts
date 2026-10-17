import { z } from "zod";

export const TaskStatusEnum = z.enum(["PENDIENTE", "EN_PROCESO", "COMPLETADA"]);
export type TaskStatus = z.infer<typeof TaskStatusEnum>;

export const tituloSchema = z
  .string({ error: (issue) => (issue.input === undefined ? "El título es obligatorio" : undefined) })
  .trim()
  .min(1, "El título es obligatorio")
  .max(100, "Máximo 100 caracteres");

export const descripcionSchema = z
  .string()
  .trim()
  .max(500, "Máximo 500 caracteres")
  .optional();

export const createTaskSchema = z.object({
  titulo: tituloSchema,
  descripcion: descripcionSchema,
  estado: TaskStatusEnum.optional(),
});

export type CreateTaskInput = z.infer<typeof createTaskSchema>;

export const updateTaskSchema = z.object({
  titulo: tituloSchema.optional(),
  descripcion: z.string().trim().max(500, "Máximo 500 caracteres").nullable().optional(),
  estado: TaskStatusEnum.optional(),
});

export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;

export const taskIdSchema = z
  .string()
  .trim()
  .min(1, "El id es obligatorio");

/** Entradas de tokens MCP: la revocación identifica el token por id. */
export const mcpTokenIdSchema = z
  .string()
  .trim()
  .min(1, "El id del token es obligatorio");

export const listTasksSchema = z.object({
  estado: TaskStatusEnum.optional(),
  q: z.string().trim().max(200).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  offset: z.coerce.number().int().min(0).default(0),
});

export type ListTasksInput = z.infer<typeof listTasksSchema>;
