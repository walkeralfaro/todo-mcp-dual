import { defineConfig, devices } from "@playwright/test";

if (!process.env.TURSO_DATABASE_URL || !process.env.TURSO_AUTH_TOKEN) {
  throw new Error(
    "E2E contra Turso: faltan TURSO_DATABASE_URL y/o TURSO_AUTH_TOKEN en el entorno (set -a; source .env).",
  );
}

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  retries: 0,
  use: { baseURL: "http://localhost:3000", trace: "retain-on-failure" },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    // Limpieza por tablas (ya no rm -f e2e.db): el server hereda TURSO_* de test.
    command: "node scripts/clean-turso-test.mjs && npm run dev -- --port 3000",
    url: "http://localhost:3000",
    reuseExistingServer: false,
    timeout: 120000,
    env: {
      TURSO_DATABASE_URL: process.env.TURSO_DATABASE_URL,
      TURSO_AUTH_TOKEN: process.env.TURSO_AUTH_TOKEN,
    },
  },
});
