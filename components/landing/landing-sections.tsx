import type { ReactNode } from "react";
import { Reveal } from "@/components/landing/reveal";
import { cn } from "@/lib/utils";

/**
 * Secciones centrales de la landing, todas sobre el mismo tablero continuo
 * de la dirección `dense-tiles`: mosaico de primeros planos de la interfaz,
 * barra de etapas y lista de herramientas. Los fragmentos van marcados
 * `data-ui` y sus interiores se construyen en `em` desde la raíz.
 */

type Tono = "accent" | "surface" | "elevated" | "ink";

const TONO: Record<Tono, string> = {
  accent: "bg-accent text-[#06130c]",
  surface: "bg-surface text-ink",
  elevated: "bg-elevated text-ink",
  ink: "bg-ink text-ground",
};

/** Tile con pie de texto: nombre a 19px y una línea de 16px (2 líneas fijas). */
function Tile({
  className,
  tono,
  nombre,
  linea,
  ui,
  delay = 0,
}: {
  className?: string;
  tono: Tono;
  nombre: ReactNode;
  linea?: ReactNode;
  ui?: ReactNode;
  delay?: number;
}): React.JSX.Element {
  return (
    <Reveal className={className} delay={delay}>
      <div
        className={cn(
          "relative flex h-full min-h-[10rem] flex-col justify-end overflow-hidden rounded-lg p-4 sm:p-5",
          TONO[tono],
        )}
      >
        {ui && (
          <div
            data-ui
            aria-hidden
            style={{ fontSize: 40 }}
            className="absolute inset-0 overflow-hidden"
          >
            {ui}
          </div>
        )}
        {/* Placa del pie: mismo tono que el tile, para que el fragmento que
            asoma por debajo quede recortado en limpio y nunca pise al texto. */}
        <div
          className={cn(
            "relative -mx-4 -mb-4 mt-2 px-4 pb-4 pt-3 sm:-mx-5 sm:-mb-5 sm:px-5 sm:pb-5",
            TONO[tono],
          )}
        >
          <p className="text-[19px] font-medium leading-tight">{nombre}</p>
          {linea && (
            <p
              className={cn(
                "mt-1 min-h-[2.6em] max-w-[30ch] text-[16px] leading-[1.3]",
                tono === "ink" ? "text-ground/80" : tono === "accent" ? "text-[#06130c]/80" : "text-muted",
              )}
            >
              {linea}
            </p>
          )}
        </div>
      </div>
    </Reveal>
  );
}

