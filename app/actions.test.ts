import { execSync } from "node:child_process";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { beforeAll, describe, expect, it, vi } from "vitest";

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

let actions: typeof import("./actions");

beforeAll(async () => {
  const dir = mkdtempSync(join(tmpdir(), "todo-actions-"));
  process.env.DATABASE_URL = `file:${join(dir, "test.db")}`;
  // Este spec queda aislado en archivo local: sin esto, lib/db.ts preferiría
  // Turso si TURSO_* está en el entorno y contaminaría la DB de test compartida.
  delete process.env.TURSO_DATABASE_URL;
  delete process.env.TURSO_AUTH_TOKEN;
  execSync("npx prisma db push --skip-generate", {
    env: process.env,
    stdio: "pipe",
  });
  actions = await import("./actions");
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
});
