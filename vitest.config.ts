import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "node",
    include: ["**/*.test.{ts,tsx}"],
    testTimeout: 30000,
    // tasks.test.ts y mcp.test.ts comparten la DB de test de Turso:
    // un solo worker evita que el DELETE de un fichero borre datos del otro.
    poolOptions: { forks: { singleFork: true } },
  },
  resolve: {
    alias: { "@": new URL(".", import.meta.url).pathname },
  },
});
