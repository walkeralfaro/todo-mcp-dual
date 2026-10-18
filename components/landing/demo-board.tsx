"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type DemoEstado = "PENDIENTE" | "EN_PROCESO" | "COMPLETADA";

interface DemoRow {
  id: string;
  titulo: string;
  descripcion?: string;
  creada: string;
  cerrada?: string;
  estado: DemoEstado;
}

const FILAS: DemoRow[] = [
  { id: "r1", titulo: "Pagar la luz", descripcion: "Domiciliada el día 20", creada: "12/10", estado: "PENDIENTE" },
  { id: "r2", titulo: "Preparar la demo del viernes", descripcion: "Enseñar /mcp y el token", creada: "13/10", estado: "EN_PROCESO" },
  { id: "r3", titulo: "Comprar café", creada: "9/10", cerrada: "10/10", estado: "COMPLETADA" },
];

const BLOQUE: Record<DemoEstado, string> = {
  PENDIENTE: "bg-elevated text-muted",
  EN_PROCESO: "bg-ink text-ground",
  COMPLETADA: "bg-accent text-on-accent",
};

function hoy(): string {
  return new Intl.DateTimeFormat("es", { day: "numeric", month: "numeric" }).format(new Date());
}

/**
 * Tablero de demostración del argumento «la lista»: filas reales que se
 * abren al pulsarlas y una demo local (añadir, marcar) que vive solo en el
 * navegador: cero llamadas al servidor, cero persistencia. El marcado del
 * servidor renderiza las filas de ejemplo, así que sin JS queda legible.
 */
export function DemoBoard(): React.JSX.Element {
  const [rows, setRows] = useState<DemoRow[]>(FILAS);
  const [openId, setOpenId] = useState<string>("");
  const [draft, setDraft] = useState("");
  const nextId = useRef(1);

  const add = (e: React.FormEvent) => {
    e.preventDefault();
    const titulo = draft.trim();
    if (!titulo) return;
    const id = `demo${nextId.current++}`;
    setRows((prev) => [
      { id, titulo, creada: hoy(), estado: "PENDIENTE" },
      ...prev,
    ]);
    setDraft("");
    setOpenId(id);
  };

  const toggle = (id: string) => {
    setRows((prev) =>
      prev.map((row) =>
        row.id === id
          ? row.estado === "COMPLETADA"
            ? { ...row, estado: "PENDIENTE", cerrada: undefined }
            : { ...row, estado: "COMPLETADA", cerrada: hoy() }
          : row,
      ),
    );
  };

  return (
    <section id="lista" aria-labelledby="lista-title" className="scroll-mt-24">
      <div className="mb-6 max-w-[680px]">
        <p className="text-[13px] font-semibold uppercase tracking-[0.14em] text-accent">
          Una sola lista
        </p>
        <h2
          id="lista-title"
          className="mt-3 text-[clamp(2rem,6vw,3.5rem)] font-semibold leading-[1.02] tracking-[-0.045em]"
        >
          Tu trabajo sigue conectado
        </h2>
        <p className="mt-4 text-[16px] leading-[1.6] text-muted sm:text-[17px]">
          Añade una tarea aquí, cambia su estado y comprueba cómo se organiza
          tu lista. Esta demostración vive solo en tu navegador.
        </p>
      </div>
      <div data-ui className="rounded-lg bg-ground">
        <form
          onSubmit={add}
          className="flex items-center gap-2 p-2 sm:p-3"
        >
          <label htmlFor="demo-task" className="sr-only">
            Añade una tarea de prueba
          </label>
          <input
            id="demo-task"
            data-testid="demo-task-input"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            maxLength={100}
            autoComplete="off"
            placeholder="Añade una tarea de prueba"
            className="h-11 w-full rounded-md border border-ink/15 bg-surface px-3 text-[15px] text-ink placeholder:text-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          />
          <Button
            type="submit"
            data-testid="demo-add-btn"
            className="h-11 px-5"
            disabled={draft.trim().length === 0}
          >
            Añadir
          </Button>
        </form>

        <div
          data-testid="demo-note"
          className="ui-strip bg-ground text-muted"
        >
          Solo en esta página: nada se guarda en el servidor.
        </div>

        <ul className="mt-1 flex flex-col gap-1">
          {rows.map((row) => {
            const open = row.id === openId;
            const completada = row.estado === "COMPLETADA";
            return (
              <li key={row.id} data-testid="demo-row">
                <button
                  type="button"
                  aria-expanded={open}
                  onClick={() => setOpenId(open ? "" : row.id)}
                  className={cn(
                    "grid w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 px-4 py-3.5 text-left transition-colors duration-150 sm:grid-cols-12 sm:px-5 sm:py-0 sm:h-[72px]",
                    open ? "bg-accent text-on-accent" : "bg-surface text-ink hover:bg-elevated active:bg-elevated",
                  )}
                >
                  <span className="flex min-w-0 items-start gap-2 sm:col-span-5">
                    <span
                      aria-hidden
                      className={cn(
                        "mt-[7px] h-2 w-2 shrink-0 rounded-full",
                        completada
                          ? open
                            ? "bg-on-accent"
                            : "bg-accent"
                          : open
                            ? "bg-on-accent/30"
                            : "bg-ink/20",
                      )}
                    />
                    <span className="text-[20px] font-medium leading-[1.3] sm:text-[22px] sm:leading-[1.35] lg:text-[26px]">
                      {row.titulo}
                    </span>
                  </span>
                  <span
                    className={cn(
                      "hidden text-[13px] tabular-nums sm:col-span-2 sm:block",
                      open ? "text-on-accent/80" : "text-muted",
                    )}
                  >
                    {row.creada}
                  </span>
                  <span
                    className={cn(
                      "hidden text-[13px] tabular-nums sm:col-span-2 sm:block",
                      open ? "text-on-accent/80" : "text-muted",
                    )}
                  >
                    {row.cerrada ?? "·"}
                  </span>
                  <span
                    className={cn(
                      "ui-block justify-self-end sm:col-span-3",
                      open ? "bg-ground text-ink" : BLOQUE[row.estado],
                    )}
                  >
                    {row.estado}
                  </span>
                </button>

                {open && (
                  <div data-testid="demo-open-row" key={row.id} className="animate-shutter">
                    <div className="animate-shutter-settle flex flex-col gap-3 bg-accent px-4 pb-5 pt-1 text-on-accent sm:px-5">
                      {row.descripcion && (
                        <p className="max-w-[62ch] text-[17px] leading-[1.5]">
                          {row.descripcion}
                        </p>
                      )}
                      <p className="text-[13px] tabular-nums">
                        Creada {row.creada}
                        {row.cerrada ? ` · Culminada ${row.cerrada}` : ""} · {row.estado}
                      </p>
                      <Button
                        type="button"
                        data-testid="demo-complete-btn"
                        onClick={() => toggle(row.id)}
                        className="h-11 self-start bg-ground px-5 text-ink hover:bg-surface"
                      >
                        {completada ? "Marcar como pendiente" : "Marcar como completada"}
                      </Button>
                    </div>
                  </div>
                )}
              </li>
            );
          })}
        </ul>

        <noscript>
          <p data-testid="demo-noscript" className="ui-strip bg-ground text-muted">
            Sin JavaScript, la demo muestra solo las filas de ejemplo.
          </p>
        </noscript>
      </div>
    </section>
  );
}
