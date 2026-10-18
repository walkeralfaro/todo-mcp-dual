"use client";

import { CopyButton } from "@/components/mcp/copy-button";
import { useOrigin } from "@/lib/use-origin";

/**
 * Configuración real para un cliente MCP, copiable.
 * El origen se resuelve en el navegador para que la configuración copiada
 * apunte al despliegue en uso; sin JS queda visible el endpoint relativo.
 */
export function McpConfigFragment(): React.JSX.Element {
  const origin = useOrigin();

  const config = JSON.stringify(
    {
      url: `${origin}/api/mcp`,
      headers: { Authorization: "Bearer tmcp_..." },
    },
    null,
    2,
  );

  return (
    <div
      data-ui
      data-testid="mcp-config-card"
      className="flex min-w-0 flex-col gap-4 rounded-2xl border border-ink/10 bg-surface p-4 sm:p-5"
    >
      <div>
        <p className="text-[13px] font-semibold text-ink">
          Configuración del cliente MCP
        </p>
        <p className="mt-1 text-[13px] leading-[1.5] text-muted">
          Sustituye el valor de ejemplo por el token que generes en tu cuenta.
        </p>
      </div>
      <pre className="ui-code min-w-0 whitespace-pre-wrap break-all font-mono text-[12px] leading-[1.65] sm:text-[13px]">
        {config}
      </pre>
      <CopyButton
        value={config}
        label="Copiar configuración"
        data-testid="hero-mcp-copy"
        className="h-11 w-full text-[14px]"
      />
    </div>
  );
}
