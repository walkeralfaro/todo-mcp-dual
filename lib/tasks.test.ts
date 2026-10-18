import { PrismaClient } from "./generated/prisma/client";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { createTask, countPendingTasks, deleteTask, getTask, listTasks, updateTask } from "./tasks";
import { cleanTasks, createTestUser, newTestClient } from "./test-db";

let client: PrismaClient;
let userId: string;

beforeAll(() => {
  // La DB de test de Turso ya tiene el esquema (scripts/apply-schema-turso.mjs).
  client = newTestClient();
});

beforeEach(async () => {
  await cleanTasks(client);
  userId = await createTestUser(client);
});

afterAll(async () => {
  await client.$disconnect();
});

describe("tasks service", () => {
  it("crea con PENDIENTE y fechaCulminada nula por defecto", async () => {
    const t = await createTask({ titulo: "Tarea 1", descripcion: "desc", userId }, client);
    expect(t.estado).toBe("PENDIENTE");
    expect(t.fechaCulminada).toBeNull();
    expect(t.userId).toBe(userId);
  });

  it("completar asigna fechaCulminada y reabrir la limpia", async () => {
    const t = await createTask({ titulo: "Ciclo", userId }, client);
    const done = await updateTask(t.id, { estado: "COMPLETADA" }, userId, client);
    expect(done.estado).toBe("COMPLETADA");
    expect(done.fechaCulminada).not.toBeNull();
    const reopened = await updateTask(t.id, { estado: "PENDIENTE" }, userId, client);
    expect(reopened.fechaCulminada).toBeNull();
  });

  it("lista con filtro, búsqueda y orden desc", async () => {
    await createTask({ titulo: "Informe anual", userId }, client);
    await createTask({ titulo: "Otra cosa", userId }, client);
    const found = await listTasks({ q: "informe", limit: 50, offset: 0, userId }, client);
    expect(found.length).toBeGreaterThanOrEqual(1);
    expect(found.every((t) => `${t.titulo} ${t.descripcion ?? ""}`.toLowerCase().includes("informe"))).toBe(true);
    expect(found.every((t) => t.userId === userId)).toBe(true);
  });

  it("respeta limit y offset", async () => {
    const one = await listTasks({ limit: 1, offset: 0, userId }, client);
    expect(one.length).toBeLessThanOrEqual(1);
  });

  it("get/update/delete de id inexistente lanzan error controlado", async () => {
    await expect(getTask("no-existe", userId, client)).rejects.toThrow("La tarea no existe");
    await expect(updateTask("no-existe", { titulo: "x" }, userId, client)).rejects.toThrow("La tarea no existe");
    await expect(deleteTask("no-existe", userId, client)).rejects.toThrow("La tarea no existe");
  });

  it("borrar elimina definitivamente", async () => {
    const t = await createTask({ titulo: "Borrar", userId }, client);
    await deleteTask(t.id, userId, client);
    await expect(getTask(t.id, userId, client)).rejects.toThrow("La tarea no existe");
  });

  it("no devuelve tareas de otro usuario", async () => {
    const otroUsuario = await createTestUser(client, "otro@prueba.test");
    await createTask({ titulo: "Tarea ajena", userId: otroUsuario }, client);
    await createTask({ titulo: "Tarea propia", userId }, client);
    const found = await listTasks({ limit: 50, offset: 0, userId }, client);
    expect(found.length).toBe(1);
    expect(found[0].titulo).toBe("Tarea propia");
  });

  it("cuenta 0 cuando no quedan tareas no completadas", async () => {
    const t = await createTask({ titulo: "Hecha", userId }, client);
    await updateTask(t.id, { estado: "COMPLETADA" }, userId, client);
    expect(await countPendingTasks(userId, client)).toBe(0);
  });

  it("cuenta PENDIENTE y EN_PROCESO y excluye COMPLETADA", async () => {
    await createTask({ titulo: "Pendiente", userId }, client);
    const enProceso = await createTask({ titulo: "En proceso", userId }, client);
    await updateTask(enProceso.id, { estado: "EN_PROCESO" }, userId, client);
    const hecha = await createTask({ titulo: "Hecha", userId }, client);
    await updateTask(hecha.id, { estado: "COMPLETADA" }, userId, client);
    expect(await countPendingTasks(userId, client)).toBe(2);
  });

  it("no cuenta tareas de otro usuario", async () => {
    const otroUsuario = await createTestUser(client, "otro3@prueba.test");
    await createTask({ titulo: "Ajena", userId: otroUsuario }, client);
    await createTask({ titulo: "Propia", userId }, client);
    expect(await countPendingTasks(userId, client)).toBe(1);
  });

  it("cuenta todas las no completadas aunque superen la ventana del listado", async () => {
    for (let i = 0; i < 3; i += 1) {
      await createTask({ titulo: `Pendiente ${i}`, userId }, client);
    }
    const ventana = await listTasks({ limit: 1, offset: 0, userId }, client);
    expect(ventana).toHaveLength(1);
    expect(await countPendingTasks(userId, client)).toBe(3);
  });

  it("rechaza acceder a tarea de otro usuario", async () => {
    const otroUsuario = await createTestUser(client, "otro2@prueba.test");
    const ajena = await createTask({ titulo: "Tarea ajena", userId: otroUsuario }, client);
    await expect(getTask(ajena.id, userId, client)).rejects.toThrow("No autorizada");
    await expect(updateTask(ajena.id, { estado: "COMPLETADA" }, userId, client)).rejects.toThrow("No autorizada");
    await expect(deleteTask(ajena.id, userId, client)).rejects.toThrow("No autorizada");
  });
});
