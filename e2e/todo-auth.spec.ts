import { expect, test, type Locator } from "@playwright/test";

async function expectMinHitArea(locator: Locator): Promise<void> {
  const bounds = await locator.evaluate((element) => {
    const rect = element.getBoundingClientRect();
    return { width: rect.width, height: rect.height };
  });
  expect(bounds.width).toBeGreaterThanOrEqual(44);
  expect(bounds.height).toBeGreaterThanOrEqual(44);
}

// Mismo margen que todo.spec.ts: los sign-up/sign-out contra Turso pueden
// tardar varios segundos en ráfagas de latencia.
test.setTimeout(90000);

test("flujo de autenticación: registro desde la landing entra a /tareas, permite crear y el logout vuelve a la landing", async ({ page }) => {
  const email = `usuario${Date.now()}@prueba.test`;
  const password = "password123";
  const taskTitle = `Tarea E2E ${Date.now()}`;

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");

  // Sin sesión: la landing es pública y no muestra el formulario de tareas
  await expect(page.getByTestId("landing-login")).toBeVisible();
  await expect(page.getByTestId("new-title")).toBeHidden();
  const header = page.getByTestId("site-header");
  await expectMinHitArea(header.getByRole("link", { name: "Todo App" }));
  await expectMinHitArea(page.getByTestId("auth-login-btn"));
  await expectMinHitArea(page.getByTestId("auth-register-btn"));
  await page.setViewportSize({ width: 1280, height: 900 });

  // Registro: el modal navega a la app (destino por defecto sin `next`)
  await page.getByTestId("auth-register-btn").click();
  await expect(page.getByTestId("auth-register-submit")).toBeVisible();

  await page.getByTestId("auth-email").fill(email);
  await page.getByTestId("auth-password").fill(password);
  await page.getByTestId("auth-register-submit").click();

  // Vuelve a la app con la vista server-rendered ya autenticada
  await expect(page).toHaveURL(/\/tareas$/, { timeout: 45000 });
  await expect(page.getByTestId("auth-signout-btn")).toBeVisible({ timeout: 30000 });
  await expect(page.getByTestId("new-title")).toBeVisible({ timeout: 30000 });
  await expect(page.getByTestId("create-btn")).toBeVisible({ timeout: 30000 });
  await expectMinHitArea(page.getByTestId("nav-tareas"));
  await expectMinHitArea(page.getByTestId("nav-mcp"));
  await expectMinHitArea(page.getByTestId("auth-signout-btn"));
  // Crea una tarea
  await page.getByTestId("new-title").fill(taskTitle);
  await page.getByTestId("create-btn").click();
  await expect(page.getByText(taskTitle)).toBeVisible({ timeout: 30000 });

  await page.setViewportSize({ width: 390, height: 844 });
  // En móvil el cierre de sesión vive en el panel desplegable, no en la barra.
  await page.getByTestId("nav-menu-btn").click();
  const signOutMovil = page.getByTestId("auth-signout-btn-movil");
  await expect(signOutMovil).toBeVisible();
  await expectMinHitArea(signOutMovil);

  // Cierra sesión: vuelve a la landing en estado anónimo
  await signOutMovil.click();
  await expect(page).toHaveURL(/localhost:3000\/$/, { timeout: 45000 });
  await expect(page.getByTestId("landing-login")).toBeVisible({ timeout: 30000 });
  await expect(page.getByTestId("new-title")).toBeHidden();
});

test("contraseña incorrecta muestra un único error en español con el modal abierto y conserva lo tecleado", async ({
  page,
}) => {
  const email = `usuario${Date.now()}@prueba.test`;
  const password = "password123";

  await page.goto("/");

  // Prepara una cuenta real para probar el 401 del login (registro desde la landing)
  await page.getByTestId("auth-register-btn").click();
  await page.getByTestId("auth-email").fill(email);
  await page.getByTestId("auth-password").fill(password);
  await page.getByTestId("auth-register-submit").click();
  await expect(page).toHaveURL(/\/tareas$/, { timeout: 45000 });
  await expect(page.getByTestId("auth-signout-btn")).toBeVisible({ timeout: 30000 });

  // Logout: vuelve a la landing
  await page.getByTestId("auth-signout-btn").click();
  await expect(page.getByTestId("landing-login")).toBeVisible({ timeout: 30000 });

  await page.getByTestId("auth-login-btn").click();
  await page.getByTestId("auth-email").fill(email);
  await page.getByTestId("auth-password").fill("contraseña-incorrecta");
  await page.getByTestId("auth-login-submit").click();

  // El caso inverso del bug original: el modal NO se cierra y muestra el error
  await expect(page.getByTestId("auth-error")).toHaveText("Correo o contraseña incorrectos.");
  await expect(page.getByTestId("auth-error")).toHaveCount(1);
  await expect(page.getByTestId("auth-login-submit")).toBeVisible();
  await expect(page.getByTestId("auth-email")).toHaveValue(email);

  // Con la contraseña correcta el login avanza y activa la sesión
  await page.getByTestId("auth-password").fill(password);
  await page.getByTestId("auth-login-submit").click();
  await expect(page.getByTestId("auth-signout-btn")).toBeVisible({ timeout: 15000 });
  await expect(page.getByTestId("new-title")).toBeVisible({ timeout: 15000 });
});

test("contraseña corta rechazada por el servidor con mensaje en español", async ({ page }) => {
  const email = `corta${Date.now()}@prueba.test`;

  await page.goto("/");

  await page.getByTestId("auth-register-btn").click();
  await expect(page.getByTestId("auth-register-submit")).toBeVisible();

  await page.getByTestId("auth-email").fill(email);
  // Se desactiva el minLength del navegador para llegar al backstop del servidor
  // (código PASSWORD_TOO_SHORT de Better Auth mapeado a español)
  await page.getByTestId("auth-password").evaluate(
    (el) => el.removeAttribute("minLength"),
  );
  await page.getByTestId("auth-password").fill("corta12");
  await page.getByTestId("auth-register-submit").click();

  await expect(page.getByTestId("auth-error")).toHaveText(
    "La contraseña debe tener al menos 8 caracteres.",
  );
  await expect(page.getByTestId("auth-register-submit")).toBeVisible();
});

test("cambiar de pestaña conserva lo tecleado y la pestaña solicitada se respeta al reabrir", async ({ page }) => {
  await page.goto("/");

  await page.getByTestId("auth-register-btn").click();
  await expect(page.getByTestId("auth-register-submit")).toBeVisible();

  // (4.2) Lo tecleado sobrevive al cambio de pestaña
  await page.getByTestId("auth-email").fill("e2e-tabs@prueba.test");
  await page.getByTestId("auth-switch-login").click();
  await expect(page.getByTestId("auth-login-submit")).toBeVisible();
  await expect(page.getByTestId("auth-email")).toHaveValue("e2e-tabs@prueba.test");

  // (4.1) Escape cierra; reabrir con "Iniciar sesión" muestra la pestaña login
  // y con "Registrarse" muestra la de registro
  await page.keyboard.press("Escape");
  await page.getByTestId("auth-register-btn").click();
  await expect(page.getByTestId("auth-register-submit")).toBeVisible();
  await page.keyboard.press("Escape");
  await page.getByTestId("auth-login-btn").click();
  await expect(page.getByTestId("auth-login-submit")).toBeVisible();
});
