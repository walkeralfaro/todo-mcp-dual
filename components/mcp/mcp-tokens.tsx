"use client";

import { useState, useTransition } from "react";
import {
  generateMcpTokenAction,
  revokeMcpTokenAction,
} from "@/app/mcp/actions";
import type { McpTokenView } from "@/lib/mcp-tokens";
import { CopyButton } from "@/components/mcp/copy-button";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const fechaHora = new Intl.DateTimeFormat("es", {
  dateStyle: "medium",
  timeStyle: "short",
});
const fechaDia = new Intl.DateTimeFormat("es", { dateStyle: "medium" });

function formatFechaHora(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "—" : fechaHora.format(d);
}

function formatDia(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "—" : fechaDia.format(d);
}

function estaExpirado(token: McpTokenView): boolean {
  return token.expiresAt
    ? new Date(token.expiresAt).getTime() < Date.now()
    : false;
}

/**
 * Lista de tokens MCP con generación (visualización única) y revocación
 * (confirmación). Los datos iniciales llegan del servidor; las mutaciones
 * devuelven la lista actualizada desde la misma capa que los tools MCP.
 */
export function McpTokens({
  initialTokens,
}: {
  initialTokens: McpTokenView[];
}): React.JSX.Element {
  const [tokens, setTokens] = useState(initialTokens);
  const [error, setError] = useState<string | null>(null);

  const [genOpen, setGenOpen] = useState(false);
  const [createdToken, setCreatedToken] = useState<string | null>(null);
  const [generating, startGenerate] = useTransition();

  const [revokeTarget, setRevokeTarget] = useState<McpTokenView | null>(null);
  const [, startRevoke] = useTransition();

  function openGenerator(): void {
    setError(null);
    setCreatedToken(null);
    setGenOpen(true);
  }

  function closeGenerator(open: boolean): void {
    setGenOpen(open);
    if (!open) {
      setCreatedToken(null);
      setError(null);
    }
  }

  function confirmGenerate(): void {
    setError(null);
    startGenerate(async () => {
      const result = await generateMcpTokenAction();
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setCreatedToken(result.token);
      setTokens(result.tokens);
    });
  }

  function confirmRevoke(): void {
    const target = revokeTarget;
    setRevokeTarget(null);
    if (!target) return;
    setError(null);
    startRevoke(async () => {
      const result = await revokeMcpTokenAction(target.id);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setTokens(result.tokens);
    });
  }

  return (
    <section
      aria-labelledby="tokens-heading"
      className="rounded-md border border-ink/10 bg-elevated p-5 sm:p-6"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 id="tokens-heading" className="text-lg font-semibold">
            Tokens de acceso
          </h2>
          <p className="mt-1 max-w-[52ch] text-[15px] leading-[1.5] text-muted">
            Un token por cliente MCP. El valor completo se muestra una sola vez
            al generarlo; en la lista solo queda su prefijo.
          </p>
        </div>
        <Button
          type="button"
          onClick={openGenerator}
          data-testid="mcp-generate-btn"
        >
          Generar token
        </Button>
      </div>

      {error && (
        <p data-testid="mcp-error" className="mt-4 text-[15px] text-destructive">
          {error}
        </p>
      )}

      {tokens.length === 0 ? (
        <p data-testid="mcp-empty" className="mt-5 text-[15px] text-muted">
          Aún no hay tokens. Genera el primero para conectar tu agente.
        </p>
      ) : (
        <ul data-testid="mcp-token-list" className="mt-5 flex flex-col gap-3">
          {tokens.map((token) => (
            <li
              key={token.id}
              data-testid="mcp-token-row"
              className="rounded-md border border-ink/10 bg-ground p-4"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="break-all font-mono text-[15px]">
                    {token.tokenPrefix
                      ? `${token.tokenPrefix}…`
                      : "Token anterior (sin prefijo)"}
                    {estaExpirado(token) && (
                      <span className="ml-2 rounded-full border border-destructive/40 px-2 py-0.5 align-middle text-[13px] text-destructive">
                        Expirado
                      </span>
                    )}
                  </p>
                  <p className="mt-1 text-[13px] leading-[1.5] text-muted">
                    Creado el {formatFechaHora(token.createdAt)} · Último uso:{" "}
                    {token.lastUsedAt
                      ? formatFechaHora(token.lastUsedAt)
                      : "nunca"}{" "}
                    · Expira:{" "}
                    {token.expiresAt ? formatDia(token.expiresAt) : "sin caducidad"}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setError(null);
                    setRevokeTarget(token);
                  }}
                  data-testid="mcp-revoke-btn"
                >
                  Revocar
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <Dialog open={genOpen} onOpenChange={closeGenerator}>
        <DialogContent data-testid="mcp-generate-dialog">
          {createdToken === null ? (
            <>
              <DialogHeader>
                <DialogTitle>Generar token MCP</DialogTitle>
                <DialogDescription>
                  Se mostrará una única vez. Cópialo y guárdalo en tu cliente
                  MCP; después no podrás recuperarlo.
                </DialogDescription>
              </DialogHeader>
              {error && (
                <p data-testid="mcp-error" className="text-[15px] text-destructive">
                  {error}
                </p>
              )}
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => closeGenerator(false)}
                >
                  Cancelar
                </Button>
                <Button
                  type="button"
                  onClick={confirmGenerate}
                  disabled={generating}
                  data-testid="mcp-generate-confirm"
                >
                  {generating && <Spinner />}
                  Generar token
                </Button>
              </DialogFooter>
            </>
          ) : (
            <>
              <DialogHeader>
                <DialogTitle>Tu token MCP</DialogTitle>
                <DialogDescription data-testid="mcp-created-warning">
                  Este es el único momento en el que verás el token completo.
                  Guárdalo ahora.
                </DialogDescription>
              </DialogHeader>
              <code
                data-testid="mcp-created-token"
                className="block break-all rounded-md border border-ink/10 bg-ground px-3 py-2 font-mono text-[13px] leading-[1.6]"
              >
                {createdToken}
              </code>
              <DialogFooter>
                <CopyButton
                  value={createdToken}
                  label="Copiar token"
                  variant="default"
                  size="default"
                  data-testid="mcp-copy-token-btn"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => closeGenerator(false)}
                >
                  Cerrar
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={revokeTarget !== null}
        onOpenChange={(open) => {
          if (!open) setRevokeTarget(null);
        }}
      >
        <AlertDialogContent size="sm">
          <AlertDialogHeader>
            <AlertDialogTitle>Revocar token</AlertDialogTitle>
            <AlertDialogDescription>
              {revokeTarget?.tokenPrefix
                ? `El token ${revokeTarget.tokenPrefix}…`
                : "El token seleccionado"}{" "}
              dejará de funcionar de inmediato. Esta acción no se puede
              deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={confirmRevoke}
              data-testid="mcp-revoke-confirm"
            >
              Revocar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}
