import { execSync } from "node:child_process";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("next/headers", () => ({
  headers: vi.fn().mockResolvedValue(new Headers()),
}));
vi.mock("@/lib/auth", () => ({
  auth: {
    api: { getSession: vi.fn() },
  },
}));

let actions: typeof import("./actions");
let getSession: ReturnType<typeof vi.fn>;
let realUserId: string;

beforeAll(async () => {
  const dir = mkdtempSync(join(tmpdir(), "todo-mcp-actions-"));
  process.env.DATABASE_URL = `file:${join(dir, "test.db")}`;
  delete process.env.TURSO_DATABASE_URL;
  delete process.env.TURSO_AUTH_TOKEN;
  execSync("npx prisma db push", { env: process.env, stdio: "pipe" });
  actions = await import("./actions");
  const { auth } = await import("@/lib/auth");
  getSession = auth.api.getSession as any;
  const { db } = await import("@/lib/db");
  const user = await db.user.upsert({
    where: { email: "mcp-usuario-prueba@test.test" },
    update: {},
    create: { email: "mcp-usuario-prueba@test.test", name: "Usuario MCP" },
  });
  realUserId = user.id;
});

beforeEach(async () => {
  // Sesión de usuario autenticado por defecto y aislamiento entre tests.
  getSession.mockResolvedValue({ user: { id: realUserId } } as any);
  const { db } = await import("@/lib/db");
  await db.mcpToken.deleteMany();
});

describe("Server Actions de tokens MCP", () => {
  it("genera y lista tokens del usuario autenticado", async () => {
    const gen = await actions.generateMcpTokenAction();
    expect(gen.ok).toBe(true);
    if (!gen.ok) return;
    expect(gen.token).toMatch(/^tmcp_/);
    expect(gen.tokens).toHaveLength(1);
    expect(gen.tokens[0].tokenPrefix).toBe(gen.token.slice(0, 8));

    // En la DB solo queda el hash, nunca el valor en claro.
    const { db } = await import("@/lib/db");
    const rows = await db.mcpToken.findMany({ where: { userId: realUserId } });
    expect(rows).toHaveLength(1);
    expect(rows[0].token).not.toBe(gen.token);

    const list = await actions.listMcpTokensAction();
    expect(list.ok).toBe(true);
    if (list.ok) expect(list.tokens).toHaveLength(1);
  });

  it("sin sesión devuelve No autenticado", async () => {
    getSession.mockResolvedValue(null);
    const gen = await actions.generateMcpTokenAction();
    const list = await actions.listMcpTokensAction();
    const rev = await actions.revokeMcpTokenAction("cualquiera");
    expect(gen).toEqual({ ok: false, error: "No autenticado" });
    expect(list).toEqual({ ok: false, error: "No autenticado" });
    expect(rev).toEqual({ ok: false, error: "No autenticado" });
  });

  it("un usuario no puede revocar tokens ajenos", async () => {
    const { db } = await import("@/lib/db");
    const otro = await db.user.upsert({
      where: { email: "mcp-otro@test.test" },
      update: {},
      create: { email: "mcp-otro@test.test" },
    });
    const ajeno = await db.mcpToken.create({
      data: { token: "hash-ajeno", userId: otro.id },
    });

    const rev = await actions.revokeMcpTokenAction(ajeno.id);
    expect(rev.ok).toBe(false);
    const sigue = await db.mcpToken.findUnique({ where: { id: ajeno.id } });
    expect(sigue).not.toBeNull();
  });

  it("revoca el token propio", async () => {
    const gen = await actions.generateMcpTokenAction();
    expect(gen.ok).toBe(true);
    if (!gen.ok) return;

    const rev = await actions.revokeMcpTokenAction(gen.tokens[0].id);
    expect(rev.ok).toBe(true);
    if (rev.ok) expect(rev.tokens).toHaveLength(0);

    const list = await actions.listMcpTokensAction();
    if (list.ok) expect(list.tokens).toHaveLength(0);
  });
});
