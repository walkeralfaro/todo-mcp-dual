// Aplica el esquema Prisma a una DB Turso.
//
// El CLI `prisma db push` solo acepta `file:` (error P1012 con `libsql://`),
// asi que el DDL se genera con Prisma (`migrate diff --script`, fuente de
// verdad) y se ejecuta via `@libsql/client`. Idempotente: todo CREATE TABLE
// y CREATE [UNIQUE] INDEX queda IF NOT EXISTS.
//
// Tablas preexistentes desalineadas (p. ej. una "Task" anterior a auth, sin
// `userId`): por defecto el script falla alto anunciando las que diferencian
// del esquema; con `--recreate-outdated` las DROP+CREATE (opt-in: el mismo
// script corre en builds de Vercel y no debe borrar datos silenciosamente).
//
// Uso (nunca commitear credenciales, salen del entorno):
//   TURSO_DATABASE_URL="libsql://..." TURSO_AUTH_TOKEN="..." node scripts/apply-schema-turso.mjs
//   ... node scripts/apply-schema-turso.mjs --recreate-outdated  # drop de tablas desalineadas
// En el build se usa con --skip-if-missing: sin TURSO_* avisa y sale 0
// para no romper builds locales que usan SQLite en archivo.

import { execSync } from "node:child_process";
import { createClient } from "@libsql/client";

const skipIfMissing = process.argv.includes("--skip-if-missing");
const recreateOutdated = process.argv.includes("--recreate-outdated");
const url = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;

if (!url || !authToken) {
  if (skipIfMissing) {
    console.log("Sin TURSO_* en el entorno: se omite el esquema Turso.");
    process.exit(0);
  }
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
  "npx prisma migrate diff --from-empty --to-schema prisma/schema.prisma --script",
  { encoding: "utf8" },
);

// Idempotencia general: CREATE TABLE / CREATE [UNIQUE] INDEX -> IF NOT EXISTS.
const idempotent = sql
  .replace(/CREATE TABLE /g, "CREATE TABLE IF NOT EXISTS ")
  .replace(/CREATE (UNIQUE )?INDEX /g, "CREATE $1INDEX IF NOT EXISTS ");

const statements = idempotent
  .split("\n")
  .filter((line) => !line.trimStart().startsWith("--"))
  .join("\n")
  .split(";")
  .map((s) => s.trim())
  .filter(Boolean);

// Mapa tabla -> columnas esperadas, a partir del DDL generado:
// líneas del cuerpo con `"col" ...` (se excluyen CONSTRAINT/PRIMARY/etc.).
function tableOf(stmt) {
  const m = stmt.match(/CREATE TABLE IF NOT EXISTS "([^"]+)"/);
  return m ? m[1] : null;
}

function expectedColumns(stmt) {
  return stmt
    .split("\n")
    .map((line) => line.trim().replace(/,$/, ""))
    .filter(
      (line) =>
        /^"/.test(line) &&
        !/^(CONSTRAINT|FOREIGN|PRIMARY|UNIQUE|CHECK)/.test(line),
    )
    .map((line) => {
      const m = line.match(/^"([^"]+)"/);
      return m ? m[1] : null;
    })
    .filter(Boolean);
}

const client = createClient({ url, authToken });
try {
  // Detectar tablas existentes desalineadas con el esquema esperado.
  const creates = statements.filter((s) => s.startsWith("CREATE TABLE"));
  const outdated = [];
  for (const stmt of creates) {
    const table = tableOf(stmt);
    if (!table) continue;
    const info = await client.execute(`PRAGMA table_info("${table}")`);
    if (info.rows.length === 0) continue; // no existe: se creará
    const actual = info.rows.map((r) => String(r.name)).sort();
    const expected = expectedColumns(stmt).sort();
    const mismatch =
      actual.length !== expected.length ||
      actual.some((col, i) => col !== expected[i]);
    if (mismatch) outdated.push(table);
  }

  if (outdated.length > 0 && !recreateOutdated) {
    console.error(
      `Tablas con columnas distintas al esquema actual: ${outdated.join(", ")}.`,
    );
    console.error(
      "El script no borra datos por defecto. Si el entorno es de test y",
      "aceptas perder las filas de esas tablas, re-ejecuta con --recreate-outdated.",
    );
    process.exit(1);
  }

  const batch = [];
  for (const table of outdated) {
    console.warn(`RECREANDO tabla desalineada: ${table} (con --recreate-outdated)`);
    batch.push(`DROP TABLE IF EXISTS "${table}"`);
  }
  // Los DROP van primero; los CREATE TABLE/INDEX recrean lo borrado y
  // crean lo que no existía. batch() de libsql garantiza atomicidad.
  await client.batch([...batch, ...statements].map((s) => ({ sql: s })));

  const rs = await client.execute("SELECT count(*) AS n FROM Task");
  console.log(`OK esquema aplicado. Task count=${rs.rows[0].n}`);
} finally {
  client.close();
}
