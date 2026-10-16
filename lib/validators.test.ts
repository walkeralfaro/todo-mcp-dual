import { describe, expect, it } from "vitest";
import {
  createTaskSchema,
  descripcionSchema,
  listTasksSchema,
  tituloSchema,
  updateTaskSchema,
} from "./validators";

describe("validators", () => {
  it("rechaza título vacío con mensaje en español", () => {
    const r = tituloSchema.safeParse("   ");
    expect(r.success).toBe(false);
    if (!r.success) expect(r.error.issues[0].message).toBe("El título es obligatorio");
  });

  it("rechaza título de más de 100 caracteres", () => {
    const r = tituloSchema.safeParse("a".repeat(101));
    expect(r.success).toBe(false);
  });

  it("rechaza descripción de más de 500 caracteres", () => {
    const r = descripcionSchema.safeParse("a".repeat(501));
    expect(r.success).toBe(false);
  });

  it("acepta crear tarea válida", () => {
    const r = createTaskSchema.safeParse({ titulo: "Comprar pan" });
    expect(r.success).toBe(true);
  });

  it("listTasks aplica defaults limit 50 offset 0", () => {
    const r = listTasksSchema.parse({});
    expect(r.limit).toBe(50);
    expect(r.offset).toBe(0);
  });

  it("listTasks rechaza limit mayor de 100", () => {
    expect(() => listTasksSchema.parse({ limit: 500 })).toThrow();
  });

  it("update parcial acepta solo estado", () => {
    const r = updateTaskSchema.safeParse({ estado: "COMPLETADA" });
    expect(r.success).toBe(true);
  });
});