/** features — «close-ups on a board»: mosaico de macros de piezas reales. */
export function Mosaic(): React.JSX.Element {
  return (
    <section id="cuidado" aria-labelledby="cuidado-title">
      <div className="grid grid-cols-2 gap-1.5 lg:grid-cols-12 lg:grid-rows-[repeat(6,6.5rem)] lg:gap-2">
        <Reveal className="col-span-2 lg:col-span-6 lg:row-span-2">
          <div className="flex h-full flex-col justify-center rounded-lg bg-accent p-5 text-[#06130c]">
            <h2
              id="cuidado-title"
              className="text-[clamp(2rem,4.4vw,4.25rem)] font-semibold leading-[1.02] tracking-[-0.03em]"
            >
              La letra pequeña
            </h2>
          </div>
        </Reveal>

        <Tile
          className="col-span-1 h-52 lg:col-span-3 lg:row-span-2 lg:h-auto"
          tono="surface"
          delay={40}
          nombre="Estados"
          linea="Tres estados, un clic para cambiar."
          ui={
            <div className="-translate-x-[0.8em] translate-y-[0.5em] p-[0.5em] text-[0.55em]">
              <div className="flex flex-col gap-[0.35em]">
                <span className="ui-block bg-elevated text-muted">PENDIENTE</span>
                <span className="ui-block bg-ink text-ground">EN_PROCESO</span>
                <span className="ui-block bg-accent text-[#06130c]">COMPLETADA</span>
              </div>
            </div>
          }
        />
        <Tile
          className="col-span-1 h-52 lg:col-span-3 lg:row-span-2 lg:h-auto"
          tono="elevated"
          delay={80}
          nombre="Filtros"
          linea="La lista se filtra por estado al momento."
          ui={
            <div className="flex translate-x-[1.5em] translate-y-[0.3em] gap-[0.4em] p-[0.5em] text-[0.5em]">
              <span className="ui-chip bg-ink text-ground">TODAS</span>
              <span className="ui-chip bg-ground text-muted">PENDIENTE</span>
              <span className="ui-chip bg-ground text-muted">EN_PROCESO</span>
              <span className="ui-chip bg-ground text-muted">COMPLETADA</span>
            </div>
          }
        />

        <Tile
          className="col-span-2 h-[22rem] lg:col-span-6 lg:row-span-4 lg:h-auto"
          tono="ink"
          delay={120}
          nombre="Tokens"
          linea="Cada token muestra solo su prefijo y nada más."
          ui={
            <div className="flex h-full -translate-x-[1em] flex-col justify-center gap-[0.35em] p-[0.5em] text-[0.5em]">
              <span className="text-[1.3em] font-medium tabular-nums leading-none tracking-[-0.02em] text-ground">
                tmcp_ab12…
              </span>
              <span className="text-[0.55em] text-ground/80">
                Creado 12/10 · Último uso 16/10 · Expira 10/01
              </span>
              <span className="ui-block self-start bg-ground text-destructive">
                Revocar
              </span>
            </div>
          }
        />

        <Tile
          className="col-span-1 h-52 lg:col-span-3 lg:row-span-2 lg:h-auto"
          tono="elevated"
          delay={160}
          nombre="El día"
          linea="El titular cuenta tus pendientes de hoy."
          ui={
            <div className="flex -translate-x-[0.6em] flex-col justify-center gap-[0.1em] p-[0.5em]">
              <span className="text-[0.45em] text-muted">Hoy quedan</span>
              <span className="tabular-nums text-[1.5em] font-semibold leading-none text-accent">
                4
              </span>
            </div>
          }
        />
        <Tile
          className="col-span-1 h-52 lg:col-span-3 lg:row-span-2 lg:h-auto"
          tono="surface"
          delay={200}
          nombre="Caducidad"
          linea="90 días por defecto; el uso se anota."
          ui={
            <div className="flex translate-y-[0.8em] flex-col gap-[0.3em] p-[0.5em] text-[0.5em]">
              <span className="ui-chip self-start bg-ground text-ink">
                Expira 10/01
              </span>
              <span className="text-[0.7em] text-muted">90 días · uso anotado</span>
            </div>
          }
        />
        <Tile
          className="col-span-1 h-52 lg:col-span-3 lg:row-span-2 lg:h-auto"
          tono="surface"
          delay={240}
          nombre="Revocar"
          linea="Revocar un token corta el acceso de inmediato."
          ui={
            <div className="flex translate-y-[0.6em] justify-center p-[0.5em]">
              <div className="ui-dialog w-[85%] p-[0.5em] text-[0.5em]">
                <p className="text-[0.9em] font-medium text-ink">
                  ¿Revocar este token?
                </p>
                <p className="mt-[0.3em] text-[0.7em] text-muted">
                  El acceso se corta al momento.
                </p>
                <div className="mt-[0.5em] flex gap-[0.3em]">
                  <span className="ui-chip bg-elevated text-ink">Cancelar</span>
                  <span className="ui-chip bg-destructive text-ground">
                    Revocar
                  </span>
                </div>
              </div>
            </div>
          }
        />
        <Tile
          className="col-span-1 h-52 lg:col-span-3 lg:row-span-2 lg:h-auto"
          tono="ink"
          delay={280}
          nombre="Tu cuenta"
          linea="Cada usuario ve únicamente sus propias tareas."
          ui={
            <div className="flex -translate-x-[0.5em] items-center gap-[0.5em] p-[0.5em] text-[0.5em]">
              <span className="flex size-[1.7em] shrink-0 items-center justify-center rounded-full bg-accent text-[0.7em] font-semibold text-[#06130c]">
                A
              </span>
              <span className="text-ground">ana@ejemplo.com</span>
            </div>
          }
        />
      </div>
    </section>
  );
}

