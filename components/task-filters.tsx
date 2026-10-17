"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, X } from "lucide-react";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { Button } from "@/components/ui/button";

const ESTADOS = ["TODAS", "PENDIENTE", "EN_PROCESO", "COMPLETADA"] as const;

export function TaskFilters({ estado, q, total }: { estado: string; q: string; total?: number }): React.JSX.Element {
  const router = useRouter();
  const sp = useSearchParams();
  const [qLocal, setQLocal] = useState(q);
  const timer = useRef<number | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setQLocal(q);
  }, [q]);

  useEffect(() => {
    if (qLocal === q) return;
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => {
      const params = new URLSearchParams(sp.toString());
      if (qLocal) params.set("q", qLocal);
      else params.delete("q");
      router.push(`/tareas?${params.toString()}`);
    }, 300);
    return () => {
      if (timer.current) window.clearTimeout(timer.current);
    };
  }, [qLocal, q, router, sp]);

  function pushEstado(value: string): void {
    if (!value) return;
    const params = new URLSearchParams(sp.toString());
    if (value === "TODAS") params.delete("estado");
    else params.set("estado", value);
    router.push(`/tareas?${params.toString()}`);
  }

  function clearSearch(): void {
    if (timer.current) window.clearTimeout(timer.current);
    setQLocal("");
    const params = new URLSearchParams(sp.toString());
    params.delete("q");
    router.push(`/tareas?${params.toString()}`);
    searchRef.current?.focus();
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
        <ToggleGroup
          type="single"
          value={estado}
          onValueChange={pushEstado}
          aria-label="Filtrar por estado"
          className="flex flex-wrap gap-1 rounded-lg bg-surface/60 p-1"
        >
          {ESTADOS.map((e) => (
            <ToggleGroupItem key={e} value={e} data-testid={`filter-${e}`} aria-label={`Filtrar por ${e}`} className="data-[state=on]:bg-elevated data-[state=on]:shadow-sm">
              {e}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
        <div role="search" className="min-w-0 flex-1 basis-48">
          <InputGroup className="border-ink/10 bg-elevated shadow-xs focus-within:ring-inset focus-within:ring-offset-0">
            <InputGroupAddon aria-hidden="true">
              <Search />
            </InputGroupAddon>
            <InputGroupInput
              ref={searchRef}
              data-testid="search"
              value={qLocal}
              onChange={(e) => setQLocal(e.target.value)}
              placeholder="Buscar por título o descripción…"
              aria-label="Buscar tareas"
              autoComplete="off"
              type="search"
            />
            {qLocal && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={clearSearch}
                aria-label="Limpiar búsqueda"
                className="size-11 shrink-0"
              >
                <X aria-hidden="true" />
              </Button>
            )}
          </InputGroup>
        </div>
      </div>
      <p aria-live="polite" data-testid="filter-count" className="text-[13px] tabular-nums text-muted">
        {typeof total === "number"
          ? `${total} ${total === 1 ? "tarea encontrada" : "tareas encontradas"} · ${estado}${q ? ` · “${q}”` : ""}`
          : `Filtro ${estado}${q ? ` · “${q}”` : ""}`}
      </p>
    </div>
  );
}
