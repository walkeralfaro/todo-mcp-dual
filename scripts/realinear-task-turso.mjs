// Reparacion puntual (one-off) de la tabla `Task` cuando quedo desalineada
// respecto al esquema actual (p. ej. anterior a auth, sin `userId`).
//
// El aplicador de esquema del build (`apply-schema-turso.mjs`) es no destructivo
// y no puede resolver esa desalineacion: `userId` es NOT NULL sin DEFAULT, asi
// que no es aplicable con ALTER y alli falla alto. Este script es el paso
// manual y consciente que la recompone.
//
// NO se ejecuta desde el build.
//
// Uso (credenciales del entorno, nunca en el repo):
//   TURSO_DATABASE_URL="libsql://..." TURSO_AUTH_TOKEN="..." node scripts/realinear-task-turso.mjs
//   ... --accept-loss   # obligatorio si la tabla tiene filas
// Contra una copia local (verificacion):
//   node scripts/realinear-task-turso.mjs --url "file:/ruta/copia.db"

import { pathToFileURL } from "node:url";
import { createClient } from "@libsql/client";
import { generateStatements } from "./apply-schema-turso.mjs";

const DEFAULT_LOG = console.log;

/**
 * Recompone `Task` con el esquema actual si (y solo si) existe y le falta
 * `userId`. Con filas exige `acceptLoss` porque no hay usuario al que
 * asignarlas. Devuelve el resultado; lanza si no puede proceder.
 */
export async function realinearTask({
  url,
  authToken = undefined,
  acceptLoss = false,
  log = DEFAULT_LOG,
}) {
  const client = createClient({ url, authToken });
  try {
    const info = await client.execute('PRAGMA table_info("Task")');
    if (info.rows.length === 0) {
      log("No existe la tabla Task: no hay nada que realinear.");
      return { status: "sin-tabla" };
    }

    const columns = info.rows.map((row) => String(row.name));
    if (columns.includes("userId")) {
      log("La tabla Task ya tiene userId: no hay nada que realinear.");
      return { status: "ya-alineada" };
    }

    const before = await client.execute("SELECT count(*) AS n FROM Task");
    const rows = Number(before.rows[0].n);
    if (rows > 0 && !acceptLoss) {
      throw new Error(
        `La tabla Task tiene ${rows} fila(s) y userId es obligatorio; no hay usuario ` +
          "al que asignarlas. Reintenta con --accept-loss si aceptas perderlas.",
      );
    }

    // DDL actual solo para Task: su CREATE TABLE y sus indices.
    const statements = generateStatements().filter((sql) => sql.includes('"Task"'));

    await client.batch(
      [`DROP TABLE IF EXISTS "Task"`, ...statements].map((sql) => ({ sql })),
    );

    const after = await client.execute("SELECT count(*) AS n FROM Task");
    log(`Task realineada. Filas antes=${rows} despues=${after.rows[0].n}`);
    return { status: "realineada", before: rows, after: Number(after.rows[0].n) };
  } finally {
    client.close();
  }
}

function resolveTarget() {
  const flagIndex = process.argv.indexOf("--url");
  const urlFromFlag = flagIndex !== -1 ? process.argv[flagIndex + 1] : undefined;
  if (urlFromFlag) {
    return { url: urlFromFlag, authToken: process.env.TURSO_AUTH_TOKEN };
  }

  const url = process.env.TURSO_DATABASE_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN;
  if (!url || !authToken) {
    return {
      error:
        "Faltan TURSO_DATABASE_URL y/o TURSO_AUTH_TOKEN (o pasa --url para una copia local).",
    };
  }
  if (!url.startsWith("libsql:")) {
    return {
      error:
        "Por seguridad este script solo acepta URLs libsql:// del entorno; usa --url para un archivo local.",
    };
  }
  return { url, authToken };
}

async function main() {
  const target = resolveTarget();
  if (target.error) {
    console.error(target.error);
    return 1;
  }

  try {
    const result = await realinearTask({
      url: target.url,
      authToken: target.authToken,
      acceptLoss: process.argv.includes("--accept-loss"),
    });
    if (result.status === "realineada") {
      console.log(
        "Siguiente paso: `node scripts/apply-schema-turso.mjs` con TURSO_* para crear el resto del esquema.",
      );
    }
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
