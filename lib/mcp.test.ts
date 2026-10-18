import { PrismaClient } from "./generated/prisma/client";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import {
  MCP_TOOL_NAMES,
  mcpCreateTask,
  mcpDeleteTask,
  mcpGetTask,
  mcpListTasks,
  mcpUpdateTask,
} from "./mcp";
import { cleanTasks, createTestUser, newTestClient } from "./test-db";

describe("registro de herramientas MCP", () => {
  it("expone 5 tools clásicas", () => {
    expect([...MCP_TOOL_NAMES]).toEqual([
      "list_tasks",
      "get_task",
      "create_task",
      "update_task",
      "delete_task",
    ]);
  });
});

describe("MCP tools", () => {
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

  it("responde formato { content: [{ type text }] } con JSON", async () => {
    const r = await mcpCreateTask({ titulo: "Via MCP", userId }, client);
    expect(r.content[0].type).toBe("text");
    const payload = JSON.parse(r.content[0].text);
    expect(payload.titulo).toBe("Via MCP");
    expect(payload.userId).toBe(userId);
  });

  it("ida y vuelta: crear -> get -> completar -> listar", async () => {
    const created = JSON.parse(
      (await mcpCreateTask({ titulo: "IdaVuelta", userId }, client)).content[0].text,
    );
    const fetched = JSON.parse((await mcpGetTask({ id: created.id, userId }, client)).content[0].text);
    expect(fetched.id).toBe(created.id);
    const updated = JSON.parse(
      (await mcpUpdateTask({ id: created.id, estado: "COMPLETADA", userId }, client)).content[0].text,
    );
    expect(updated.estado).toBe("COMPLETADA");
    expect(updated.fechaCulminada).not.toBeNull();
    const listed = JSON.parse(
      (await mcpListTasks({ q: "IdaVuelta", limit: 50, offset: 0, userId }, client)).content[0].text,
    );
    expect(listed.length).toBeGreaterThanOrEqual(1);
    expect(listed.every((t: { userId: string }) => t.userId === userId)).toBe(true);
  });

  it("limit mayor de 100 devuelve error controlado en español", async () => {
    const r = await mcpListTasks({ limit: 500 }, client);
    expect(r.isError).toBe(true);
  });

  it("id inexistente devuelve error controlado", async () => {
    const r = await mcpGetTask({ id: "no-existe", userId }, client);
    expect(r.isError).toBe(true);
    expect(r.content[0].text).toContain("no existe");
    const d = await mcpDeleteTask({ id: "no-existe", userId }, client);
    expect(d.isError).toBe(true);
  });

  it("título vacío no crea tarea", async () => {
    const r = await mcpCreateTask({ titulo: "", userId }, client);
    expect(r.isError).toBe(true);
  });

  it("sin userId no crea tarea (no autenticado)", async () => {
    const r = await mcpCreateTask({ titulo: "Sin usuario" }, client);
    expect(r.isError).toBe(true);
    // Mensaje de negocio preservado: la spec exige un error de autenticación.
    expect(r.content[0].text).toContain("No autenticado");
  });

  it("un fallo interno devuelve error genérico sin filtrar el detalle", async () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    const spy = vi
      .spyOn(client.task, "create")
      .mockRejectedValueOnce(new Error("P2021: table main.task does not exist"));

    const r = await mcpCreateTask({ titulo: "Fallo interno", userId }, client);

    expect(r.isError).toBe(true);
    expect(r.content[0].text).toContain("No se pudo completar la operación");
    expect(r.content[0].text).not.toContain("P2021");
    // El detalle queda solo en el log del servidor.
    expect(log).toHaveBeenCalledWith("[mcp] fallo interno en la tool:", expect.any(Error));

    spy.mockRestore();
    log.mockRestore();
  });

  it("solo titulo deja descripcion nula sin duplicar", async () => {
    const r = await mcpCreateTask({ titulo: "Solo titulo", userId }, client);
    expect(r.isError).toBeFalsy();
    const payload = JSON.parse(r.content[0].text);
    expect(payload.titulo).toBe("Solo titulo");
    expect(payload.descripcion).toBeNull();
  });

  it("descripcion explicita se conserva tal cual", async () => {
    const r = await mcpCreateTask({ titulo: "Con desc", descripcion: "Detalle dado", userId }, client);
    expect(r.isError).toBeFalsy();
    const payload = JSON.parse(r.content[0].text);
    expect(payload.descripcion).toBe("Detalle dado");
  });
});
