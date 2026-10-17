import { expect, test } from "@playwright/test";

// Turso (aws-us-east-1) muestra ráfagas de latencia (sign-up ~6s, sign-out
// ~11s observados); el default de 30s por test se queda corto para un flujo
// CRUD completo con recargas.
test.setTimeout(90000);

test("flujo completo: crear, filtrar, editar, completar y borrar", async ({ page }) => {
  const title = `E2E ${Date.now()}`;
  const editedTitle = `${title} editada`;
  const liBy = (text: string) => page.locator("li", { hasText: text }).first();
  const email = `usuario${Date.now()}@prueba.test`;
  const password = "password123";

  await page.goto("/");

  // El formulario solo existe con sesión (comportamiento esperado tras el fix
  // de sesión): se registra un usuario único para este run y se continúa.
  await page.getByTestId("auth-register-btn").click();
  await page.getByTestId("auth-email").fill(email);
  await page.getByTestId("auth-password").fill(password);
  await page.getByTestId("auth-register-submit").click();
  await expect(page.getByTestId("auth-signout-btn")).toBeVisible({ timeout: 15000 });
  await expect(page.getByTestId("new-title")).toBeVisible();

  await page.getByTestId("new-title").fill(title);
  await page.getByTestId("create-btn").click();
  await expect(page.getByText(title).first()).toBeVisible({ timeout: 15000 });

  await page.getByTestId("filter-PENDIENTE").click();
  await page.waitForURL("**estado=PENDIENTE**");
  await page.reload();
  await expect(liBy(title)).toBeVisible();

  // Scope estable por id (el texto deja de matchear hasText en modo edición)
  const taskTestId = await liBy(title).getAttribute("data-testid");
  const scope = page.locator(`li[data-testid="${taskTestId}"]`);

  await scope.getByTestId("edit-btn").click();
  await expect(scope.getByTestId("edit-title")).toBeVisible({ timeout: 15000 });
  await scope.getByTestId("edit-title").fill(editedTitle);
  await scope.getByTestId("save-btn").click();
  await expect(page.getByText(editedTitle).first()).toBeVisible({ timeout: 15000 });

  await scope.getByTestId("status-select").click();
  await page.getByRole("option", { name: "COMPLETADA" }).click();
  // Al completar bajo el filtro PENDIENTE, la tarea sale de la vista filtrada
  await expect(page.getByText(editedTitle)).toHaveCount(0, { timeout: 15000 });

  await page.getByTestId("filter-COMPLETADA").click();
  await page.waitForURL("**estado=COMPLETADA**");
  await page.reload();
  await expect(page.getByText(editedTitle).first()).toBeVisible();

  const scope2TestId = await liBy(editedTitle).getAttribute("data-testid");
  await page.locator(`li[data-testid="${scope2TestId}"]`).getByTestId("delete-btn").click();
  await expect(page.getByRole("alertdialog")).toBeVisible({ timeout: 15000 });
  await page.getByTestId("delete-confirm").click();
  await expect(page.getByText(editedTitle)).toHaveCount(0, { timeout: 15000 });
});
