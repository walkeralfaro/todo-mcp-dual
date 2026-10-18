import { z } from "zod";

export const TaskStatusEnum = z.enum(["PENDIENTE", "EN_PROCESO", "COMPLETADA"], {
  error: "Estado no válido: usa PENDIENTE, EN_PROCESO o COMPLETADA",
});
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
  q: z.string().trim().max(200, "Máximo 200 caracteres").optional(),
  limit: z.coerce
    .number()
    .int("Debe ser un número entero")
    .min(1, "El límite mínimo es 1")
    .max(100, "Máximo 100")
    .default(50),
  offset: z.coerce
    .number()
    .int("Debe ser un número entero")
    .min(0, "El desplazamiento no puede ser negativo")
    .default(0),
});

export type ListTasksInput = z.infer<typeof listTasksSchema>;
