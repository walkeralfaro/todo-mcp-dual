import { execSync } from "node:child_process";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

/** Sesión mínima que consumen las Server Actions (`session?.user?.id`). */
type SessionLike = { user: { id: string } } | null;

// Mock hoisted: la misma instancia que ve el módulo de auth y el test.
const { getSession } = vi.hoisted(() => ({
  getSession: vi.fn<() => Promise<{ user: { id: string } } | null>>(),
}));

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("next/headers", () => ({
  headers: vi.fn().mockResolvedValue(new Headers()),
}));
vi.mock("@/lib/auth", () => ({
  auth: {
    api: { getSession },
  },
}));
// El servicio de tareas se envuelve para poder simular un fallo interno sin
// renunciar a la implementación real en el resto de los casos.
vi.mock("@/lib/tasks", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/tasks")>();
  return { ...actual, createTask: vi.fn(actual.createTask) };
});

let actions: typeof import("./actions");
let realUserId: string;

beforeAll(async () => {
  const dir = mkdtempSync(join(tmpdir(), "todo-actions-"));
  process.env.DATABASE_URL = `file:${join(dir, "test.db")}`;
  delete process.env.TURSO_DATABASE_URL;
  delete process.env.TURSO_AUTH_TOKEN;
  execSync("npx prisma db push", { env: process.env, stdio: "pipe" });
  actions = await import("./actions");
  const { db } = await import("@/lib/db");
  await db.user.upsert({
    where: { email: "usuario-prueba@test.test" },
    update: {},
    create: { email: "usuario-prueba@test.test", name: "Usuario Prueba" },
  });
  // Alinea el id de sesión mock con el usuario real de la DB.
  const user = await db.user.findUnique({ where: { email: "usuario-prueba@test.test" } });
  realUserId = user!.id;
  getSession.mockResolvedValue({ user: { id: realUserId } } satisfies SessionLike);
});

beforeEach(() => {
  // Sesión de usuario autenticado por defecto.
  getSession.mockResolvedValue({ user: { id: realUserId } } satisfies SessionLike);
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

  it("crear con título vacío devuelve el mensaje del esquema en español", async () => {
    const r = await actions.createTaskAction(fd({ titulo: "" }));
    expect(r).toEqual({ ok: false, error: "El título es obligatorio" });
  });

  it("crear con 101 caracteres devuelve el mensaje de máximo, no el JSON de Zod", async () => {
    const r = await actions.createTaskAction(fd({ titulo: "a".repeat(101) }));
    expect(r).toEqual({ ok: false, error: "Máximo 100 caracteres" });
  });

  it("un fallo interno responde genérico y no filtra el detalle al cliente", async () => {
    const { createTask } = await import("@/lib/tasks");
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    vi.mocked(createTask).mockRejectedValueOnce(
      new Error("SQLITE_ERROR: no such table: main.task"),
    );

    const r = await actions.createTaskAction(fd({ titulo: "Tarea válida" }));

    expect(r.ok).toBe(false);
    const error = (r as { ok: false; error: string }).error;
    expect(error).toContain("No se pudo completar la operación");
    expect(error).not.toContain("SQLITE_ERROR");
    // El detalle queda registrado solo en el servidor.
    expect(log).toHaveBeenCalledWith(
      "[tareas] fallo interno en la Server Action:",
      expect.any(Error),
    );
    log.mockRestore();
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
    expect(upd).toEqual({ ok: false, error: "No autorizada" });
    const del = await actions.deleteTaskAction(ajena.id);
    expect(del).toEqual({ ok: false, error: "No autorizada" });
  });

  it("una tarea inexistente conserva su mensaje de negocio", async () => {
    const r = await actions.updateTaskAction("no-existe", fd({ estado: "COMPLETADA" }));
    expect(r).toEqual({ ok: false, error: "La tarea no existe" });
  });
});
