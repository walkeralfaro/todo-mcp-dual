// Limpia la DB de test de Turso antes de un run E2E (limpieza por tablas,
// sin borrar ni recrear la base de datos).
//
// Uso (credenciales siempre del entorno, nunca en el repo):
//   TURSO_DATABASE_URL="libsql://..." TURSO_AUTH_TOKEN="..." node scripts/clean-turso-test.mjs

import { createClient } from "@libsql/client";

const url = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;

if (!url || !authToken) {
  console.error("Faltan TURSO_DATABASE_URL y/o TURSO_AUTH_TOKEN en el entorno.");
  process.exit(1);
}

if (!url.startsWith("libsql:")) {
  console.error("Por seguridad este script solo acepta URLs libsql:// (Turso).");
  process.exit(1);
}

const client = createClient({ url, authToken });
try {
  await client.execute("DELETE FROM Task");
  const rs = await client.execute("SELECT count(*) AS n FROM Task");
  console.log(`OK Task limpiada. count=${rs.rows[0].n}`);
} finally {
  client.close();
}
