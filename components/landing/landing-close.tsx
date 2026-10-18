import Link from "next/link";
import { LandingCta } from "@/components/landing/landing-cta";

/** Cierre de la landing con una sola acción y navegación secundaria. */
export function LandingClose(): React.JSX.Element {
  return (
    <section
      aria-labelledby="cierre-title"
      className="flex flex-col gap-6 rounded-2xl border border-ink/10 bg-surface p-6 sm:p-9 lg:flex-row lg:items-center lg:justify-between lg:gap-10"
    >
      <div className="max-w-[620px]">
        <p className="text-[13px] font-semibold uppercase tracking-[0.14em] text-accent">
          Empieza con una lista
        </p>
        <h2
          id="cierre-title"
          className="mt-3 text-[clamp(2rem,6vw,3.25rem)] font-semibold leading-[1.02] tracking-[-0.045em]"
        >
          Tus tareas, siempre a mano
        </h2>
        <p className="mt-4 max-w-[52ch] text-[16px] leading-[1.6] text-muted">
          Organízalas desde la web y conecta tu cliente MCP cuando quieras
          trabajar con un agente.
        </p>
      </div>
      <div className="shrink-0">
        <LandingCta variant="close" testIdPrefix="landing-close" />
      </div>
    </section>
  );
}

const ENLACES_PAGINA = [
  ["La demo", "#lista"],
  ["Conectar un agente", "#agentes"],
  ["Herramientas MCP", "#herramientas"],
] as const;

/** Enlaces breves al contenido y las rutas reales del producto. */
export function LandingFooter(): React.JSX.Element {
  return (
    <footer className="border-t border-ink/10 pb-2 pt-7">
      <nav
        aria-label="Mapa del sitio"
        className="flex flex-col justify-between gap-6 sm:flex-row sm:items-center"
      >
        <Link href="/" className="text-[15px] font-semibold text-ink">
          Todo App
        </Link>
        <ul className="flex flex-wrap gap-x-5 gap-y-1">
          {ENLACES_PAGINA.map(([label, href]) => (
            <li key={href}>
              <a
                href={href}
                className="inline-flex min-h-11 items-center text-[14px] text-muted transition-colors hover:text-ink"
              >
                {label}
              </a>
            </li>
          ))}
          <li>
            <Link
              href="/tareas"
              className="inline-flex min-h-11 items-center text-[14px] text-muted transition-colors hover:text-ink"
            >
              Mis tareas
            </Link>
          </li>
          <li>
            <Link
              href="/mcp"
              className="inline-flex min-h-11 items-center text-[14px] text-muted transition-colors hover:text-ink"
            >
              Tokens MCP
            </Link>
          </li>
          <li>
            <a
              href="/arquitectura"
              target="_blank"
              rel="noreferrer"
              data-testid="footer-arquitectura"
              className="inline-flex min-h-11 items-center text-[14px] text-muted transition-colors hover:text-ink"
            >
              Cómo está hecha
            </a>
          </li>
        </ul>
      </nav>
      <p className="mt-4 text-[12px] text-muted">© 2026 Todo App</p>
    </footer>
  );
}
