import { PrismaClient } from "./generated/prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";

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

/** Limpieza por tablas: deja la DB de test vacía sin recrearla.
 *  Se borran las tablas hijas antes que `user` para respetar las claves foráneas. */
export async function cleanTasks(client: PrismaClient): Promise<void> {
  await client.mcpToken.deleteMany();
  await client.session.deleteMany();
  await client.account.deleteMany();
  await client.verification.deleteMany();
  await client.task.deleteMany();
  await client.user.deleteMany();
}

/** Crea un usuario de prueba y devuelve su id. Útil para tests de tareas aisladas por usuario. */
export async function createTestUser(
  client: PrismaClient,
  email = "usuario@prueba.test",
  name = "Usuario de Prueba",
): Promise<string> {
  const user = await client.user.create({
    data: { email, name },
  });
  return user.id;
}
