"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { ZodError } from "zod";
import { auth } from "@/lib/auth";
import { DomainError } from "@/lib/errors";
import { createTask, deleteTask, updateTask } from "@/lib/tasks";
import { createTaskSchema, taskIdSchema, updateTaskSchema } from "@/lib/validators";

export type ActionResult = { ok: true } | { ok: false; error: string };

/** Mensaje único que ve el cliente cuando el fallo no es de validación. */
const GENERIC_ERROR = "No se pudo completar la operación. Inténtalo de nuevo.";

async function currentUserId(): Promise<string | null> {
  // Better Auth lee las cookies del header "cookie" de la solicitud real.
  const session = await auth.api.getSession({ headers: await headers() });
  return session?.user?.id ?? null;
}

/**
 * Traduce un fallo a la respuesta de la Server Action:
 * - validación (Zod): el mensaje del esquema, escrito en español para el usuario;
 * - error de negocio: su mensaje, ya redactado para el usuario;
 * - cualquier otro fallo (Prisma, red…): mensaje genérico, con el detalle
 *   únicamente en el log del servidor.
 */
function err(e: unknown): ActionResult {
  if (e instanceof ZodError) {
    return { ok: false, error: e.issues[0]?.message ?? "Datos no válidos" };
  }
  if (e instanceof DomainError) {
    return { ok: false, error: e.message };
  }
  console.error("[tareas] fallo interno en la Server Action:", e);
  return { ok: false, error: GENERIC_ERROR };
}

export async function createTaskAction(formData: FormData): Promise<ActionResult> {
  try {
    const userId = await currentUserId();
    if (!userId) return { ok: false, error: "No autenticado" };
    const parsed = createTaskSchema.parse({
      titulo: String(formData.get("titulo") ?? ""),
      descripcion: formData.get("descripcion") ? String(formData.get("descripcion")) : undefined,
    });
    await createTask({ ...parsed, userId });
    revalidatePath("/tareas");
    return { ok: true };
  } catch (e) {
    return err(e);
  }
}

export async function updateTaskAction(id: string, formData: FormData): Promise<ActionResult> {
  try {
    const userId = await currentUserId();
    if (!userId) return { ok: false, error: "No autenticado" };
    const parsedId = taskIdSchema.parse(id);
    const rawEstado = formData.get("estado");
    const parsed = updateTaskSchema.parse({
      titulo: formData.has("titulo") ? String(formData.get("titulo")) : undefined,
      descripcion: formData.has("descripcion") ? String(formData.get("descripcion")) : undefined,
      estado: rawEstado ? String(rawEstado) : undefined,
    });
    await updateTask(parsedId, parsed, userId);
    revalidatePath("/tareas");
    return { ok: true };
  } catch (e) {
    return err(e);
  }
}

export async function deleteTaskAction(id: string): Promise<ActionResult> {
  try {
    const userId = await currentUserId();
    if (!userId) return { ok: false, error: "No autenticado" };
    const parsedId = taskIdSchema.parse(id);
    await deleteTask(parsedId, userId);
    revalidatePath("/tareas");
    return { ok: true };
  } catch (e) {
    return err(e);
  }
}
