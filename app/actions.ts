"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { createTask, deleteTask, updateTask } from "@/lib/tasks";
import { createTaskSchema, taskIdSchema, updateTaskSchema } from "@/lib/validators";

export type ActionResult = { ok: true } | { ok: false; error: string };

async function currentUserId(): Promise<string | null> {
  // Better Auth lee las cookies del header "cookie" de la solicitud real.
  const session = await auth.api.getSession({ headers: await headers() });
  return session?.user?.id ?? null;
}

function err(e: unknown): ActionResult {
  if (e instanceof Error) return { ok: false, error: e.message };
  return { ok: false, error: "Error inesperado" };
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
