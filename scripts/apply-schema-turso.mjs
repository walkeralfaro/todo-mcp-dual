// Aplica el esquema Prisma a una DB Turso.
//
// El CLI `prisma db push` solo acepta `file:` (error P1012 con `libsql://`),
// asi que el DDL se genera con Prisma (`migrate diff --script`, fuente de
// verdad) y se ejecuta via `@libsql/client`. Idempotente (`IF NOT EXISTS`).
//
// Uso (nunca commitear credenciales, salen del entorno):
//   TURSO_DATABASE_URL="libsql://..." TURSO_AUTH_TOKEN="..." node scripts/apply-schema-turso.mjs

import { execSync } from "node:child_process";
import { createClient } from "@libsql/client";

const url = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;

if (!url || !authToken) {
  console.error(
    "Faltan TURSO_DATABASE_URL y/o TURSO_AUTH_TOKEN en el entorno.",
  );
  process.exit(1);
}

if (!url.startsWith("libsql:")) {
  console.error(
    "Por seguridad este script solo acepta URLs libsql:// (Turso).",
  );
  process.exit(1);
}

const sql = execSync(
  "npx prisma migrate diff --from-empty --to-schema-datamodel prisma/schema.prisma --script",
  { encoding: "utf8" },
);

const idempotent = sql
  .replace('CREATE TABLE "Task"', 'CREATE TABLE IF NOT EXISTS "Task"')
  .replace("CREATE INDEX ", "CREATE INDEX IF NOT EXISTS ");

const statements = idempotent
  .split("\n")
  .filter((line) => !line.trimStart().startsWith("--"))
  .join("\n")
  .split(";")
  .map((s) => s.trim())
  .filter(Boolean);

const client = createClient({ url, authToken });
try {
  await client.batch(statements.map((s) => ({ sql: s })));
  const rs = await client.execute("SELECT count(*) AS n FROM Task");
  console.log(`OK esquema aplicado. Task count=${rs.rows[0].n}`);
} finally {
  client.close();
}
