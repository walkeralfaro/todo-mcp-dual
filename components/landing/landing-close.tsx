import { LandingCta } from "@/components/landing/landing-cta";

/** Fragmento de la lista de tokens (flanco izquierdo del cierre). */
function TokenListFragment(): React.JSX.Element {
  const tokens = [
    ["tmcp_ab12…", "Creado 12/10 · Expira 10/01"],
    ["tmcp_7f3d…", "Creado 2/10 · Uso 15/10"],
    ["tmcp_e091…", "Creado 28/9 · Expira 27/12"],
  ];
  return (
    <div
      data-ui
      className="flex h-full flex-col gap-[0.3em] overflow-hidden rounded-lg bg-surface p-[0.4em]"
      style={{ fontSize: 40 }}
    >
      {tokens.map(([prefijo, fechas]) => (
        <div
          key={prefijo}
          className="ui-card flex flex-col gap-[0.15em] p-[0.3em] text-[0.34em]"
        >
          <span className="tabular-nums text-ink">{prefijo}</span>
          <span className="text-muted">{fechas}</span>
          <span className="ui-block self-start bg-ground text-destructive">
            Revocar
          </span>
        </div>
      ))}
    </div>
  );
}

/** Cierre: fila de tres tiles (fragmento, tile de acción acento, campo liso). */
export function LandingClose(): React.JSX.Element {
  return (
    <section
      aria-labelledby="cierre-title"
      className="grid grid-cols-2 gap-2 md:grid-cols-12"
    >
      <div className="order-2 col-span-1 h-40 md:order-none md:col-span-2 md:h-[360px]">
        <TokenListFragment />
      </div>

      <div className="order-1 col-span-2 flex flex-col items-start justify-center gap-4 rounded-lg bg-accent p-8 text-[#06130c] md:order-none md:col-span-8 md:min-h-[360px] md:p-10">
        <h2
          id="cierre-title"
          className="text-[clamp(2rem,4.4vw,4.25rem)] font-semibold leading-[1.02] tracking-[-0.03em]"
        >
          Todo empieza en una lista
        </h2>
        <p className="max-w-[46ch] text-[16px] leading-[1.5]">
          Tu cuenta, tu token y tu cliente MCP en unos minutos.
        </p>
        <p className="max-w-[46ch] text-[16px] leading-[1.5] text-[#06130c]/80">
          Después: crear, filtrar, completar y borrar desde el agente.
        </p>
        <div className="mt-2">
          <LandingCta variant="close" testIdPrefix="landing-close" />
        </div>
      </div>

      <div
        aria-hidden
        className="order-2 col-span-1 h-40 rounded-lg bg-ink md:order-none md:col-span-2 md:h-[360px]"
      />
    </section>
  );
}

const BLOQUES: Array<{ ch: string; tono: string; altura: number }> = [
  { ch: "T", tono: "bg-elevated text-ink", altura: 1 },
  { ch: "O", tono: "bg-ink text-ground", altura: 0.82 },
  { ch: "D", tono: "bg-elevated text-ink", altura: 0.94 },
  { ch: "O", tono: "bg-accent text-[#06130c]", altura: 0.72 },
  { ch: "A", tono: "bg-ink text-ground", altura: 0.88 },
  { ch: "P", tono: "bg-elevated text-ink", altura: 0.68 },
  { ch: "P", tono: "bg-ink text-ground", altura: 0.84 },
];

const ENLACES_PAGINA = [
  ["La lista", "#lista"],
  ["Tus agentes", "#agentes"],
  ["Herramientas", "#herramientas"],
  ["La letra pequeña", "#cuidado"],
] as const;

/** footer — «the mark, built large»: la marca en bloques y las rutas reales. */
export function LandingFooter(): React.JSX.Element {
  return (
    <footer className="rounded-lg bg-surface px-5 py-8 sm:px-8 sm:py-10">
      <div
        aria-hidden
        className="flex h-[22svh] max-h-[320px] min-h-[160px] items-end gap-1 md:h-[34svh] md:max-h-[360px]"
      >
        {BLOQUES.map((bloque, i) => (
          <div
            key={`${bloque.ch}-${i}`}
            style={{ height: `${bloque.altura * 100}%` }}
            className={`flex flex-1 items-center justify-center rounded-sm ${bloque.tono}`}
          >
            <span className="text-[clamp(3.5rem,12vw,10rem)] font-semibold leading-none tracking-[-0.03em]">
              {bloque.ch}
            </span>
          </div>
        ))}
      </div>

      <nav aria-label="Mapa del sitio" className="mt-12 grid grid-cols-2 gap-8 md:mt-14 md:grid-cols-12">
        <div className="md:col-span-3">
          <p className="text-[15px] font-medium text-ink">La página</p>
          <ul className="mt-3 flex flex-col gap-2">
            {ENLACES_PAGINA.map(([label, href]) => (
              <li key={href}>
                <a
                  href={href}
                  className="inline-flex h-9 items-center text-[15px] text-muted hover:text-ink"
                >
                  {label}
                </a>
              </li>
            ))}
          </ul>
        </div>
        <div className="md:col-span-3">
          <p className="text-[15px] font-medium text-ink">Producto</p>
          <ul className="mt-3 flex flex-col gap-2">
            <li>
              <a
                href="/tareas"
                className="inline-flex h-9 items-center text-[15px] text-muted hover:text-ink"
              >
                Mis tareas
              </a>
            </li>
            <li>
              <a
                href="/mcp"
                className="inline-flex h-9 items-center text-[15px] text-muted hover:text-ink"
              >
                Tokens MCP
              </a>
            </li>
          </ul>
        </div>
        <div className="col-span-2 flex flex-col gap-2 md:col-span-6">
          <p className="text-[15px] leading-[1.5] text-muted">
            Servidor MCP · /api/mcp (HTTP y Authorization: Bearer)
          </p>
          <p className="text-[15px] leading-[1.5] text-muted">
            Interfaz, servidor y datos en el mismo proyecto.
          </p>
        </div>
      </nav>

      <div className="mt-10 flex flex-wrap items-center justify-between gap-4">
        <p className="text-[13px] text-muted">© 2026 Todo App</p>
        <LandingCta variant="footer" testIdPrefix="landing-footer" />
      </div>
    </footer>
  );
}
