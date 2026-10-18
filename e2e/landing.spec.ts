import { expect, test, type Locator } from "@playwright/test";

async function expectMinHitArea(locator: Locator): Promise<void> {
  const bounds = await locator.evaluate((element) => {
    const rect = element.getBoundingClientRect();
    return { width: rect.width, height: rect.height };
  });
  expect(bounds.width).toBeGreaterThanOrEqual(44);
  expect(bounds.height).toBeGreaterThanOrEqual(44);
}

function luminancia(color: string): number {
  const values = color.match(/[\d.]+/g)?.slice(0, 3).map(Number);
  if (!values || values.length !== 3) {
    throw new Error(`Color computado no reconocido: ${color}`);
  }
  const canales = values.map((value) => {
    const normalizado = value / 255;
    return normalizado <= 0.04045
      ? normalizado / 12.92
      : ((normalizado + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * canales[0] + 0.7152 * canales[1] + 0.0722 * canales[2];
}

function ratioContraste(foreground: string, background: string): number {
  const a = luminancia(foreground);
  const b = luminancia(background);
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}

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
  const header = page.getByTestId("site-header");
  await expectMinHitArea(header.getByRole("link", { name: "Todo App" }));
  await expectMinHitArea(page.getByTestId("auth-login-btn"));
  await expectMinHitArea(page.getByTestId("auth-register-btn"));
  await expect(page.getByTestId("hero-product-preview")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Conecta un agente MCP" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Las herramientas del agente" })).toBeVisible();
  await expect(page.getByText(/^(1 minuto|30 segundos|2 minutos)$/)).toHaveCount(0);
  await expect(page.locator("main section[id]").first()).toHaveAttribute("id", "lista");
  await expect(page.locator("main section[id]").nth(1)).toHaveAttribute("id", "agentes");
  await expect(page.locator("main section[id]").nth(2)).toHaveAttribute("id", "herramientas");

  // Sin sesión no hay formulario de tareas ni datos de usuario
  await expect(page.getByTestId("new-title")).toBeHidden();

  // La demo arranca con las filas de ejemplo y su aviso de que es local
  await expect(page.getByTestId("demo-row")).toHaveCount(3);
  await expect(page.getByTestId("demo-row").first()).toContainText("Pagar la luz");
  await expect(page.getByTestId("demo-note")).toContainText("nada se guarda en el servidor");
});

test("el header mantiene foco, contraste y separación en varios anchos", async ({ page }) => {
  await page.goto("/");
  const header = page.getByTestId("site-header");
  const marca = header.getByRole("link", { name: "Todo App" });
  const iniciar = page.getByTestId("auth-login-btn");
  const registrar = page.getByTestId("auth-register-btn");

  await page.keyboard.press("Tab");
  await expect(marca).toBeFocused();
  await expect(marca).toHaveCSS("outline-width", "2px");
  await page.keyboard.press("Tab");
  await expect(iniciar).toBeFocused();
  await expect(iniciar).toHaveCSS("outline-width", "2px");

  const colores = await Promise.all(
    [iniciar, registrar].map((locator) =>
      locator.evaluate((element) => ({
        foreground: getComputedStyle(element).color,
        background: getComputedStyle(element).backgroundColor,
      })),
    ),
  );
  for (const color of colores) {
    expect(ratioContraste(color.foreground, color.background)).toBeGreaterThanOrEqual(4.5);
  }

  for (const width of [390, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    const marcaBounds = await marca.boundingBox();
    const iniciarBounds = await iniciar.boundingBox();
    const registrarBounds = await registrar.boundingBox();
    expect(marcaBounds).not.toBeNull();
    expect(iniciarBounds).not.toBeNull();
    expect(registrarBounds).not.toBeNull();
    expect(marcaBounds!.x + marcaBounds!.width).toBeLessThanOrEqual(iniciarBounds!.x);
    expect(iniciarBounds!.x + iniciarBounds!.width).toBeLessThanOrEqual(registrarBounds!.x);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  }
});

test("la demo y sus controles funcionan solo con teclado", async ({ page }) => {
  await page.goto("/");
  await page.waitForFunction("window.__revealReady === true");

  const titulo = `Tarea teclado ${Date.now()}`;
  const input = page.getByTestId("demo-task-input");
  await input.focus();
  await input.fill(titulo);
  await input.press("Enter");

  const nueva = page.getByTestId("demo-row").first();
  await expect(nueva).toContainText(titulo);
  const completar = nueva.getByTestId("demo-complete-btn");
  await completar.focus();
  await page.keyboard.press("Enter");
  await expect(nueva).toContainText("COMPLETADA");
});

test("la landing mantiene el contenido visible con movimiento reducido", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");

  const reveal = page.locator("#agentes [data-reveal]");
  await expect(reveal).toHaveCSS("opacity", "1");
  await expect(reveal).toHaveCSS("transform", "none");
  await expect(page.getByTestId("mcp-config-card")).toBeVisible();
});

