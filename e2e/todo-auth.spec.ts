import { expect, test } from "@playwright/test";

// Mismo margen que todo.spec.ts: los sign-up/sign-out contra Turso pueden
// tardar varios segundos en ráfagas de latencia.
test.setTimeout(90000);

test("flujo de autenticación: sin sesión no puede crear; con sesión puede crear, cerrar sesión y vuelve al estado anónimo" +
  " sin recarga manual", async ({ page }) => {
  const email = `usuario${Date.now()}@prueba.test`;
  const password = "password123";
  const taskTitle = `Tarea E2E ${Date.now()}`;

  await page.goto("/");

  // Sin sesión: no aparece el formulario de creación ni los botones de tarea
  await expect(page.getByTestId("new-title")).toBeHidden();
  await expect(page.getByTestId("create-btn")).toBeHidden();
  // El estado vacío invita a iniciar sesión (no a crear tareas)
  await expect(page.getByText("Inicia sesión para crear tus tareas.")).toBeVisible();

  // Abre el modal y se registra
  await page.getByTestId("auth-register-btn").click();
  await expect(page.getByTestId("auth-register-submit")).toBeVisible();

  await page.getByTestId("auth-email").fill(email);
  await page.getByTestId("auth-password").fill(password);
  await page.getByTestId("auth-register-submit").click();

  // El modal se cierra tras autenticarse con éxito sin recarga manual:
  // el RSC refrescado muestra avatar/cerrar sesión y el formulario
  // (timeouts holgados: el sign-up contra Turso puede tardar varios segundos)
  await expect(page.getByTestId("auth-register-submit")).toBeHidden({ timeout: 15000 });
  await expect(page.getByTestId("auth-signout-btn")).toBeVisible({ timeout: 15000 });
  await expect(page.getByTestId("new-title")).toBeVisible({ timeout: 15000 });
  await expect(page.getByTestId("create-btn")).toBeVisible({ timeout: 15000 });
  // Crea una tarea
  await page.getByTestId("new-title").fill(taskTitle);
  await page.getByTestId("create-btn").click();
  await expect(page.getByText(taskTitle)).toBeVisible({ timeout: 15000 });

  // Cierra sesión
  await page.getByTestId("auth-signout-btn").click();
  await expect(page.getByTestId("auth-signout-btn")).toBeHidden({ timeout: 15000 });

  // Vuelve al estado anónimo sin recarga manual: sin formulario de creación
  await expect(page.getByTestId("new-title")).toBeHidden();
  await expect(page.getByTestId("create-btn")).toBeHidden();
});

test("contraseña incorrecta muestra un único error en español con el modal abierto y conserva lo tecleado", async ({
  page,
}) => {
  const email = `usuario${Date.now()}@prueba.test`;
  const password = "password123";

  await page.goto("/");

  // Prepara una cuenta real para probar el 401 del login
  await page.getByTestId("auth-register-btn").click();
  await page.getByTestId("auth-email").fill(email);
  await page.getByTestId("auth-password").fill(password);
  await page.getByTestId("auth-register-submit").click();
  await expect(page.getByTestId("auth-signout-btn")).toBeVisible({ timeout: 15000 });

  await page.getByTestId("auth-signout-btn").click();
  await expect(page.getByTestId("auth-signout-btn")).toBeHidden({ timeout: 15000 });

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
