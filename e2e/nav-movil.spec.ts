import { expect, test, type Locator } from "@playwright/test";

// Turso (aws-us-east-1) mantiene latencia alta en el registro; 90s cubre el
// alta de usuario más la navegación entre /tareas y /mcp.
test.setTimeout(90000);

async function expectMinHitArea(locator: Locator): Promise<void> {
  const bounds = await locator.evaluate((element) => {
    const rect = element.getBoundingClientRect();
    return { width: rect.width, height: rect.height };
  });
  expect(bounds.width).toBeGreaterThanOrEqual(44);
  expect(bounds.height).toBeGreaterThanOrEqual(44);
}

async function registrarUsuario(page: import("@playwright/test").Page): Promise<void> {
  const email = `nav${Date.now()}@prueba.test`;
  await page.goto("/");
  await page.getByTestId("auth-register-btn").click();
  await page.getByTestId("auth-email").fill(email);
  await page.getByTestId("auth-password").fill("password123");
  await page.getByTestId("auth-register-submit").click();
  await expect(page).toHaveURL(/\/tareas$/, { timeout: 45000 });
  await expect(page.getByTestId("auth-signout-btn")).toBeVisible({ timeout: 30000 });
}

test("en móvil los enlaces de sesión son alcanzables desde la navbar sin recortes", async ({
  page,
}) => {
  await registrarUsuario(page);
  await page.setViewportSize({ width: 390, height: 844 });

  const toggle = page.getByTestId("nav-menu-btn");
  const panel = page.locator("#mobile-nav");
  const signOutMovil = page.getByTestId("auth-signout-btn-movil");
  const sinDesbordamiento = async () => {
    const { scrollWidth, innerWidth } = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      innerWidth: window.innerWidth,
    }));
    expect(scrollWidth).toBeLessThanOrEqual(innerWidth);
  };

  // Cerrado: el botón de menú es el único acceso y cumple el área táctil.
  await expect(toggle).toBeVisible();
  await expect(toggle).toHaveAttribute("aria-expanded", "false");
  await expectMinHitArea(toggle);
  await expect(panel).toBeHidden();
  await sinDesbordamiento();

  // La hamburguesa queda a la derecha del avatar y "Cerrar sesión" no está en
  // la barra (su ubicación móvil es el panel).
  const avatar = page.getByTestId("auth-avatar");
  const avatarBounds = await avatar.boundingBox();
  const toggleBounds = await toggle.boundingBox();
  expect(avatarBounds).not.toBeNull();
  expect(toggleBounds).not.toBeNull();
  expect(toggleBounds!.x).toBeGreaterThanOrEqual(
    avatarBounds!.x + avatarBounds!.width,
  );
  await expect(page.getByTestId("auth-signout-btn")).toBeHidden();
  await expect(signOutMovil).toBeHidden();

  // Abierto: enlaces y cierre de sesión visibles, con área táctil y sin
  // desbordar.
  await toggle.click();
  await expect(toggle).toHaveAttribute("aria-expanded", "true");
  const tareas = panel.getByRole("link", { name: "Mis tareas" });
  const mcp = panel.getByRole("link", { name: "Tokens MCP" });
  await expect(tareas).toBeVisible();
  await expect(mcp).toBeVisible();
  await expectMinHitArea(tareas);
  await expectMinHitArea(mcp);
  await expect(signOutMovil).toBeVisible();
  await expect(signOutMovil).toHaveText("Cerrar sesión");
  await expectMinHitArea(signOutMovil);
  await sinDesbordamiento();

  // Escape cierra el panel y devuelve el foco al botón que lo abrió.
  await page.keyboard.press("Escape");
  await expect(panel).toBeHidden();
  await expect(toggle).toHaveAttribute("aria-expanded", "false");
  await expect(toggle).toBeFocused();
  await expect(signOutMovil).toBeHidden();

  // Pulsar fuera del header también cierra el panel.
  await toggle.click();
  await expect(panel).toBeVisible();
  await page.evaluate(() => {
    document.body.dispatchEvent(
      new PointerEvent("pointerdown", { bubbles: true }),
    );
  });
  await expect(panel).toBeHidden();

  // Cada enlace navega y deja el panel cerrado.
  await toggle.click();
  await tareas.click();
  await expect(page).toHaveURL(/\/tareas$/);
  await expect(panel).toBeHidden();

  await toggle.click();
  await mcp.click();
  await expect(page).toHaveURL(/\/mcp$/);
  await expect(panel).toBeHidden();

  // Cerrar sesión desde el panel vuelve a la landing en estado anónimo y el
  // panel desaparece con la sesión.
  await toggle.click();
  await expect(signOutMovil).toBeVisible();
  await signOutMovil.click();
  await expect(page).toHaveURL(/localhost:3000\/$/, { timeout: 45000 });
  await expect(page.getByTestId("landing-login")).toBeVisible({
    timeout: 30000,
  });
  await expect(panel).toHaveCount(0);
});

test("en escritorio la navbar muestra los enlaces sin depender del menú móvil", async ({
  page,
}) => {
  await registrarUsuario(page);

  for (const width of [1024, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await expect(page.getByTestId("nav-menu-btn")).toBeHidden();
    const tareas = page.getByTestId("nav-tareas");
    const mcp = page.getByTestId("nav-mcp");
    await expect(tareas).toBeVisible();
    await expect(mcp).toBeVisible();
    await expectMinHitArea(tareas);
    await expectMinHitArea(mcp);

    // Ningún control del header se sale del viewport.
    const { scrollWidth, innerWidth, right } = await page.evaluate(() => {
      const signout = document.querySelector('[data-testid="auth-signout-btn"]');
      return {
        scrollWidth: document.documentElement.scrollWidth,
        innerWidth: window.innerWidth,
        right: signout ? Math.round(signout.getBoundingClientRect().right) : 0,
      };
    });
    expect(scrollWidth).toBeLessThanOrEqual(innerWidth);
    expect(right).toBeLessThanOrEqual(innerWidth);
  }
});
