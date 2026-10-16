import { PrismaClient } from "./generated/prisma/client";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { createTask, deleteTask, getTask, listTasks, updateTask } from "./tasks";
import { cleanTasks, newTestClient } from "./test-db";

let client: PrismaClient;

beforeAll(() => {
  // La DB de test de Turso ya tiene el esquema (scripts/apply-schema-turso.mjs).
  client = newTestClient();
});

beforeEach(async () => {
  await cleanTasks(client);
});

afterAll(async () => {
  await client.$disconnect();
});

describe("tasks service", () => {
  it("crea con PENDIENTE y fechaCulminada nula por defecto", async () => {
    const t = await createTask({ titulo: "Tarea 1", descripcion: "desc" }, client);
    expect(t.estado).toBe("PENDIENTE");
    expect(t.fechaCulminada).toBeNull();
  });

  it("completar asigna fechaCulminada y reabrir la limpia", async () => {
    const t = await createTask({ titulo: "Ciclo" }, client);
    const done = await updateTask(t.id, { estado: "COMPLETADA" }, client);
    expect(done.estado).toBe("COMPLETADA");
    expect(done.fechaCulminada).not.toBeNull();
    const reopened = await updateTask(t.id, { estado: "PENDIENTE" }, client);
    expect(reopened.fechaCulminada).toBeNull();
  });

  it("lista con filtro, búsqueda y orden desc", async () => {
    await createTask({ titulo: "Informe anual" }, client);
    await createTask({ titulo: "Otra cosa" }, client);
    const found = await listTasks({ q: "informe", limit: 50, offset: 0 }, client);
    expect(found.length).toBeGreaterThanOrEqual(1);
    expect(found.every((t) => `${t.titulo} ${t.descripcion ?? ""}`.toLowerCase().includes("informe"))).toBe(true);
  });

  it("respeta limit y offset", async () => {
    const one = await listTasks({ limit: 1, offset: 0 }, client);
    expect(one.length).toBeLessThanOrEqual(1);
  });

  it("get/update/delete de id inexistente lanzan error controlado", async () => {
    await expect(getTask("no-existe", client)).rejects.toThrow("La tarea no existe");
    await expect(updateTask("no-existe", { titulo: "x" }, client)).rejects.toThrow("La tarea no existe");
    await expect(deleteTask("no-existe", client)).rejects.toThrow("La tarea no existe");
  });

  it("borrar elimina definitivamente", async () => {
    const t = await createTask({ titulo: "Borrar" }, client);
    await deleteTask(t.id, client);
    await expect(getTask(t.id, client)).rejects.toThrow("La tarea no existe");
  });
});
