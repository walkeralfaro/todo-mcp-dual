import { expect, test, type Locator, type Page } from "@playwright/test";

/**
 * Publicación y descubrimiento del documento de arquitectura (`/arquitectura`).
 *
 * El documento lo sirve `public/arquitectura.html` a través de la reescritura
 * `beforeFiles` de `next.config.ts`. La primera parte cubre el recurso en sí:
 * ruta limpia y con extensión, sin sesión, sin datos de usuario y sin cargas
 * externas (el HTML es autocontenido). La segunda cubre los enlaces que lo
 * hacen alcanzable desde la interfaz en cualquier ancho.
 */

const MARCADOR_ARTEFACTO = 'data-archify-artifact="explainer"';
const TITULO_DOCUMENTO = /Cómo funciona TODO-mcp/;

// El registro contra Turso puede tardar en ráfagas de latencia.
test.setTimeout(90000);

async function expectMinHitArea(locator: Locator): Promise<void> {
  const bounds = await locator.evaluate((element) => {
    const rect = element.getBoundingClientRect();
    return { width: rect.width, height: rect.height };
  });
  expect(bounds.width).toBeGreaterThanOrEqual(44);
  expect(bounds.height).toBeGreaterThanOrEqual(44);
}

async function sinDesbordamiento(page: Page): Promise<void> {
  const { scrollWidth, innerWidth } = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    innerWidth: window.innerWidth,
  }));
  expect(scrollWidth).toBeLessThanOrEqual(innerWidth);
}

/** Registra una cuenta nueva y espera a estar dentro de la app. */
async function registrarUsuario(page: Page): Promise<void> {
  const email = `arq${Date.now()}@prueba.test`;
  await page.goto("/");
  await page.getByTestId("auth-register-btn").click();
  await page.getByTestId("auth-email").fill(email);
  await page.getByTestId("auth-password").fill("password123");
  await page.getByTestId("auth-register-submit").click();
  await expect(page).toHaveURL(/\/tareas$/, { timeout: 45000 });
  await expect(page.getByTestId("auth-signout-btn")).toBeVisible({
    timeout: 30000,
  });
}

test("la ruta limpia sirve el documento sin exigir sesión", async ({ request }) => {
  const response = await request.get("/arquitectura");

  expect(response.status()).toBe(200);
  expect(response.headers()["content-type"]).toContain("text/html");

  // Sin redirección al acceso: la URL final es la pedida, no la landing con el
  // modal abierto (`/?auth=login&next=...`).
  const url = new URL(response.url());
  expect(url.pathname).toBe("/arquitectura");
  expect(url.searchParams.get("auth")).toBeNull();

  const html = await response.text();
  expect(html).toContain(MARCADOR_ARTEFACTO);
  expect(html).toContain("Cómo funciona TODO-mcp");
  // No es la landing anónima: no aparece su control de acceso.
  expect(html).not.toContain('data-testid="auth-login-btn"');
});

test("la ruta con extensión sirve el mismo documento", async ({ request }) => {
  const [limpia, conExtension] = await Promise.all([
    request.get("/arquitectura"),
    request.get("/arquitectura.html"),
  ]);

  expect(conExtension.status()).toBe(200);
  expect(await conExtension.text()).toBe(await limpia.text());
});

test("el documento es autocontenido y funciona sin recursos externos", async ({
  page,
}) => {
  const externas: string[] = [];
  page.on("request", (request) => {
    const url = request.url();
    if (url.startsWith("data:")) return;
    if (new URL(url).host === "localhost:3000") return;
    externas.push(url);
  });

  await page.goto("/arquitectura");

  await expect(page).toHaveTitle(TITULO_DOCUMENTO);
  await expect(page.locator("html")).toHaveAttribute(
    "data-artifact",
    "todo-mcp",
  );
  expect(externas).toEqual([]);
});

test("la barra ofrece el enlace desde 640 px y lo abre en otra pestaña", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1024, height: 900 });
  await page.goto("/");

  const enlace = page.getByTestId("nav-arquitectura");
  await expect(enlace).toBeVisible();
  await expect(enlace).toHaveAttribute("href", "/arquitectura");
  await expect(enlace).toHaveAttribute("target", "_blank");
  await expect(enlace).toHaveAttribute("rel", "noreferrer");
  await expectMinHitArea(enlace);

  const [documento] = await Promise.all([
    page.waitForEvent("popup"),
    enlace.click(),
  ]);
  await expect(documento).toHaveTitle(TITULO_DOCUMENTO);
  // La demo sigue en su pestaña original.
  await expect(page).toHaveURL(/\/$/);
});

