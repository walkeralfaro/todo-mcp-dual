import { db } from "./db";
import { hashMcpToken } from "./mcp-tokens";

/**
 * Autentica un cliente MCP mediante Bearer token (Opción B).
 * - Lee `Authorization: Bearer <token>`.
 * - Calcula SHA-256 del token y lo contrasta con `McpToken.token` (hash).
 * - Valida expiración (`expiresAt`).
 * - Devuelve el `userId` asociado, o null si no es válido.
 */
export async function authenticateMcpBearer(request: Request): Promise<string | null> {
  const auth = request.headers.get("authorization");
  if (!auth || !auth.startsWith("Bearer ")) return null;
  const token = auth.slice("Bearer ".length).trim();
  if (!token) return null;

  const hash = hashMcpToken(token);
  const mcpToken = await db.mcpToken.findFirst({ where: { token: hash } });
  if (!mcpToken) return null;
  if (mcpToken.expiresAt && mcpToken.expiresAt < new Date()) return null;

  await db.mcpToken.update({
    where: { id: mcpToken.id },
    data: { lastUsedAt: new Date() },
  });
  return mcpToken.userId;
}
