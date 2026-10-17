import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "node",
    include: ["**/*.test.{ts,tsx}"],
    testTimeout: 30000,
    // Los hooks (beforeAll/beforeEach) tocan la DB de test de Turso, con la
    // misma latencia que ya asume testTimeout; sin esto, una limpieza lenta
    // peta a 10s y el hook zombie entra en carrera con el siguiente beforeEach.
    hookTimeout: 30000,
    // tasks.test.ts y mcp.test.ts comparten la DB de test de Turso:
    // fileParallelism:false = secuencial entre ficheros (poolOptions se
    // elimino en Vitest 4; este flag ya fuerza maxWorkers=1).
    fileParallelism: false,
  },
  resolve: {
    alias: { "@": new URL(".", import.meta.url).pathname },
  },
});
