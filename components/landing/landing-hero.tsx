import { Reveal } from "@/components/landing/reveal";
import { LandingCta } from "@/components/landing/landing-cta";
import type { AuthTab } from "@/components/ui-auth/auth-modal";
import {
  FragBearer,
  FragDayCount,
  FragStatus,
  FragTask,
  FragTokenRow,
} from "@/components/landing/ui-fragments";
import { McpConfigFragment } from "@/components/landing/mcp-config";

const SECTIONS = [
  { href: "#lista", label: "La lista" },
  { href: "#agentes", label: "Tus agentes" },
  { href: "#herramientas", label: "Herramientas" },
];

/**
 * Primera pantalla: el tablero completo del producto como composición
 * continua (12 columnas × 6 filas en escritorio; pila en móvil). El tile de
 * texto lleva la marca y la acción; el resto son fragmentos reales de la
 * interfaz marcados `data-ui`.
 */
export function LandingHero({
  initialTab,
  next,
}: {
  initialTab?: AuthTab | null;
  next?: string | null;
}): React.JSX.Element {
  return (
    <section
      aria-labelledby="landing-title"
      className="grid grid-cols-2 gap-2 lg:grid-cols-12 lg:grid-rows-[repeat(6,7rem)]"
    >
      <Reveal className="col-span-2 lg:col-span-6 lg:row-span-4">
        <div className="flex h-full flex-col justify-between gap-8 rounded-lg bg-accent p-5 text-[#06130c] sm:p-8">
          <div>
            <p className="text-[28px] font-semibold tracking-[-0.02em]">
              Todo App
            </p>
            <h1
              id="landing-title"
              className="mt-6 text-[clamp(2rem,4.4vw,4.25rem)] font-semibold leading-[1.02] tracking-[-0.03em]"
            >
              Tus tareas, para ti
              <br />y para tus agentes
            </h1>
            <p className="mt-5 max-w-[42ch] text-[17px] leading-[1.5]">
              Interfaz web y servidor MCP sobre la misma lista: tú la ves, tus
              agentes la mueven.
            </p>
            <div className="mt-8">
              <LandingCta initialTab={initialTab} next={next} />
            </div>
          </div>
          <nav aria-label="Secciones de la página" className="flex flex-wrap gap-x-6 gap-y-2 text-[15px]">
            {SECTIONS.map((s) => (
              <a
                key={s.href}
                href={s.href}
                className="inline-flex h-11 items-center font-medium underline decoration-[#06130c]/40 underline-offset-4 hover:decoration-[#06130c]"
              >
                {s.label}
              </a>
            ))}
          </nav>
        </div>
      </Reveal>

      <Reveal className="col-span-2 h-48 lg:col-span-6 lg:row-span-2 lg:h-auto" delay={60}>
        <FragDayCount />
      </Reveal>
      <Reveal className="col-span-1 h-40 lg:col-span-3 lg:row-span-2 lg:h-auto" delay={100}>
        <FragStatus />
      </Reveal>
      <Reveal className="col-span-1 h-40 lg:col-span-3 lg:row-span-2 lg:h-auto" delay={140}>
        <FragTokenRow />
      </Reveal>
      <Reveal className="col-span-2 h-72 lg:col-span-5 lg:row-span-2 lg:h-auto" delay={100}>
        <McpConfigFragment />
      </Reveal>
      <Reveal className="col-span-2 h-40 lg:col-span-5 lg:row-span-2 lg:h-auto" delay={140}>
        <FragTask />
      </Reveal>
      <Reveal className="col-span-2 h-40 lg:col-span-2 lg:row-span-2 lg:h-auto" delay={180}>
        <FragBearer />
      </Reveal>
    </section>
  );
}
