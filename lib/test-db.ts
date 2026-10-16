import { PrismaClient } from "./generated/prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import { createClient } from "@libsql/client";

/**
 * Cliente Prisma para tests contra Turso.
 *
 * Requiere `TURSO_DATABASE_URL` y `TURSO_AUTH_TOKEN` en el entorno
 * (p. ej. `set -a; source .env; npm test`). Falla rápido si faltan para
 * no testear silenciosamente contra otra base de datos.
 *
 * Nota: `PrismaLibSQL` recibe la config libsql ({ url, authToken }),
 * no un cliente ya creado (el adapter crea el suyo internamente).
 */
export function newTestClient(): PrismaClient {
  const url = process.env.TURSO_DATABASE_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN;
  if (!url || !authToken) {
    throw new Error(
      "Tests contra Turso: faltan TURSO_DATABASE_URL y/o TURSO_AUTH_TOKEN en el entorno.",
    );
  }
  const adapter = new PrismaLibSql({ url, authToken });
  return new PrismaClient({ adapter });
}

/** Limpieza por tablas: deja la DB de test vacía sin recrearla. */
export async function cleanTasks(client: PrismaClient): Promise<void> {
  await client.task.deleteMany();
}
