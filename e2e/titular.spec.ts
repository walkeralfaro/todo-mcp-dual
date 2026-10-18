import { expect, test } from "@playwright/test";
import { createClient, type InStatement } from "@libsql/client";

// Sembrar por SQL directo (@libsql/client) y no con el cliente Prisma generado:
// ese cliente es ESM (`import.meta`) y Playwright carga los specs como CJS.
test.setTimeout(120000);

const VENTANA_LISTADO = 50;
const PENDIENTES_SEMBRADOS = VENTANA_LISTADO + 5;
const COMPLETADAS_SEMBRADAS = 2;

/** Mismo formato de fecha que Prisma escribe en SQLite (ISO con offset +00:00). */
function marcaDeTiempoPrisma(): string {
  return new Date().toISOString().replace("Z", "+00:00");
}

async function sembrarTareasDelUsuario(email: string): Promise<void> {
  const url = process.env.TURSO_DATABASE_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN;
  if (!url || !authToken) {
    throw new Error(
      "E2E del titular: faltan TURSO_DATABASE_URL y/o TURSO_AUTH_TOKEN (los carga `npm run test:e2e`).",
    );
  }

  const client = createClient({ url, authToken });
  try {
    const { rows } = await client.execute({
      sql: "SELECT id FROM user WHERE email = ? LIMIT 1",
      args: [email],
    });
    const userId = rows[0]?.id;
    if (typeof userId !== "string") {
      throw new Error(`No se encontró el usuario ${email} para sembrar tareas.`);
    }

    const ahora = marcaDeTiempoPrisma();
    const statements: InStatement[] = [];
    for (let i = 0; i < PENDIENTES_SEMBRADOS; i += 1) {
      statements.push({
        sql: "INSERT INTO task (id, titulo, estado, fechaCreacion, userId) VALUES (?, ?, 'PENDIENTE', ?, ?)",
        args: [`seed-pendiente-${i}-${crypto.randomUUID()}`, `Pendiente ${i}`, ahora, userId],
      });
    }
    for (let i = 0; i < COMPLETADAS_SEMBRADAS; i += 1) {
      statements.push({
        sql: "INSERT INTO task (id, titulo, estado, fechaCreacion, fechaCulminada, userId) VALUES (?, ?, 'COMPLETADA', ?, ?, ?)",
        args: [
          `seed-completada-${i}-${crypto.randomUUID()}`,
          `Hecha ${i}`,
          ahora,
          ahora,
          userId,
        ],
      });
    }
    await client.batch(statements, "write");
  } finally {
    client.close();
  }
}

test("el titular cuenta todos los pendientes aunque el filtro o la búsqueda oculten tareas", async ({ page }) => {
  const email = `titular${Date.now()}@prueba.test`;
  const password = "password123";

  await page.goto("/");
  await page.getByTestId("auth-register-btn").click();
  await page.getByTestId("auth-email").fill(email);
  await page.getByTestId("auth-password").fill(password);
  await page.getByTestId("auth-register-submit").click();
  await expect(page).toHaveURL(/\/tareas$/, { timeout: 45000 });
  await expect(page.getByTestId("new-title")).toBeVisible({ timeout: 30000 });

  await sembrarTareasDelUsuario(email);

  // Más pendientes que la ventana de 50 del listado: la cifra es el total real.
  await page.goto("/tareas");
  await expect(page.getByTestId("day-headline")).toContainText(String(PENDIENTES_SEMBRADOS), {
    timeout: 30000,
  });

  // Con el filtro COMPLETADA activo (la lista solo muestra las 2 completadas)
  // la cifra sigue siendo la de pendientes reales.
  await page.getByTestId("filter-COMPLETADA").click();
  await page.waitForURL("**estado=COMPLETADA**");
  await page.reload();
  await expect(page.getByTestId("filter-count")).toContainText(String(COMPLETADAS_SEMBRADAS), {
    timeout: 30000,
  });
  await expect(page.getByTestId("day-headline")).toContainText(String(PENDIENTES_SEMBRADOS), {
    timeout: 30000,
  });

  // Con una búsqueda sin coincidencias la lista queda vacía y la cifra no cambia.
  await page.getByTestId("search").fill("zzz-sin-coincidencias");
  await expect(page.getByTestId("filter-count")).toContainText("0 tareas encontradas", {
    timeout: 30000,
  });
  await expect(page.getByTestId("day-headline")).toContainText(String(PENDIENTES_SEMBRADOS), {
    timeout: 30000,
  });
});
