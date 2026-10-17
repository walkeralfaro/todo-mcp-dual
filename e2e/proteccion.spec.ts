import { expect, test } from "@playwright/test";

// Mismo margen que el resto de specs: Turso (aws-us-east-1) tiene ráfagas
// de latencia y el sign-up/sign-out puede tardar varios segundos.
test.setTimeout(90000);

test("deep link a /tareas sin sesión: landing con modal abierto y retorno tras el registro", async ({
  page,
}) => {
  const email = `prote${Date.now()}@prueba.test`;

  await page.goto("/tareas");

  // Redirect de protección con next y modal abierto en la pestaña login
  await expect(page).toHaveURL(/\/\?auth=login&next=%2Ftareas$/);
  await expect(page.getByTestId("auth-login-submit")).toBeVisible();

  // Registro desde el propio modal y vuelta a la ruta solicitada
  await page.getByTestId("auth-switch-register").click();
  await page.getByTestId("auth-email").fill(email);
  await page.getByTestId("auth-password").fill("password123");
  await page.getByTestId("auth-register-submit").click();

  await expect(page).toHaveURL(/\/tareas$/, { timeout: 45000 });
  await expect(page.getByTestId("new-title")).toBeVisible({ timeout: 30000 });
});

test("deep link a /mcp sin sesión vuelve a la landing con next=/mcp", async ({ page }) => {
  await page.goto("/mcp");

  await expect(page).toHaveURL(/\/\?auth=login&next=%2Fmcp$/);
  await expect(page.getByTestId("auth-login-submit")).toBeVisible();
});

test("login retorna a next y logout desde la app vuelve a la landing", async ({ page }) => {
  const email = `prote2${Date.now()}@prueba.test`;
  const password = "password123";

  // Crea la cuenta desde la landing (sin next): cae en /tareas
  await page.goto("/");
  await page.getByTestId("auth-register-btn").click();
  await page.getByTestId("auth-email").fill(email);
  await page.getByTestId("auth-password").fill(password);
  await page.getByTestId("auth-register-submit").click();
  await expect(page).toHaveURL(/\/tareas$/, { timeout: 45000 });
  await expect(page.getByTestId("auth-signout-btn")).toBeVisible({ timeout: 30000 });

  // Logout: vuelve a la landing en estado anónimo
  await page.getByTestId("auth-signout-btn").click();
  await expect(page).toHaveURL(/localhost:3000\/$/, { timeout: 45000 });
  await expect(page.getByTestId("landing-login")).toBeVisible({ timeout: 30000 });

  // Deep link protegido: el login con la cuenta existente vuelve a /tareas
  await page.goto("/tareas");
  await expect(page).toHaveURL(/\/\?auth=login&next=%2Ftareas$/);
  await page.getByTestId("auth-email").fill(email);
  await page.getByTestId("auth-password").fill(password);
  await page.getByTestId("auth-login-submit").click();
  await expect(page).toHaveURL(/\/tareas$/, { timeout: 45000 });
  await expect(page.getByTestId("new-title")).toBeVisible({ timeout: 30000 });
});

test("next inválido se ignora y tras autenticarse cae a /tareas", async ({ page }) => {
  const email = `prote3${Date.now()}@prueba.test`;

  await page.goto("/?auth=register&next=https%3A%2F%2Fejemplo.com");
  await expect(page.getByTestId("auth-register-submit")).toBeVisible();

  await page.getByTestId("auth-email").fill(email);
  await page.getByTestId("auth-password").fill("password123");
  await page.getByTestId("auth-register-submit").click();

  await expect(page).toHaveURL(/\/tareas$/, { timeout: 45000 });
});
