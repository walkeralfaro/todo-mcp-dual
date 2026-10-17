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

/**
 * Turso muestra ráfagas de latencia y el primer connect puede expirar
 * (~10s) y fallar en falso; se reintenta porque este script bloquea el
 * arranque del webServer de Playwright.
 */
async function withRetry(fn, attempts = 3) {
  let lastError;
  for (let i = 1; i <= attempts; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (i < attempts) {
        console.error(`Intento ${i}/${attempts} falló: ${error?.message ?? error}`);
        await new Promise((resolve) => setTimeout(resolve, 1000 * i));
      }
    }
  }
  throw lastError;
}

try {
  await withRetry(() => client.execute("DELETE FROM Task"));
  const rs = await withRetry(() =>
    client.execute("SELECT count(*) AS n FROM Task"),
  );
  console.log(`OK Task limpiada. count=${rs.rows[0].n}`);
} finally {
  client.close();
}
