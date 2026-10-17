"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import {
  createMcpToken,
  listMcpTokens,
  revokeMcpToken,
  toMcpTokenView,
  type McpTokenView,
} from "@/lib/mcp-tokens";

/**
 * Server Actions de tokens MCP (misma capa Prisma que la UI y el servidor MCP).
 * Todas exigen sesión y operan siempre sobre el usuario autenticado.
 */

export type McpTokensResult =
  | { ok: true; tokens: McpTokenView[] }
  | { ok: false; error: string };

export type GenerateMcpTokenResult =
  | { ok: true; token: string; tokens: McpTokenView[] }
  | { ok: false; error: string };

async function currentUserId(): Promise<string | null> {
  const session = await auth.api.getSession({ headers: await headers() });
  return session?.user?.id ?? null;
}

async function tokensForUser(userId: string): Promise<McpTokenView[]> {
  const rows = await listMcpTokens(userId);
  return rows.map(toMcpTokenView);
}

export async function listMcpTokensAction(): Promise<McpTokensResult> {
  try {
    const userId = await currentUserId();
    if (!userId) return { ok: false, error: "No autenticado" };
    return { ok: true, tokens: await tokensForUser(userId) };
  } catch {
    return { ok: false, error: "No se pudieron cargar los tokens." };
  }
}

export async function generateMcpTokenAction(): Promise<GenerateMcpTokenResult> {
  try {
    const userId = await currentUserId();
    if (!userId) return { ok: false, error: "No autenticado" };
    const { token } = await createMcpToken(userId);
    revalidatePath("/mcp");
    return { ok: true, token, tokens: await tokensForUser(userId) };
  } catch {
    return { ok: false, error: "No se pudo generar el token. Inténtalo de nuevo." };
  }
}

export async function revokeMcpTokenAction(
  id: string,
): Promise<McpTokensResult> {
  try {
    const userId = await currentUserId();
    if (!userId) return { ok: false, error: "No autenticado" };
    await revokeMcpToken(id, userId);
    revalidatePath("/mcp");
    return { ok: true, tokens: await tokensForUser(userId) };
  } catch {
    return { ok: false, error: "No se pudo revocar el token. Inténtalo de nuevo." };
  }
}
