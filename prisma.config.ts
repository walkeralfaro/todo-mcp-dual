import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    // Fallback local: en Vercel no existe DATABASE_URL (solo TURSO_*) y
    // `generate` debe poder cargar la config sin tocar la DB.
    url: process.env.DATABASE_URL ?? "file:./dev.db",
  },
});
