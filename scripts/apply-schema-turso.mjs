// Aplica el esquema Prisma a una DB Turso de forma NO destructiva.
//
// El CLI `prisma db push` / `prisma migrate` solo acepta `file:` (error P1012
// con `libsql://`), asi que el DDL se genera con Prisma (`migrate diff
// --script`, fuente de verdad) y se ejecuta via `@libsql/client`.
//
// Politica (ver openspec/changes/endurecer-esquema-turso-no-destructivo):
//   1. Crea lo que falta: todo CREATE TABLE/INDEX del DDL queda IF NOT EXISTS.
//   2. Aplica lo aditivo: a una tabla existente le anade las columnas que
//      falten y sean aplicables sin perdida (opcionales o con DEFAULT).
//   3. Falla alto con diagnostico si la desalineacion no es aditiva (p. ej.
//      una columna NOT NULL sin DEFAULT); en ese caso no modifica nada.
// El script no borra tablas: no existe ningun camino de borrado.
//
// Uso (nunca commitear credenciales, salen del entorno):
//   TURSO_DATABASE_URL="libsql://..." TURSO_AUTH_TOKEN="..." node scripts/apply-schema-turso.mjs
// En el build se usa con --skip-if-missing: sin TURSO_* avisa y sale 0
// para no romper builds locales que usan SQLite en archivo.

import { execSync } from "node:child_process";
import { pathToFileURL } from "node:url";
import { createClient } from "@libsql/client";

const DEFAULT_LOG = console.log;

export class SchemaDriftError extends Error {
  constructor(tables) {
    const details = tables
      .map(({ table, columns }) => {
        const list = columns
          .map(({ name, definition }) => `"${name}" (${definition})`)
          .join(", ");
        return `  - ${table}: falta ${list}`;
      })
      .join("\n");
    super(
      "Desalineacion estructural: hay tablas que no se pueden alinear sin perder datos.\n" +
        `${details}\n` +
        "Aplica una migracion manual y reintenta (ver README > Troubleshooting).",
    );
    this.name = "SchemaDriftError";
    this.tables = tables;
  }
}

// DDL de `prisma migrate diff` (fuente de verdad) con todo CREATE ... IF NOT EXISTS.
export function generateStatements() {
  const sql = execSync(
    "npx prisma migrate diff --from-empty --to-schema prisma/schema.prisma --script",
    { encoding: "utf8" },
  );
  const idempotent = sql
    .replace(/CREATE TABLE /g, "CREATE TABLE IF NOT EXISTS ")
    .replace(/CREATE (UNIQUE )?INDEX /g, "CREATE $1INDEX IF NOT EXISTS ");
  return idempotent
    .split("\n")
    .filter((line) => !line.trimStart().startsWith("--"))
    .join("\n")
    .split(";")
    .map((statement) => statement.trim())
    .filter(Boolean);
}

function tableOf(statement) {
  const match = statement.match(/CREATE TABLE IF NOT EXISTS "([^"]+)"/);
  return match ? match[1] : null;
}

// Mapa columna -> definicion (`"col" TIPO ...`) tomado del CREATE TABLE.
function expectedColumnDefs(statement) {
  const defs = new Map();
  for (const raw of statement.split("\n")) {
    const line = raw.trim().replace(/,$/, "");
    if (!/^"/.test(line)) continue;
    const match = line.match(/^"([^"]+)"\s+(.*)$/);
    if (match) defs.set(match[1], line);
  }
  return defs;
}

// ALTER TABLE ... ADD COLUMN exige que la columna sea opcional o tenga DEFAULT,
// y SQLite no permite anadir PRIMARY KEY/UNIQUE/REFERENCES por ALTER.
function isAdditive(definition) {
  if (/PRIMARY KEY|UNIQUE|REFERENCES/i.test(definition)) return false;
  if (!/NOT NULL/i.test(definition)) return true;
  return /DEFAULT/i.test(definition);
}

/**
 * Alinea la DB apuntada por `url` con `prisma/schema.prisma` sin destruir datos.
 * Devuelve un resumen; lanza SchemaDriftError si no puede alinear de forma aditiva.
 */
export async function applySchema({ url, authToken = undefined, log = DEFAULT_LOG }) {
  const statements = generateStatements();
  const creates = statements.filter((statement) => statement.startsWith("CREATE TABLE"));

  const client = createClient({ url, authToken });
  try {
    const alters = [];
    const drift = [];
    const extras = [];

    for (const statement of creates) {
      const table = tableOf(statement);
      if (!table) continue;
      const info = await client.execute(`PRAGMA table_info("${table}")`);
      if (info.rows.length === 0) continue; // no existe: la crea el CREATE TABLE

      const actual = new Set(info.rows.map((row) => String(row.name)));
      const defs = expectedColumnDefs(statement);
      const missing = [];

      for (const [name, definition] of defs) {
        if (actual.has(name)) continue;
        if (isAdditive(definition)) {
          alters.push(`ALTER TABLE "${table}" ADD COLUMN ${definition}`);
          log(`Anadiendo columna ${table}.${name}`);
        } else {
          missing.push({ name, definition });
        }
      }
      if (missing.length > 0) drift.push({ table, columns: missing });

      // Las columnas de mas no rompen a Prisma: se avisan y se dejan intactas.
      const unexpected = [...actual].filter((name) => !defs.has(name));
      if (unexpected.length > 0) extras.push(`${table}: ${unexpected.join(", ")}`);
    }

    // Nada se ejecuta si hay drift: la DB queda exactamente como estaba.
    if (drift.length > 0) throw new SchemaDriftError(drift);

    // Los ALTER van antes que los CREATE INDEX del DDL: un indice puede
    // referenciar una columna recien anadida. batch() es atomico.
    await client.batch([...alters, ...statements].map((sql) => ({ sql })));

    if (extras.length > 0) {
      log(`Columnas extra (Prisma las ignora, se dejan intactas): ${extras.join(" | ")}`);
    }

    const count = await client.execute("SELECT count(*) AS n FROM Task");
    log(`OK esquema aplicado. Task count=${count.rows[0].n}`);
    return { addedColumns: alters.length, createdTables: creates.length };
  } finally {
    client.close();
  }
}

async function main() {
  const skipIfMissing = process.argv.includes("--skip-if-missing");
  const url = process.env.TURSO_DATABASE_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN;

  if (!url || !authToken) {
    if (skipIfMissing) {
      console.log("Sin TURSO_* en el entorno: se omite el esquema Turso.");
      return 0;
    }
    console.error("Faltan TURSO_DATABASE_URL y/o TURSO_AUTH_TOKEN en el entorno.");
    return 1;
  }

  if (!url.startsWith("libsql:")) {
    console.error("Por seguridad este script solo acepta URLs libsql:// (Turso).");
    return 1;
  }

  try {
    await applySchema({ url, authToken });
    return 0;
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    return 1;
  }
}

const isCli = (() => {
  const entry = process.argv[1];
  if (!entry) return false;
  try {
    return import.meta.url === pathToFileURL(entry).href;
  } catch {
    return false;
  }
})();

if (isCli) process.exitCode = await main();
