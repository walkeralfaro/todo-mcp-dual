"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import { createTaskAction } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";

export function TaskForm(): React.JSX.Element {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const titleRef = useRef<HTMLInputElement>(null);

  return (
    <section aria-labelledby="new-task-heading" className="rounded-md border border-ink/10 bg-elevated p-5 shadow-sm">
      <h2
        id="new-task-heading"
        className="text-[19px] font-semibold leading-[1.4] tracking-[-0.01em] text-balance"
      >
        Nueva tarea
      </h2>
      <form
        className="mt-4"
        noValidate
        aria-busy={pending}
        onSubmit={(e) => {
          e.preventDefault();
          const form = e.currentTarget;
          const fd = new FormData(form);
          const titulo = String(fd.get("titulo") ?? "").trim();
          if (!titulo) {
            setError("El título es obligatorio");
            titleRef.current?.focus();
            return;
          }
          setError(null);
          start(async () => {
            const r = await createTaskAction(fd);
            if (!r.ok) {
              setError(r.error);
              titleRef.current?.focus();
            } else {
              form.reset();
              router.refresh();
            }
          });
        }}
      >
        <FieldGroup>
          <Field data-invalid={error ? true : undefined}>
            <FieldLabel htmlFor="titulo">Título</FieldLabel>
            <Input
              ref={titleRef}
              id="titulo"
              name="titulo"
              data-testid="new-title"
              placeholder="Título de la tarea… (máx. 100)"
              maxLength={100}
              required
              autoComplete="off"
              aria-invalid={error ? true : undefined}
              aria-describedby={error ? "new-title-error" : "new-title-desc"}
              className={cn("bg-ground")}
            />
            <FieldDescription id="new-title-desc">Obligatorio, hasta 100 caracteres.</FieldDescription>
            {error && (
              <FieldError id="new-title-error" data-testid="create-error">
                {error}
              </FieldError>
            )}
          </Field>
          <Field>
            <FieldLabel htmlFor="descripcion">Descripción (opcional)</FieldLabel>
            <Input
              id="descripcion"
              name="descripcion"
              data-testid="new-desc"
              placeholder="Detalles adicionales… (máx. 500)"
              maxLength={500}
              autoComplete="off"
              aria-describedby="new-desc-desc"
              className="bg-ground"
            />
            <FieldDescription id="new-desc-desc">Opcional, hasta 500 caracteres.</FieldDescription>
          </Field>
          <Button
            type="submit"
            data-testid="create-btn"
            disabled={pending}
            aria-busy={pending}
            className="min-h-11 sm:min-h-0"
          >
            {pending && <Spinner data-icon="inline-start" />}
            {pending ? "Creando…" : "Crear tarea"}
          </Button>
        </FieldGroup>
      </form>
    </section>
  );
}
