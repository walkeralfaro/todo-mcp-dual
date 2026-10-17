import { expect, test } from "@playwright/test";

// Mismo margen que el resto de specs: el sign-up/sign-out contra Turso puede
// tardar varios segundos en ráfagas de latencia.
test.setTimeout(90000);

// El bloque MCP copia al portapapeles real del navegador.
test.use({ permissions: ["clipboard-read", "clipboard-write"] });

test("la landing es pública: titular, CTA y filas de ejemplo sin sesión", async ({ page }) => {
  await page.goto("/");

  // El titular aparece en dos líneas separadas por <br/>; verifica los
  // fragmentos que cada línea contiene (ni el todo ni cada parte caben como
  // una sola cadena a través del sal de línea).
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Tus tareas");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("para ti");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("agentes");
  await expect(page.getByTestId("landing-login")).toBeVisible();
  await expect(page.getByTestId("landing-register")).toBeVisible();

  // Sin sesión no hay formulario de tareas ni datos de usuario
  await expect(page.getByTestId("new-title")).toBeHidden();

  // La demo arranca con las filas de ejemplo y su aviso de que es local
  await expect(page.getByTestId("demo-row")).toHaveCount(10);
  await expect(page.getByTestId("demo-row").first()).toContainText("Pagar la luz");
  await expect(page.getByTestId("demo-note")).toContainText("nada se guarda en el servidor");
});

test("los CTA abren el modal en la pestaña correcta", async ({ page }) => {
  await page.goto("/");

  // Acción primaria del hero: crear cuenta
  await page.getByTestId("landing-register").click();
  await expect(page.getByTestId("auth-register-submit")).toBeVisible();
  await expect(page.getByTestId("auth-email")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByTestId("auth-register-submit")).toBeHidden();

  // Enlace secundario del hero: iniciar sesión
  await page.getByTestId("landing-login").click();
  await expect(page.getByTestId("auth-login-submit")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByTestId("auth-login-submit")).toBeHidden();

  // La variante del cierre conserva su pestaña y su propio testid
  const cierre = page.getByTestId("landing-close-register");
  await cierre.scrollIntoViewIfNeeded();
  await cierre.click();
  await expect(page.getByTestId("auth-register-submit")).toBeVisible();
});

test("?auth=register abre el modal en registro y ?auth=login en acceso", async ({ page }) => {
  await page.goto("/?auth=register");
  await expect(page.getByTestId("auth-register-submit")).toBeVisible();

  await page.goto("/?auth=login");
  await expect(page.getByTestId("auth-login-submit")).toBeVisible();
});

test("la demo añade y completa tareas solo en el navegador, sin llamadas al servidor", async ({
  page,
}) => {
  await page.goto("/");
  // Interactúa solo cuando el módulo de motion hidrató (la demo es cliente)
  await page.waitForFunction("window.__revealReady === true");
  await expect(page.getByTestId("demo-row")).toHaveCount(10);

  // Cualquier escritura al API tras la carga será una fuga de la demo
  const escrituras: string[] = [];
  page.on("request", (request) => {
    if (!["POST", "PUT", "PATCH", "DELETE"].includes(request.method())) return;
    const url = new URL(request.url());
    if (url.pathname.startsWith("/api/")) escrituras.push(`${request.method()} ${url.pathname}`);
  });

  const titulo = `Tarea local ${Date.now()}`;
  await page.getByTestId("demo-task-input").fill(titulo);
  await page.getByTestId("demo-add-btn").click();

  const nueva = page.getByTestId("demo-row").first();
  await expect(nueva).toContainText(titulo);
  await expect(nueva.getByTestId("demo-open-row")).toBeVisible();
  await expect(page.getByTestId("demo-row")).toHaveCount(11);

  // Marcar como completada: el cambio también vive solo en la página
  await nueva.getByTestId("demo-complete-btn").click();
  await expect(nueva).toContainText("COMPLETADA");
  await expect(nueva).toContainText("Culminada");

  await page.waitForTimeout(400);
  expect(escrituras).toEqual([]);
});

test("el bloque MCP copia la configuración real del despliegue", async ({ page }) => {
  await page.goto("/");
  await page.waitForFunction("window.__revealReady === true");

  const boton = page.getByTestId("hero-mcp-copy");
  await boton.scrollIntoViewIfNeeded();
  await boton.click();
  await expect(boton).toContainText("Copiado");

  const copiado = await page.evaluate(() => navigator.clipboard.readText());
  expect(copiado).toContain('"url": "http://localhost:3000/api/mcp"');
  expect(copiado).toContain("Authorization");
});

test.describe("sin JavaScript", () => {
  test.use({ javaScriptEnabled: false });

  test("la demo muestra las filas de ejemplo, el aviso sin JS y nada queda oculto", async ({
    page,
  }) => {
    await page.goto("/");

    // El HTML del servidor trae todo el contenido (el reveal no se activa)
    // El titular aparece en dos líneas separadas por <br/>; verifica los
    // fragmentos que cada línea contiene (ni el todo ni cada parte caben como
    // una sola cadena a través del sal de línea).
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Tus tareas");
    await expect(page.getByRole("heading", { level: 1 })).toContainText("para ti");
    await expect(page.getByRole("heading", { level: 1 })).toContainText("agentes");
    await expect(page.getByRole("heading", { name: "La letra pequeña" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Cuenta, token, agente" })).toBeVisible();
    await expect(page.getByTestId("demo-row")).toHaveCount(10);
    await expect(page.getByTestId("demo-noscript")).toBeVisible();

    // La configuración MCP queda visible con el endpoint relativo
    await expect(page.locator("pre")).toContainText("/api/mcp");
    await expect(page.getByTestId("hero-mcp-copy")).toBeVisible();
  });
});
