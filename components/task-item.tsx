"use client";

import type { Task } from "@prisma/client";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { deleteTaskAction, updateTaskAction } from "@/app/actions";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

function fd(pairs: Record<string, string>) {
  const d = new FormData();
  for (const [k, v] of Object.entries(pairs)) d.set(k, v);
  return d;
}

const ESTADOS = ["PENDIENTE", "EN_PROCESO", "COMPLETADA"] as const;

const fechaCorta = new Intl.DateTimeFormat("es", {
  day: "numeric",
  month: "numeric",
  year: "numeric",
});

export function TaskItem({ task }: { task: Task }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(task.titulo);
  const [desc, setDesc] = useState(task.descripcion ?? "");
  const [deleteOpen, setDeleteOpen] = useState(false);

  function refresh() {
    router.refresh();
  }

  function changeEstado(value: string) {
    start(async () => {
      await updateTaskAction(task.id, fd({ estado: value }));
      refresh();
    });
  }

  function confirmDelete() {
    setDeleteOpen(false);
    start(async () => {
      await deleteTaskAction(task.id);
      refresh();
    });
  }

  return (
    <li
      data-testid={`task-${task.id}`}
      className="rounded-md border border-white/10 bg-elevated p-4 transition-colors duration-150 hover:border-white/20"
    >
      {!editing ? (
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-start gap-2">
            <span
              aria-hidden
              className={`mt-[7px] h-2 w-2 shrink-0 rounded-full ${
                task.estado === "COMPLETADA" ? "bg-accent" : "bg-ink/20"
              }`}
            />
            <div className="min-w-0">
              <p className="break-words text-[16px] font-medium leading-[1.5]">{task.titulo}</p>
              {task.descripcion && (
                <p className="break-words text-[15px] leading-[1.5] text-muted">{task.descripcion}</p>
              )}
            </div>
          </div>
          <p className="shrink-0 text-[13px] tabular-nums text-muted">
            {task.estado}
            {task.fechaCulminada ? ` · ${fechaCorta.format(new Date(task.fechaCulminada))}` : ""}
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          <input
            data-testid="edit-title"
            aria-label="Editar título"
            className="border border-ink/15 bg-ground px-3 py-2 text-[16px]"
            value={title}
            maxLength={100}
            onChange={(e) => setTitle(e.target.value)}
          />
          <input
            data-testid="edit-desc"
            aria-label="Editar descripción"
            className="border border-ink/15 bg-ground px-3 py-2 text-[16px]"
            value={desc}
            maxLength={500}
            onChange={(e) => setDesc(e.target.value)}
          />
        </div>
      )}
      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 rounded-md bg-surface/40 px-3 py-1">
        <Select value={task.estado} onValueChange={changeEstado} disabled={pending}>
          <SelectTrigger
            data-testid="status-select"
            aria-label="Cambiar estado"
            className="h-9 min-w-[150px] px-2 py-2 text-[15px] text-muted"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent position="popper">
            <SelectGroup>
              {ESTADOS.map((e) => (
                <SelectItem key={e} value={e}>
                  {e}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
        {!editing ? (
          <button
            data-testid="edit-btn"
            className="px-1 py-2 text-[15px] text-muted transition-colors duration-150 hover:text-ink"
            onClick={() => setEditing(true)}
          >
            Editar
          </button>
        ) : (
          <button
            data-testid="save-btn"
            disabled={pending}
            className="bg-accent px-4 py-2 text-[15px] font-medium text-ground disabled:opacity-50"
            onClick={() =>
              start(async () => {
                await updateTaskAction(task.id, fd({ titulo: title, descripcion: desc }));
                setEditing(false);
                refresh();
              })
            }
          >
            Guardar
          </button>
        )}
        <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
          <AlertDialogTrigger asChild>
            <button
              data-testid="delete-btn"
              disabled={pending}
              className="px-1 py-2 text-[15px] text-destructive transition-opacity duration-150 hover:opacity-80 disabled:opacity-50"
            >
              Eliminar
            </button>
          </AlertDialogTrigger>
          <AlertDialogContent size="sm">
            <AlertDialogHeader>
              <AlertDialogTitle>¿Eliminar esta tarea?</AlertDialogTitle>
              <AlertDialogDescription>
                Se eliminará «{task.titulo}» de forma permanente. Esta acción no se puede deshacer.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel data-testid="delete-cancel">Cancelar</AlertDialogCancel>
              <AlertDialogAction
                data-testid="delete-confirm"
                className="bg-destructive text-ground hover:bg-destructive/90"
                onClick={confirmDelete}
              >
                Eliminar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </li>
  );
}