test("el enlace de la barra es el último del orden de tabulación del header", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/");

  const secuencia: string[] = [];
  for (let i = 0; i < 12; i += 1) {
    await page.keyboard.press("Tab");
    const enfocado = await page.evaluate(() => {
      const element = document.activeElement as HTMLElement | null;
      if (!element) return "";
      return (
        element.dataset.testid ??
        element.textContent?.trim().slice(0, 40) ??
        element.tagName.toLowerCase()
      );
    });
    secuencia.push(enfocado);
    if (enfocado === "nav-arquitectura") break;
  }

  // La marca abre la secuencia y las acciones de acceso la preceden.
  expect(secuencia[0]).toBe("Todo App");
  expect(secuencia).toContain("auth-login-btn");
  expect(secuencia.indexOf("auth-login-btn")).toBeLessThan(
    secuencia.indexOf("nav-arquitectura"),
  );
  // Foco visible al alcanzarlo con teclado.
  await expect(page.getByTestId("nav-arquitectura")).toHaveCSS(
    "outline-width",
    "2px",
  );
});

test("en móvil el header anónimo no desborda y el pie da acceso a la documentación", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");

  // En la barra no cabe: se oculta y no provoca scroll horizontal.
  await expect(page.getByTestId("nav-arquitectura")).toBeHidden();
  await sinDesbordamiento(page);

  const enlacePie = page.getByTestId("footer-arquitectura");
  await expect(enlacePie).toBeVisible();
  await expect(enlacePie).toHaveAttribute("target", "_blank");
  await expectMinHitArea(enlacePie);
  await sinDesbordamiento(page);

  const [documento] = await Promise.all([
    page.waitForEvent("popup"),
    enlacePie.click(),
  ]);
  await expect(documento).toHaveTitle(TITULO_DOCUMENTO);
});

test("con sesión, la barra no parte las etiquetas ni desborda de 640 a 1023 px", async ({
  page,
}) => {
  await registrarUsuario(page);

  for (const width of [640, 768, 900]) {
    await page.setViewportSize({ width, height: 900 });
    await sinDesbordamiento(page);

    // Ningún control del header se parte en varias líneas: en este rango la
    // etiqueta del enlace no cabe junto a los enlaces de sesión.
    const lineas = await page.evaluate((ids) => {
      const resultado: Record<string, number> = {};
      for (const id of ids) {
        const element = document.querySelector(`[data-testid="${id}"]`);
        if (!element) continue;
        let rects = 0;
        element.childNodes.forEach((node) => {
          if (node.nodeType !== Node.TEXT_NODE) return;
          if (!node.textContent?.trim()) return;
          const range = document.createRange();
          range.selectNodeContents(node);
          rects += range.getClientRects().length;
        });
        resultado[id] = rects || 1;
      }
      return resultado;
    }, ["nav-tareas", "nav-mcp", "auth-signout-btn"]);

    expect(lineas).toEqual({
      "nav-tareas": 1,
      "nav-mcp": 1,
      "auth-signout-btn": 1,
    });

    // El enlace sigue visible en modo icono, con nombre accesible y área táctil.
    const enlace = page.getByTestId("nav-arquitectura");
    await expect(enlace).toBeVisible();
    await expect(enlace).toHaveAttribute("aria-label", "Cómo está hecha");
    await expectMinHitArea(enlace);
  }

  // Desde `lg` vuelve la etiqueta visible.
  await page.setViewportSize({ width: 1024, height: 900 });
  await expect(page.getByTestId("nav-arquitectura")).toHaveText(
    "Cómo está hecha",
  );
});

test("con sesión, el panel móvil incluye el enlace a la documentación", async ({
  page,
}) => {
  await registrarUsuario(page);
  await page.setViewportSize({ width: 390, height: 844 });

  await page.getByTestId("nav-menu-btn").click();
  const enlace = page.getByTestId("nav-arquitectura-movil");
  await expect(enlace).toBeVisible();
  await expect(enlace).toHaveAttribute("href", "/arquitectura");
  await expect(enlace).toHaveAttribute("target", "_blank");
  await expectMinHitArea(enlace);
  await sinDesbordamiento(page);

  const [documento] = await Promise.all([
    page.waitForEvent("popup"),
    enlace.click(),
  ]);
  await expect(documento).toHaveTitle(TITULO_DOCUMENTO);
  // El panel se cierra al usar el enlace.
  await expect(page.locator("#mobile-nav")).toBeHidden();
});
