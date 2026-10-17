/**
 * Rutas de autenticación Next.js (App Router) con Better Auth.
 * Expone /api/auth/sign-in, /api/auth/sign-up, /api/auth/session, /api/auth/sign-out
 * y los callbacks de Google OAuth.
 * Registro abierto: cualquier usuario puede crear cuenta con email+contraseña o Google.
 */
import { toNextJsHandler } from "better-auth/next-js";
import { auth } from "@/lib/auth";

const { GET, POST } = toNextJsHandler(auth);

export { GET, POST };
