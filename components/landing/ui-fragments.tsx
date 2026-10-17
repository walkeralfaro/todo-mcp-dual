import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Fragmentos reales de la interfaz (`data-ui`) del tablero del hero.
 * El interior se construye en `em` y se agranda con el `font-size` de la
 * raíz (300–400 % respecto a la UI real de 13–16 px), como pide la
 * dirección `dense-tiles`.
 */

type StripTone = "surface" | "elevated" | "ink" | "ground" | "accent";

const STRIP_TONES: Record<StripTone, string> = {
  surface: "bg-surface text-ink",
  elevated: "bg-elevated text-ink",
  ink: "bg-ink text-ground",
  ground: "bg-ground text-muted",
  accent: "bg-accent text-[#06130c]",
};

/** Raíz de fragmento: interior recortado + tira de 13px fusionada al pie. */
function Frag({
  strip,
  tone,
  className,
  children,
}: {
  strip: string;
  tone: StripTone;
  className?: string;
  children: ReactNode;
}): React.JSX.Element {
  return (
    <div
      data-ui
      style={{ fontSize: 40 }}
      className={cn(
        "relative flex h-full flex-col overflow-hidden rounded-lg",
        className,
      )}
    >
      <div className="relative min-h-0 flex-1 overflow-hidden">{children}</div>
      <div className={cn("ui-strip shrink-0", STRIP_TONES[tone])}>{strip}</div>
    </div>
  );
}

/** «Hoy quedan 4» con el número en acento (titular del día, ampliado). */
export function FragDayCount(): React.JSX.Element {
  return (
    <Frag strip="Hoy quedan 4" tone="surface" className="bg-surface">
      <div className="flex h-full flex-col justify-center gap-[0.1em] p-[0.5em]">
        <span className="text-[0.4em] font-medium text-muted">Hoy quedan</span>
        <span className="animate-breathe tabular-nums text-[1.9em] font-semibold leading-none tracking-[-0.03em] text-accent">
          4
        </span>
      </div>
    </Frag>
  );
}

/** Los tres estados reales, en sus bloques (control de estado ampliado). */
export function FragStatus(): React.JSX.Element {
  return (
    <Frag strip="EN_PROCESO" tone="ink" className="bg-surface">
      <div className="flex h-full -translate-x-[0.9em] translate-y-[0.4em] flex-col justify-center gap-[0.35em] p-[0.5em] text-[0.55em]">
        <span className="ui-block bg-elevated text-muted">PENDIENTE</span>
        <span className="ui-block bg-ink text-ground">EN_PROCESO</span>
        <span className="ui-block bg-accent text-[#06130c]">COMPLETADA</span>
      </div>
    </Frag>
  );
}

/** Fechas y revocación de un token, sin enseñar el valor (solo el prefijo). */
export function FragTokenRow(): React.JSX.Element {
  return (
    <Frag strip="tmcp_ab12…" tone="elevated" className="bg-elevated">
      <div className="flex h-full flex-col justify-center gap-[0.3em] p-[0.5em]">
        <span className="text-[0.36em] text-muted">
          Creado 12/10 · Último uso 16/10 · Expira 10/01
        </span>
        <span className="ui-block self-start bg-ground text-destructive">
          Revocar
        </span>
      </div>
    </Frag>
  );
}

/** Endpoint y formato de la cabecera Bearer (pieza de conexión ampliada). */
export function FragBearer(): React.JSX.Element {
  return (
    <Frag strip="Authorization: Bearer tmcp_…" tone="ground" className="bg-surface">
      <div className="flex h-full flex-col justify-center gap-[0.4em] p-[0.45em]">
        <span className="ui-control w-full text-[0.45em]">
          <span className="text-ink">/api/mcp</span>
          <span className="text-muted">HTTP</span>
        </span>
        <span className="text-[0.33em] leading-[1.4] text-muted">
          Cabecera Bearer en cada petición
        </span>
      </div>
    </Frag>
  );
}

/** Resultado ampliado de `list_tasks`: filas reales del agente. */
export function FragTask(): React.JSX.Element {
  return (
    <Frag strip="list_tasks → 5" tone="elevated" className="bg-elevated">
      <div className="flex h-full flex-col justify-center gap-[0.25em] p-[0.45em] text-[0.34em] leading-[1.3]">
        <span className="text-muted">Pagar la luz</span>
        <span className="text-ink">Preparar la demo del viernes</span>
        <span className="text-muted">Escribir el resumen del sprint</span>
        <span className="font-medium text-accent">+2 más del agente</span>
      </div>
    </Frag>
  );
}
