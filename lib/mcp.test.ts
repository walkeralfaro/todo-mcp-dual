import { PrismaClient } from "@prisma/client";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import {
  MCP_TOOL_NAMES,
  mcpCreateTask,
  mcpDeleteTask,
  mcpGetTask,
  mcpListTasks,
  mcpUpdateTask,
} from "./mcp";
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

describe("MCP tools", () => {
  it("expone 5 tools clásicas", () => {
    expect([...MCP_TOOL_NAMES]).toEqual([
      "list_tasks",
      "get_task",
      "create_task",
      "update_task",
      "delete_task",
    ]);
  });

  it("responde formato { content: [{ type text }] } con JSON", async () => {
    const r = await mcpCreateTask({ titulo: "Via MCP" }, client);
    expect(r.content[0].type).toBe("text");
    const payload = JSON.parse(r.content[0].text);
    expect(payload.titulo).toBe("Via MCP");
  });

  it("ida y vuelta: crear -> get -> completar -> listar", async () => {
    const created = JSON.parse((await mcpCreateTask({ titulo: "IdaVuelta" }, client)).content[0].text);
    const fetched = JSON.parse((await mcpGetTask({ id: created.id }, client)).content[0].text);
    expect(fetched.id).toBe(created.id);
    const updated = JSON.parse(
      (await mcpUpdateTask({ id: created.id, estado: "COMPLETADA" }, client)).content[0].text,
    );
    expect(updated.estado).toBe("COMPLETADA");
    expect(updated.fechaCulminada).not.toBeNull();
    const listed = JSON.parse(
      (await mcpListTasks({ q: "IdaVuelta", limit: 50, offset: 0 }, client)).content[0].text,
    );
    expect(listed.length).toBeGreaterThanOrEqual(1);
  });

  it("limit mayor de 100 devuelve error controlado en español", async () => {
    const r = await mcpListTasks({ limit: 500 }, client);
    expect(r.isError).toBe(true);
  });

  it("id inexistente devuelve error controlado", async () => {
    const r = await mcpGetTask({ id: "no-existe" }, client);
    expect(r.isError).toBe(true);
    expect(r.content[0].text).toContain("no existe");
    const d = await mcpDeleteTask({ id: "no-existe" }, client);
    expect(d.isError).toBe(true);
  });

  it("título vacío no crea tarea", async () => {
    const r = await mcpCreateTask({ titulo: "" }, client);
    expect(r.isError).toBe(true);
  });
});
