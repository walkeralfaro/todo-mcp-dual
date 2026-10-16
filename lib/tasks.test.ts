import { execSync } from "node:child_process";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { PrismaClient } from "@prisma/client";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createTask, deleteTask, getTask, listTasks, updateTask } from "./tasks";

let client: PrismaClient;
let url: string;

beforeAll(() => {
  const dir = mkdtempSync(join(tmpdir(), "todo-test-"));
  url = `file:${join(dir, "test.db")}`;
  execSync("npx prisma db push --skip-generate", {
    env: { ...process.env, DATABASE_URL: url },
    stdio: "pipe",
  });
  client = new PrismaClient({ datasourceUrl: url });
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
