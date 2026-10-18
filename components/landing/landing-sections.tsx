import { Reveal } from "@/components/landing/reveal";
import { McpConfigFragment } from "@/components/landing/mcp-config";

const PASOS = [
  {
    numero: "01",
    titulo: "Crea tu cuenta",
    detalle: "Tus tareas quedan asociadas a tu cuenta.",
  },
  {
    numero: "02",
    titulo: "Genera un token MCP",
    detalle: "Desde Tokens MCP, crea una credencial para tu agente.",
  },
  {
    numero: "03",
    titulo: "Configura tu cliente",
    detalle: "Copia el endpoint y añade tu token como cabecera Bearer.",
  },
];

/** Explica la conexión MCP con acciones concretas y la configuración copiable. */
export function McpSetup(): React.JSX.Element {
  return (
    <section id="agentes" aria-labelledby="agentes-title" className="scroll-mt-24">
      <div className="mb-8 max-w-[680px]">
        <p className="text-[13px] font-semibold uppercase tracking-[0.14em] text-accent">
          Para tus agentes
        </p>
        <h2
          id="agentes-title"
          className="mt-3 text-[clamp(2rem,6vw,3.5rem)] font-semibold leading-[1.02] tracking-[-0.045em]"
        >
          Conecta un agente MCP
        </h2>
        <p className="mt-4 max-w-[58ch] text-[16px] leading-[1.6] text-muted sm:text-[17px]">
          Autoriza a tu cliente y el agente podrá trabajar con las tareas de tu
          cuenta a través del mismo servidor.
        </p>
      </div>

      <div className="grid gap-5 lg:grid-cols-[0.85fr_1.15fr] lg:gap-8">
        <ol className="divide-y divide-ink/10 rounded-2xl border border-ink/10 bg-surface px-5 sm:px-7">
          {PASOS.map((paso) => (
            <li key={paso.numero} className="flex gap-4 py-5 sm:gap-5 sm:py-6">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-elevated text-[13px] font-semibold tabular-nums text-accent">
                {paso.numero}
              </span>
              <span className="min-w-0 pt-0.5">
                <span className="block text-[16px] font-semibold text-ink sm:text-[17px]">
                  {paso.titulo}
                </span>
                <span className="mt-1 block text-[14px] leading-[1.55] text-muted">
                  {paso.detalle}
                </span>
              </span>
            </li>
          ))}
        </ol>
        <Reveal className="min-w-0">
          <McpConfigFragment />
        </Reveal>
      </div>
    </section>
  );
}

interface Herramienta {
  nombre: string;
  params: Array<[string, string]>;
}

const HERRAMIENTAS: Herramienta[] = [
  {
    nombre: "create_task",
    params: [
      ["titulo", "texto · 1–100"],
      ["descripcion", "texto · hasta 500, opcional"],
      ["estado", "por defecto PENDIENTE"],
    ],
  },
  {
    nombre: "list_tasks",
    params: [
      ["estado", "filtro opcional"],
      ["q", "busca en título y descripción"],
      ["limit", "por defecto 50, máximo 100"],
      ["offset", "paginación"],
    ],
  },
  {
    nombre: "update_task",
    params: [
      ["id", "obligatorio"],
      ["titulo, descripcion, estado", "lo que cambie"],
    ],
  },
  { nombre: "get_task", params: [["id", "obligatorio"]] },
  { nombre: "delete_task", params: [["id", "obligatorio"]] },
];

/** Lista las herramientas MCP sin competir visualmente con la demo. */
export function Tools(): React.JSX.Element {
  return (
    <section id="herramientas" aria-labelledby="herramientas-title" className="scroll-mt-24">
      <div className="mb-7 max-w-[680px]">
        <p className="text-[13px] font-semibold uppercase tracking-[0.14em] text-accent">
          Lo que puede hacer
        </p>
        <h2
          id="herramientas-title"
          className="mt-3 text-[clamp(2rem,6vw,3.5rem)] font-semibold leading-[1.02] tracking-[-0.045em]"
        >
          Las herramientas del agente
        </h2>
        <p className="mt-4 text-[16px] leading-[1.6] text-muted">
          Crear, consultar, actualizar y eliminar tareas desde un cliente MCP.
        </p>
      </div>

      <div className="flex flex-col gap-2">
        {HERRAMIENTAS.map((tool, index) => (
          <details
            key={tool.nombre}
            data-ui
            open={index === 0}
            className="ui-bar rounded-xl border border-ink/10 bg-surface open:bg-elevated"
          >
            <summary className="text-[15px] sm:text-[16px]">
              <span className="font-medium">{tool.nombre}</span>
              <span aria-hidden className="ui-plus text-[20px] text-muted">
                +
              </span>
            </summary>
            <dl className="grid grid-cols-[minmax(0,9rem)_1fr] gap-x-4 gap-y-2 px-4 pb-5 pt-1 text-[14px] sm:px-5 sm:text-[15px]">
              {tool.params.map(([param, spec]) => (
                <div key={param} className="col-span-2 grid grid-cols-subgrid">
                  <dt className="break-words text-ink">{param}</dt>
                  <dd className="min-w-0 text-muted">{spec}</dd>
                </div>
              ))}
            </dl>
          </details>
        ))}
      </div>
    </section>
  );
}
