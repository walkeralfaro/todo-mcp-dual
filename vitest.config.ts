import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "node",
    include: ["**/*.test.{ts,tsx}"],
    testTimeout: 30000,
    // tasks.test.ts y mcp.test.ts comparten la DB de test de Turso:
    // fileParallelism:false = secuencial entre ficheros (poolOptions se
    // elimino en Vitest 4; este flag ya fuerza maxWorkers=1).
    fileParallelism: false,
  },
  resolve: {
    alias: { "@": new URL(".", import.meta.url).pathname },
  },
});
