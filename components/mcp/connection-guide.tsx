"use client";

import { CopyButton } from "@/components/mcp/copy-button";
import { useOrigin } from "@/lib/use-origin";

/**
 * Instrucciones copiables para conectar un cliente MCP por HTTP con la
 * cabecera Bearer. El origen real se resuelve en el navegador para que la
 * configuración copiada apunte al despliegue en uso.
 */
export function ConnectionGuide(): React.JSX.Element {
  const origin = useOrigin();

  const endpoint = `${origin}/api/mcp`;
  const config = JSON.stringify(
    {
      mcpServers: {
        "todo-mcp": {
          url: endpoint,
          headers: { Authorization: "Bearer <TU_TOKEN>" },
        },
      },
    },
    null,
    2,
  );

  return (
    <section
      aria-labelledby="conexion-heading"
      className="rounded-md border border-ink/10 bg-elevated p-5 sm:p-6"
    >
      <h2 id="conexion-heading" className="text-lg font-semibold">
        Conectar un cliente MCP
      </h2>
      <ol className="mt-3 list-decimal space-y-1 pl-5 text-[15px] leading-[1.5] text-muted">
        <li>Genera un token y cópialo.</li>
        <li>
          Añade este servidor a la configuración de tu cliente MCP (HTTP con
          cabecera Bearer).
        </li>
        <li>
          Los agentes operan sobre las mismas tareas que ves en la interfaz.
        </li>
      </ol>

      <div className="mt-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-[13px] font-medium uppercase tracking-wide text-muted">
            Configuración
          </p>
          <CopyButton
            value={config}
            label="Copiar configuración"
            data-testid="mcp-copy-config-btn"
          />
        </div>
        <pre
          data-testid="mcp-config-block"
          className="mt-2 overflow-x-auto rounded-md border border-ink/10 bg-ground p-3 font-mono text-[13px] leading-[1.6]"
        >
          {config}
        </pre>
      </div>

      <p className="mt-3 text-[13px] leading-[1.5] text-muted">
        El endpoint valida <code className="font-mono">Authorization: Bearer
        &lt;token&gt;</code> en cada petición; los tokens revocados o expirados
        responden 401.
      </p>
    </section>
  );
}
