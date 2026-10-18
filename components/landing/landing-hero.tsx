import { LandingCta } from "@/components/landing/landing-cta";
import type { AuthTab } from "@/components/ui-auth/auth-modal";

const SECTIONS = [
  { href: "#lista", label: "Ver la demo" },
  { href: "#agentes", label: "Conectar un agente" },
];

/** Presenta la promesa del producto con una vista compacta de la misma lista. */
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
      className="grid items-center gap-10 py-10 sm:gap-14 sm:py-16 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16"
    >
      <div className="max-w-[650px]">
        <p className="mb-5 inline-flex rounded-full border border-ink/10 bg-surface px-3 py-1.5 text-[13px] font-medium text-muted">
          Web y MCP sobre la misma lista
        </p>
        <h1
          id="landing-title"
          className="text-[clamp(1.75rem,5.7vw,4.25rem)] font-semibold leading-[0.98] tracking-[-0.055em] text-ink"
        >
          <span className="block">Tus tareas, para ti</span>
          <span className="block text-accent">y para tus agentes</span>
        </h1>
        <p className="mt-6 max-w-[49ch] text-[17px] leading-[1.6] text-muted sm:text-[18px]">
          Organiza tu trabajo desde la web y deja que tus agentes consulten y
          actualicen esa misma lista con MCP.
        </p>
        <div className="mt-8">
          <LandingCta initialTab={initialTab} next={next} />
        </div>
        <nav
          aria-label="Secciones de la página"
          className="mt-7 flex flex-wrap gap-x-6 gap-y-2 text-[14px]"
        >
          {SECTIONS.map((section) => (
            <a
              key={section.href}
              href={section.href}
              className="inline-flex min-h-11 items-center font-medium text-muted underline decoration-ink/20 underline-offset-4 transition-colors hover:text-ink hover:decoration-ink/60"
            >
              {section.label}
            </a>
          ))}
        </nav>
      </div>

      <div
        aria-label="Vista de ejemplo de una lista compartida entre la web y MCP"
        data-testid="hero-product-preview"
        className="relative mx-auto w-full max-w-[520px] rounded-2xl border border-ink/10 bg-surface p-4 shadow-[0_24px_80px_rgba(0,0,0,0.24)] sm:p-6"
      >
        <div className="flex items-center justify-between gap-4 border-b border-ink/10 pb-4">
          <div>
            <p className="text-[13px] font-medium text-muted">Tu espacio</p>
            <p className="mt-1 text-[18px] font-semibold tracking-[-0.02em]">
              Lista de tareas
            </p>
          </div>
          <span className="rounded-full bg-elevated px-3 py-1.5 text-[12px] font-medium text-muted">
            Privada
          </span>
        </div>

        <ul className="divide-y divide-ink/10">
          <li className="flex min-h-[76px] items-center justify-between gap-4 py-4">
            <span className="min-w-0">
              <span className="block truncate text-[15px] font-medium text-ink sm:text-[16px]">
                Preparar la demo del viernes
              </span>
              <span className="mt-1 block text-[13px] text-muted">
                En la web o desde tu agente
              </span>
            </span>
            <span className="shrink-0 rounded-full bg-ink px-2.5 py-1 text-[11px] font-semibold text-ground">
              EN PROCESO
            </span>
          </li>
          <li className="flex min-h-[76px] items-center justify-between gap-4 py-4">
            <span className="min-w-0">
              <span className="block truncate text-[15px] font-medium text-ink sm:text-[16px]">
                Escribir el resumen del sprint
              </span>
              <span className="mt-1 block text-[13px] text-muted">
                Un estado claro para cada tarea
              </span>
            </span>
            <span className="shrink-0 rounded-full bg-elevated px-2.5 py-1 text-[11px] font-semibold text-muted">
              PENDIENTE
            </span>
          </li>
        </ul>

        <div className="mt-1 flex flex-wrap items-center gap-2 border-t border-ink/10 pt-4 text-[12px] font-medium">
          <span className="rounded-md bg-ground px-3 py-2 text-ink">Interfaz web</span>
          <span aria-hidden className="text-muted">↔</span>
          <span className="rounded-md bg-accent px-3 py-2 text-on-accent">Agente MCP</span>
          <span className="ml-auto text-muted">Una lista compartida</span>
        </div>
      </div>
    </section>
  );
}