test("la landing cabe y mantiene titulares legibles en 390, 768 y 1440 px", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await page.waitForFunction("window.__revealReady === true");

  for (const width of [390, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();

    await page.screenshot({
      path: `/tmp/todo-landing-redisenada-${width}.png`,
      fullPage: true,
      animations: "disabled",
    });

    const scrollWidthFits = await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    );
    expect(scrollWidthFits, `scroll horizontal a ${width}px`).toBe(true);

    const headingLines = await page.locator("main h1, main h2").evaluateAll((headings) =>
      headings.map((heading) => {
        const rect = heading.getBoundingClientRect();
        const style = getComputedStyle(heading);
        const lineHeight = Number.parseFloat(style.lineHeight);
        return {
          text: heading.textContent,
          lines: Math.round(rect.height / lineHeight),
          fontSize: style.fontSize,
          width: rect.width,
          height: rect.height,
        };
      }),
    );
    expect(headingLines.length).toBeGreaterThan(0);
    for (const heading of headingLines) {
      expect(
        heading.lines,
        `«${heading.text}» con ${heading.lines} líneas a ${width}px; fuente ${heading.fontSize}; caja ${heading.width}×${heading.height}`,
      ).toBeLessThanOrEqual(2);
    }

    const configFits = await page
      .getByTestId("mcp-config-card")
      .locator("pre")
      .evaluate((element) => element.scrollWidth <= element.clientWidth);
    expect(configFits, `configuración recortada a ${width}px`).toBe(true);

  }
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
  await expect(page.getByTestId("demo-row")).toHaveCount(3);

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
  await expect(page.getByTestId("demo-row")).toHaveCount(4);

  // Marcar como completada: el cambio también vive solo en la página
  await nueva.getByTestId("demo-complete-btn").click();
  await expect(nueva).toContainText("COMPLETADA");
  await expect(nueva).toContainText("Culminada");
  await nueva.getByTestId("demo-complete-btn").click();
  await expect(nueva).toContainText("PENDIENTE");
  await expect(nueva).not.toContainText("Culminada");

  await page.waitForTimeout(400);
  expect(escrituras).toEqual([]);
});

test("el bloque MCP copia la configuración real del despliegue", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await page.waitForFunction("window.__revealReady === true");

  const tarjeta = page.locator("#agentes").getByTestId("mcp-config-card");
  const codigo = tarjeta.locator("pre");
  await expect(codigo).toBeVisible();
  await expect(codigo).toHaveCSS("font-size", "12px");
  expect(
    await codigo.evaluate((element) => element.scrollWidth <= element.clientWidth),
  ).toBe(true);
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
  ).toBe(true);

  const boton = tarjeta.getByTestId("hero-mcp-copy");
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
    await expect(page.getByRole("heading", { name: "Conecta un agente MCP" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Las herramientas del agente" })).toBeVisible();
    await expect(page.getByText(/^(1 minuto|30 segundos|2 minutos)$/)).toHaveCount(0);
    await expect(page.getByTestId("demo-row")).toHaveCount(3);
    await expect(page.getByTestId("demo-noscript")).toBeVisible();

    // La configuración MCP queda visible con el endpoint relativo
    await expect(page.locator("pre")).toContainText("/api/mcp");
    await expect(page.getByTestId("hero-mcp-copy")).toBeVisible();
  });
});
