import { expect, test } from "@playwright/test";

test("flujo completo: crear, filtrar, editar, completar y borrar", async ({ page }) => {
  const title = `E2E ${Date.now()}`;
  const editedTitle = `${title} editada`;
  const liBy = (text: string) => page.locator("li", { hasText: text }).first();

  await page.goto("/");

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
