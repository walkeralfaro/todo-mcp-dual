import { afterAll, describe, expect, it } from "vitest";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createClient } from "@libsql/client";
import { applySchema, SchemaDriftError } from "./apply-schema-turso.mjs";

// Tests herméticos: DBs libsql `file:` temporales, sin Turso ni red.
const tempDirs: string[] = [];

function tempDb(): string {
  const dir = mkdtempSync(join(tmpdir(), "apply-schema-"));
  tempDirs.push(dir);
  return `file:${join(dir, "test.db")}`;
}

afterAll(() => {
  for (const dir of tempDirs) rmSync(dir, { recursive: true, force: true });
});

// Task anterior a auth: 6 columnas, sin `userId`.
const LEGACY_TASK = `CREATE TABLE "Task" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "titulo" TEXT NOT NULL,
    "descripcion" TEXT,
    "estado" TEXT NOT NULL DEFAULT 'PENDIENTE',
    "fechaCreacion" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fechaCulminada" DATETIME
  )`;

describe("applySchema", () => {
  it("crea las tablas ausentes con el esquema actual", async () => {
    const url = tempDb();
    await applySchema({ url, log: () => {} });

    const client = createClient({ url });
    try {
      const tables = await client.execute(
        "SELECT name FROM sqlite_master WHERE type = 'table'",
      );
      const names = tables.rows.map((row) => String(row.name));
      expect(names).toEqual(
        expect.arrayContaining([
          "user",
          "session",
          "account",
          "verification",
          "Task",
          "mcp_token",
        ]),
      );

      const task = await client.execute('PRAGMA table_info("Task")');
      expect(task.rows.map((row) => String(row.name))).toContain("userId");

      const count = await client.execute("SELECT count(*) AS n FROM Task");
      expect(Number(count.rows[0].n)).toBe(0);
    } finally {
      client.close();
    }
  });

  it("no toca un esquema alineado ni pierde filas", async () => {
    const url = tempDb();
    await applySchema({ url, log: () => {} });

    const client = createClient({ url });
    try {
      await client.execute(
        `INSERT INTO "user" ("id","email","updatedAt") VALUES ('u1','u1@test.test', CURRENT_TIMESTAMP)`,
      );
      await client.execute(
        `INSERT INTO "Task" ("id","titulo","userId") VALUES ('t1','Tarea','u1')`,
      );

      const lines: string[] = [];
      await applySchema({ url, log: (message: unknown) => lines.push(String(message)) });

      expect(lines.some((line) => line.startsWith("Anadiendo columna"))).toBe(false);

      const tasks = await client.execute("SELECT count(*) AS n FROM Task");
      expect(Number(tasks.rows[0].n)).toBe(1);
      const users = await client.execute(`SELECT count(*) AS n FROM "user"`);
      expect(Number(users.rows[0].n)).toBe(1);
    } finally {
      client.close();
    }
  });

  it("anade una columna aditiva sin perder filas", async () => {
    const url = tempDb();
    await applySchema({ url, log: () => {} });

    const client = createClient({ url });
    try {
      // Escenario real de `mcp_token.tokenPrefix`: la columna se anadio despues.
      await client.execute(
        `INSERT INTO "user" ("id","email","updatedAt") VALUES ('u1','u1@test.test', CURRENT_TIMESTAMP)`,
      );
      await client.execute(
        `INSERT INTO "mcp_token" ("id","token","userId") VALUES ('m1','hash','u1')`,
      );
      await client.execute('ALTER TABLE "mcp_token" DROP COLUMN "tokenPrefix"');

      const lines: string[] = [];
      await applySchema({ url, log: (message: unknown) => lines.push(String(message)) });

      expect(lines).toContain("Anadiendo columna mcp_token.tokenPrefix");

      const info = await client.execute('PRAGMA table_info("mcp_token")');
      expect(info.rows.map((row) => String(row.name))).toContain("tokenPrefix");

      const rows = await client.execute('SELECT "id","token" FROM "mcp_token"');
      expect(rows.rows).toHaveLength(1);
      expect(String(rows.rows[0].token)).toBe("hash");
    } finally {
      client.close();
    }
  });

  it("falla ante una Task legacy sin userId y no modifica nada", async () => {
    const url = tempDb();
    const client = createClient({ url });
    try {
      await client.execute(LEGACY_TASK);
      await client.execute(`INSERT INTO "Task" ("id","titulo") VALUES ('legacy','Vieja')`);

      const error = await applySchema({ url, log: () => {} }).catch(
        (reason: unknown) => reason,
      );

      expect(error).toBeInstanceOf(SchemaDriftError);
      expect((error as Error).message).toContain("Task");
      expect((error as Error).message).toContain("userId");

      const info = await client.execute('PRAGMA table_info("Task")');
      const columns = info.rows.map((row) => String(row.name)).sort();
      expect(columns).toEqual([
        "descripcion",
        "estado",
        "fechaCreacion",
        "fechaCulminada",
        "id",
        "titulo",
      ]);

      const rows = await client.execute(`SELECT count(*) AS n FROM "Task"`);
      expect(Number(rows.rows[0].n)).toBe(1);

      // No se ejecuto ningun DDL: las tablas de auth siguen sin existir.
      const user = await client.execute(
        `SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'user'`,
      );
      expect(user.rows).toHaveLength(0);
    } finally {
      client.close();
    }
  });
});
