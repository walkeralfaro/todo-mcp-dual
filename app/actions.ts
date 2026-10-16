"use server";

import { revalidatePath } from "next/cache";
import { createTask, deleteTask, updateTask } from "@/lib/tasks";
import { createTaskSchema, taskIdSchema, updateTaskSchema } from "@/lib/validators";

export type ActionResult = { ok: true } | { ok: false; error: string };

function err(e: unknown): ActionResult {
  if (e instanceof Error) return { ok: false, error: e.message };
  return { ok: false, error: "Error inesperado" };
}

export async function createTaskAction(formData: FormData): Promise<ActionResult> {
  try {
    const parsed = createTaskSchema.parse({
      titulo: String(formData.get("titulo") ?? ""),
      descripcion: formData.get("descripcion") ? String(formData.get("descripcion")) : undefined,
    });
    await createTask(parsed);
    revalidatePath("/");
    return { ok: true };
  } catch (e) {
    return err(e);
  }
}

export async function updateTaskAction(id: string, formData: FormData): Promise<ActionResult> {
  try {
    const parsedId = taskIdSchema.parse(id);
    const rawEstado = formData.get("estado");
    const parsed = updateTaskSchema.parse({
      titulo: formData.has("titulo") ? String(formData.get("titulo")) : undefined,
      descripcion: formData.has("descripcion") ? String(formData.get("descripcion")) : undefined,
      estado: rawEstado ? String(rawEstado) : undefined,
    });
    await updateTask(parsedId, parsed);
    revalidatePath("/");
    return { ok: true };
  } catch (e) {
    return err(e);
  }
}

export async function deleteTaskAction(id: string): Promise<ActionResult> {
  try {
    const parsedId = taskIdSchema.parse(id);
    await deleteTask(parsedId);
    revalidatePath("/");
    return { ok: true };
  } catch (e) {
    return err(e);
  }
}
