import { betterAuth } from "better-auth";
import { prismaAdapter } from "@better-auth/prisma-adapter";
import { db } from "@/lib/db";

/**
 * Instancia única de Better Auth.
 * - email + contraseña (registro abierto)
 * - Google OAuth
 * - Sesiones de base de datos (7 días de expiración)
 * - Adaptador Prisma sobre SQLite (dev) / Turso (prod)
 */
export const auth = betterAuth({
  database: prismaAdapter(db, {
    provider: "sqlite",
  }),
  emailAndPassword: {
    enabled: true,
    // Alineado con la UI (mínimo 8). El valor de fábrica ya era 8, pero se
    // fija explícito para que cada cambio mínimo sea una decisión del repo.
    minPasswordLength: 8,
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 días
    updateAge: 60 * 60 * 24, // se renueva cada 1 día
  },
});
