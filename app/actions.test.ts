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
  const dir = mkdtempSync(join(tmpdir(), "todo-actions-"));
  process.env.DATABASE_URL = `file:${join(dir, "test.db")}`;
  delete process.env.TURSO_DATABASE_URL;
  delete process.env.TURSO_AUTH_TOKEN;
  execSync("npx prisma db push", { env: process.env, stdio: "pipe" });
  actions = await import("./actions");
  const { auth } = await import("@/lib/auth");
  getSession = auth.api.getSession as any;
  const { db } = await import("@/lib/db");
  await db.user.upsert({
    where: { email: "usuario-prueba@test.test" },
    update: {},
    create: { email: "usuario-prueba@test.test", name: "Usuario Prueba" },
  });
  // Alinea el id de sesión mock con el usuario real de la DB.
  const user = await db.user.findUnique({ where: { email: "usuario-prueba@test.test" } });
  realUserId = user!.id;
  getSession.mockResolvedValue({ user: { id: realUserId } } as any);
});

beforeEach(() => {
  // Sesión de usuario autenticado por defecto.
  getSession.mockResolvedValue({ user: { id: realUserId } } as any);
});

function fd(pairs: Record<string, string>) {
  const d = new FormData();
  for (const [k, v] of Object.entries(pairs)) d.set(k, v);
  return d;
}

describe("Server Actions", () => {
  it("crear válido devuelve ok:true", async () => {
    const r = await actions.createTaskAction(fd({ titulo: "Desde UI" }));
    expect(r).toEqual({ ok: true });
  });

  it("sin sesión devuelve error de autenticación", async () => {
    getSession.mockResolvedValueOnce(null);
    const r = await actions.createTaskAction(fd({ titulo: "Sin sesión" }));
    expect(r.ok).toBe(false);
    expect((r as { ok: false; error: string }).error).toContain("No autenticado");
  });

  it("crear con título vacío devuelve error en español", async () => {
    const r = await actions.createTaskAction(fd({ titulo: "" }));
    expect(r.ok).toBe(false);
  });

  it("actualizar y borrar fluyen sin error", async () => {
    await actions.createTaskAction(fd({ titulo: "Temporal" }));
    const { db } = await import("@/lib/db");
    const found = await db.task.findFirst({ where: { titulo: "Temporal" } });
    expect(found).not.toBeNull();
    const upd = await actions.updateTaskAction(found!.id, fd({ estado: "COMPLETADA" }));
    expect(upd).toEqual({ ok: true });
    const del = await actions.deleteTaskAction(found!.id);
    expect(del).toEqual({ ok: true });
  });

  it("no puede acceder a tarea de otro usuario", async () => {
    const { db } = await import("@/lib/db");
    const otro = await db.user.create({ data: { email: "otro@test.test" } });
    const ajena = await db.task.create({ data: { titulo: "Ajena", userId: otro.id } });
    const upd = await actions.updateTaskAction(ajena.id, fd({ estado: "COMPLETADA" }));
    expect(upd.ok).toBe(false);
    const del = await actions.deleteTaskAction(ajena.id);
    expect(del.ok).toBe(false);
  });
});