const ETAPAS = [
  {
    grow: 1,
    duracion: "1 minuto",
    tono: "bg-surface text-ink",
    clausula: "Primero, una cuenta con Google o email.",
  },
  {
    grow: 1,
    duracion: "30 segundos",
    tono: "bg-elevated text-ink",
    clausula: "Segundo, un token desde /mcp.",
  },
  {
    grow: 2,
    duracion: "2 minutos",
    tono: "bg-ink text-ground",
    clausula: "Tercero, pega la configuración en tu cliente MCP.",
  },
  {
    grow: 6,
    duracion: "A partir de ahí",
    tono: "bg-accent text-[#06130c]",
    clausula: "Tu agente crea, filtra, completa y borra.",
  },
];

/** how-it-works — «stages as one bar»: la barra de progreso como diagrama. */
export function Stages(): React.JSX.Element {
  return (
    <section id="agentes" aria-labelledby="agentes-title">
      <Reveal>
        <h2
          id="agentes-title"
          className="px-1 pt-2 text-[clamp(2rem,4.4vw,4.25rem)] font-semibold leading-[1.02] tracking-[-0.03em]"
        >
          Cuenta, token, agente
        </h2>
      </Reveal>
      <Reveal delay={60}>
        <div
          data-ui
          className="mt-4 flex flex-col gap-1.5 md:flex-row md:gap-1.5"
        >
          {ETAPAS.map((etapa, i) => (
            <div
              key={etapa.duracion}
              style={{ flexGrow: etapa.grow, minWidth: "12%" }}
              className={cn(
                "flex min-h-[4.5rem] flex-col justify-between rounded-lg p-4 md:min-h-0 md:h-[22vh] md:p-5",
                etapa.tono,
              )}
            >
              <p className="text-[22px] font-medium md:text-[clamp(20px,2vw,30px)]">
                {etapa.duracion}
              </p>
              <p className="mt-2 max-w-[24ch] text-[16px] leading-[1.4] opacity-80 lg:hidden">
                {etapa.clausula}
              </p>
            </div>
          ))}
        </div>
      </Reveal>
      <div className="mt-3 hidden lg:grid lg:grid-cols-12 lg:gap-1.5">
        {ETAPAS.map((etapa, i) => (
          <p
            key={etapa.clausula}
            className="text-[17px] leading-[1.4] text-muted"
            style={{
              gridColumn: i === 0 ? "span 1" : i === 1 ? "span 1" : i === 2 ? "span 2" : "span 6",
            }}
          >
            {etapa.clausula}
          </p>
        ))}
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

/** list — «giant word, bar rows»: la palabra-póster y las cinco tools reales. */
export function Tools(): React.JSX.Element {
  return (
    <section
      id="herramientas"
      aria-labelledby="herramientas-title"
      className="grid grid-cols-1 gap-2 md:grid-cols-12"
    >
      <div className="tools-column flex items-end md:col-span-5">
        <p
          aria-hidden
          className="select-none text-[46cqw] font-semibold leading-[0.8] tracking-[-0.045em] text-ink"
        >
          <span translate="no">MCP</span>
        </p>
      </div>
      <div className="flex flex-col gap-1.5 md:col-span-7">
        <h2 id="herramientas-title" className="sr-only">
          Las cinco herramientas MCP
        </h2>
        {HERRAMIENTAS.map((tool, i) => (
          <Reveal key={tool.nombre} delay={i * 50}>
            <details data-ui open={i === 0} className="ui-bar rounded-lg bg-surface open:bg-elevated">
              <summary className="text-[16px]">
                <span className="font-medium">{tool.nombre}</span>
                <span aria-hidden className="ui-plus text-[20px] text-muted">
                  +
                </span>
              </summary>
              <dl className="grid grid-cols-[minmax(0,9rem)_1fr] gap-x-4 gap-y-1.5 px-[18px] pb-4 pt-1 text-[15px]">
                {tool.params.map(([param, spec]) => (
                  <div key={param} className="col-span-2 grid grid-cols-subgrid">
                    <dt className="text-ink">{param}</dt>
                    <dd className="min-w-0 text-muted">{spec}</dd>
                  </div>
                ))}
              </dl>
            </details>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
