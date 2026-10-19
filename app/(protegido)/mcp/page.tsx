import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { listMcpTokensAction } from "@/app/mcp/actions";
import { ConnectionGuide } from "@/components/mcp/connection-guide";
import { McpTokens } from "@/components/mcp/mcp-tokens";

export const metadata: Metadata = { title: "Tokens MCP · Todo App" };

export default async function McpPage() {
  // El layout de `app/(protegido)` ya garantiza sesión; la acción repite la
  // comprobación (defensa en profundidad) y solo devuelve tokens propios.
  const result = await listMcpTokensAction();
  if (!result.ok) redirect("/?auth=login&next=%2Fmcp");

  return (
    <div className="mx-auto flex w-full max-w-[768px] flex-1 flex-col gap-8 px-5 py-8 lg:py-10">
      <header>
        <h1 className="font-display text-[clamp(2rem,4vw,3rem)] font-semibold leading-[1.1] tracking-[-0.035em]">
          Tokens MCP
        </h1>
        <p className="mt-3 text-[17px] leading-[1.5] text-muted">
          Llaves para que tus agentes operen sobre la misma base de tareas que
          la interfaz web.
        </p>
      </header>

      <McpTokens initialTokens={result.tokens} />
      <ConnectionGuide />
    </div>
  );
}
