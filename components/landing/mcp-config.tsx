"use client";

import { useEffect, useState } from "react";
import { CopyButton } from "@/components/mcp/copy-button";

/**
 * Fragmento del hero: configuración real para un cliente MCP, copiable.
 * El origen se resuelve en el navegador para que la configuración copiada
 * apunte al despliegue en uso; sin JS queda visible el endpoint relativo.
 */
export function McpConfigFragment(): React.JSX.Element {
  const [origin, setOrigin] = useState("");

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

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
      style={{ fontSize: 40 }}
      className="relative flex h-full flex-col overflow-hidden rounded-lg bg-ground"
    >
      <div className="flex min-h-0 flex-1 flex-col gap-[0.3em] p-[0.35em]">
        <span className="text-[0.33em] font-medium text-muted">
          Configuración del cliente MCP
        </span>
        <pre className="ui-code min-h-0 flex-1 text-[13px]">{config}</pre>
        <CopyButton
          value={config}
          label="Copiar configuración"
          data-testid="hero-mcp-copy"
          className="h-11 w-full text-[14px]"
        />
      </div>
      <div className="ui-strip shrink-0 bg-accent text-[#06130c]">
        Tu cliente MCP
      </div>
    </div>
  );
}
