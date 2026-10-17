"use client";

import { createAuthClient } from "better-auth/react";

/**
 * Cliente de autenticación Better Auth para componentes de cliente.
 * Instancia única (singleton) que expone useSession(), signIn(), signUp(), signOut().
 */
export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_BETTER_AUTH_URL ?? "http://localhost:3000",
});

export type Session = NonNullable<ReturnType<typeof authClient.useSession>["data"]>;
