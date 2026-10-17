import { createHash } from "node:crypto";
import { PrismaClient } from "./generated/prisma/client";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { cleanTasks, createTestUser, newTestClient } from "./test-db";
import {
  createMcpToken,
  listMcpTokens,
  MCP_TOKEN_DEFAULT_EXPIRY_DAYS,
  revokeMcpToken,
} from "./mcp-tokens";

let client: PrismaClient;
let userId: string;

beforeAll(() => {
  // La DB de test de Turso ya tiene el esquema con `tokenPrefix`
  // (scripts/apply-schema-turso.mjs, columna aditiva idempotente).
  client = newTestClient();
});

beforeEach(async () => {
  await cleanTasks(client);
  userId = await createTestUser(client);
});

afterAll(async () => {
  await client.$disconnect();
});

describe("esquema McpToken.tokenPrefix", () => {
  it("persiste y se lee de vuelta el prefijo", async () => {
    await client.mcpToken.create({
      data: { token: "hash-de-prueba", tokenPrefix: "tmcp_ab1", userId },
    });
    const rows = await client.mcpToken.findMany({ where: { userId } });
    expect(rows).toHaveLength(1);
    expect(rows[0].tokenPrefix).toBe("tmcp_ab1");
  });

  it("acepta prefijo nulo para tokens preexistentes", async () => {
    await client.mcpToken.create({ data: { token: "hash-viejo", userId } });
    const row = await client.mcpToken.findUnique({
      where: { token: "hash-viejo" },
    });
    expect(row?.tokenPrefix).toBeNull();
  });
});

describe("servicio de tokens MCP (lib/mcp-tokens)", () => {
  it("genera tmcp_ de 256 bits y persiste solo el hash y el prefijo", async () => {
    const { token, record } = await createMcpToken(userId, client);

    expect(token).toMatch(/^tmcp_[A-Za-z0-9_-]{43}$/);
    expect(record.token).toBe(
      createHash("sha256").update(token).digest("hex"),
    );
    expect(record.token).not.toContain(token);
    expect(record.tokenPrefix).toBe(token.slice(0, 8));

    const rows = await client.mcpToken.findMany({ where: { userId } });
    expect(rows).toHaveLength(1);
    // El valor en claro nunca llega a la base de datos.
    expect(rows[0].token).not.toBe(token);
    expect(rows[0].tokenPrefix).not.toBe(token);
  });

  it("expira a los 90 días por defecto", async () => {
    const { record } = await createMcpToken(userId, client);
    expect(record.expiresAt).not.toBeNull();
    const esperado =
      Date.now() + MCP_TOKEN_DEFAULT_EXPIRY_DAYS * 24 * 60 * 60 * 1000;
    expect(Math.abs(record.expiresAt!.getTime() - esperado)).toBeLessThan(
      60_000,
    );
  });

  it("lista solo los tokens del usuario, del más reciente al más antiguo", async () => {
    const otro = await createTestUser(client, "otro-tokens@prueba.test");
    await createMcpToken(userId, client);
    await new Promise((resolve) => setTimeout(resolve, 10));
    await createMcpToken(userId, client);
    await createMcpToken(otro, client);

    const rows = await listMcpTokens(userId, client);
    expect(rows).toHaveLength(2);
    expect(rows.every((t) => t.userId === userId)).toBe(true);
    expect(rows[0].createdAt.getTime()).toBeGreaterThanOrEqual(
      rows[1].createdAt.getTime(),
    );
  });

  it("revoca un token propio", async () => {
    const { record } = await createMcpToken(userId, client);
    await revokeMcpToken(record.id, userId, client);
    expect(await listMcpTokens(userId, client)).toHaveLength(0);
  });

  it("no permite revocar tokens ajenos ni inexistentes", async () => {
    const otro = await createTestUser(client, "otro-revoke@prueba.test");
    const { record } = await createMcpToken(userId, client);

    await expect(revokeMcpToken(record.id, otro, client)).rejects.toThrow(
      "No se pudo revocar el token",
    );
    await expect(revokeMcpToken("no-existe", userId, client)).rejects.toThrow(
      "No se pudo revocar el token",
    );
    expect(await listMcpTokens(userId, client)).toHaveLength(1);
  });

  it("rechaza id vacío con mensaje en español", async () => {
    await expect(revokeMcpToken("   ", userId, client)).rejects.toThrow(
      "El id del token es obligatorio",
    );
  });
});
