import { expect, test, type Page } from "@playwright/test";

// Mismo margen que el resto de specs: la latencia de Turso viene en ráfagas.
test.setTimeout(120000);

// El portapapeles se prueba de verdad (copiar token y copiar configuración).
test.use({ permissions: ["clipboard-read", "clipboard-write"] });

/** Registra una cuenta nueva desde la landing y espera la app autenticada. */
async function registrar(page: Page, email: string): Promise<void> {
  await page.goto("/");
  await page.getByTestId("auth-register-btn").click();
  await expect(page.getByTestId("auth-register-submit")).toBeVisible();
  await page.getByTestId("auth-email").fill(email);
  await page.getByTestId("auth-password").fill("password123");
  await page.getByTestId("auth-register-submit").click();
  await expect(page).toHaveURL(/\/tareas$/, { timeout: 45000 });
  await expect(page.getByTestId("auth-signout-btn")).toBeVisible({
    timeout: 30000,
  });
}

test("generar muestra el token una sola vez (copiable) y la lista conserva el prefijo", async ({
  page,
}) => {
  await registrar(page, `mcp-token${Date.now()}@prueba.test`);

  // Navegación por teclado al enlace protegido (Tab hasta el enlace y Enter).
  await page.getByTestId("nav-mcp").focus();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/\/mcp$/, { timeout: 45000 });

  await expect(page.getByTestId("mcp-empty")).toBeVisible();
  await page.getByTestId("mcp-generate-btn").click();
  await expect(page.getByTestId("mcp-generate-confirm")).toBeVisible();
  await page.getByTestId("mcp-generate-confirm").click();

  // Visualización única: valor completo + aviso + copia real al portapapeles
  const tokenCode = page.getByTestId("mcp-created-token");
  await expect(tokenCode).toBeVisible({ timeout: 30000 });
  const token = (await tokenCode.textContent())?.trim() ?? "";
  expect(token).toMatch(/^tmcp_[A-Za-z0-9_-]{43}$/);
  await expect(page.getByTestId("mcp-created-warning")).toContainText(
    "único momento",
  );

  await page.getByTestId("mcp-copy-token-btn").click();
  await expect(page.getByTestId("mcp-copy-token-btn")).toContainText("Copiado");
  const portapapeles = await page.evaluate(() => navigator.clipboard.readText());
  expect(portapapeles).toBe(token);

  // Al cerrar, el valor en claro desaparece y la lista solo muestra el prefijo
  await page.getByRole("button", { name: "Cerrar" }).click();
  await expect(page.getByTestId("mcp-created-token")).toBeHidden();
  const fila = page.getByTestId("mcp-token-row");
  await expect(fila).toHaveCount(1);
  await expect(fila).toContainText(`${token.slice(0, 8)}…`);

  // Recargar no recupera el valor en claro
  await page.reload();
  await expect(page.getByTestId("mcp-token-row")).toHaveCount(1);
  await expect(page.getByTestId("mcp-created-token")).toHaveCount(0);
});

test("revocar pide confirmación (cancelable) y el token desaparece de la lista", async ({
  page,
}) => {
  await registrar(page, `mcp-revoke${Date.now()}@prueba.test`);
  await page.goto("/mcp");

  await page.getByTestId("mcp-generate-btn").click();
  await page.getByTestId("mcp-generate-confirm").click();
  await expect(page.getByTestId("mcp-created-token")).toBeVisible({
    timeout: 30000,
  });
  await page.getByRole("button", { name: "Cerrar" }).click();
  await expect(page.getByTestId("mcp-token-row")).toHaveCount(1);

  // Cancelar conserva el token
  await page.getByTestId("mcp-revoke-btn").click();
  await expect(page.getByText("Revocar token")).toBeVisible();
  await page.getByRole("button", { name: "Cancelar" }).click();
  await expect(page.getByTestId("mcp-token-row")).toHaveCount(1);

  // Confirmar lo elimina y no vuelve tras recargar
  await page.getByTestId("mcp-revoke-btn").click();
  await page.getByTestId("mcp-revoke-confirm").click();
  await expect(page.getByTestId("mcp-empty")).toBeVisible({ timeout: 30000 });
  await page.reload();
  await expect(page.getByTestId("mcp-empty")).toBeVisible();
});

test("el token funciona contra /api/mcp y deja de valer (401) al revocarlo", async ({
  page,
  request,
}) => {
  await registrar(page, `mcp-api${Date.now()}@prueba.test`);
  await page.goto("/mcp");

  await page.getByTestId("mcp-generate-btn").click();
  await page.getByTestId("mcp-generate-confirm").click();
  await expect(page.getByTestId("mcp-created-token")).toBeVisible({
    timeout: 30000,
  });
  const token = (
    (await page.getByTestId("mcp-created-token").textContent()) ?? ""
  ).trim();
  expect(token).toMatch(/^tmcp_/);
  await page.getByRole("button", { name: "Cerrar" }).click();

  const llamarMcp = (bearer: string) =>
    request.post("/api/mcp", {
      headers: {
        authorization: `Bearer ${bearer}`,
        "content-type": "application/json",
        accept: "application/json, text/event-stream",
      },
      data: { jsonrpc: "2.0", id: 1, method: "tools/list", params: {} },
    });

  const conToken = await llamarMcp(token);
  expect(conToken.status()).toBe(200);

  await page.getByTestId("mcp-revoke-btn").click();
  await page.getByTestId("mcp-revoke-confirm").click();
  await expect(page.getByTestId("mcp-empty")).toBeVisible({ timeout: 30000 });

  const revocado = await llamarMcp(token);
  expect(revocado.status()).toBe(401);
});
