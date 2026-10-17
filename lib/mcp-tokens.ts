import { createHash, randomBytes } from "node:crypto";
import { db, type DbClient } from "./db";
import type { McpToken } from "./generated/prisma/client";
import { mcpTokenIdSchema } from "./validators";

/**
 * Ciclo de vida de los tokens de acceso MCP (Opción B):
 * - El valor en claro solo existe en memoria y se devuelve UNA vez al crear.
 * - Se persiste únicamente el hash SHA-256 (mismo esquema que `lib/mcp-auth.ts`).
 * - `tokenPrefix` guarda los primeros 8 caracteres para listar sin exponer.
 * - Expiración por defecto: 90 días.
 */

/** Prefijo de los tokens de acceso MCP. */
export const MCP_TOKEN_PREFIX = "tmcp_";
/** Días de validez por defecto de un token recién generado. */
export const MCP_TOKEN_DEFAULT_EXPIRY_DAYS = 90;
/** Longitud del prefijo visible persistido en `tokenPrefix`. */
export const MCP_TOKEN_PREFIX_LENGTH = 8;

export interface CreatedMcpToken {
  /** Valor en claro: se devuelve una única vez y nunca se persiste. */
  token: string;
  record: McpToken;
}

/**
 * Vista serializable de un token para la UI (sin hash). Las fechas van en ISO
 * para poder cruzar el límite servidor/cliente.
 */
export interface McpTokenView {
  id: string;
  tokenPrefix: string | null;
  createdAt: string;
  lastUsedAt: string | null;
  expiresAt: string | null;
}

export function toMcpTokenView(record: McpToken): McpTokenView {
  return {
    id: record.id,
    tokenPrefix: record.tokenPrefix,
    createdAt: record.createdAt.toISOString(),
    lastUsedAt: record.lastUsedAt?.toISOString() ?? null,
    expiresAt: record.expiresAt?.toISOString() ?? null,
  };
}

/** Hash SHA-256 en hex del token en claro (mismo esquema que `lib/mcp-auth.ts`). */
export function hashMcpToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export async function createMcpToken(
  userId: string,
  client: DbClient = db,
): Promise<CreatedMcpToken> {
  // 32 bytes aleatorios (256 bits) en base64url: 43 caracteres + prefijo.
  const token = `${MCP_TOKEN_PREFIX}${randomBytes(32).toString("base64url")}`;
  const expiresAt = new Date(
    Date.now() + MCP_TOKEN_DEFAULT_EXPIRY_DAYS * 24 * 60 * 60 * 1000,
  );
  const record = await client.mcpToken.create({
    data: {
      token: hashMcpToken(token),
      tokenPrefix: token.slice(0, MCP_TOKEN_PREFIX_LENGTH),
      userId,
      expiresAt,
    },
  });
  return { token, record };
}

export async function listMcpTokens(
  userId: string,
  client: DbClient = db,
): Promise<McpToken[]> {
  return client.mcpToken.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });
}

export async function revokeMcpToken(
  id: string,
  userId: string,
  client: DbClient = db,
): Promise<void> {
  const parsedId = mcpTokenIdSchema.parse(id);
  const found = await client.mcpToken.findUnique({ where: { id: parsedId } });
  // Mismo error para inexistente y ajeno: no se filtra qué tokens existen.
  if (!found || found.userId !== userId) {
    throw new Error("No se pudo revocar el token");
  }
  await client.mcpToken.delete({ where: { id: parsedId } });
}
