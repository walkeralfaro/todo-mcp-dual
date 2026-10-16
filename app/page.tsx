import { Suspense } from "react";
import { listTasks } from "@/lib/tasks";
import { DayHeadline } from "@/components/day-headline";
import { TaskFilters } from "@/components/task-filters";
import { TaskForm } from "@/components/task-form";
import { TaskItem } from "@/components/task-item";

const ESTADOS = ["TODAS", "PENDIENTE", "EN_PROCESO", "COMPLETADA"] as const;

export default async function Home({
  searchParams,
}: {
  searchParams?: Promise<{ estado?: string; q?: string }>;
}) {
  const sp = (await searchParams) ?? {};
  const estado = ESTADOS.includes(sp.estado as (typeof ESTADOS)[number])
    ? (sp.estado as (typeof ESTADOS)[number])
    : "TODAS";
  const q = sp.q?.trim() ? sp.q.trim() : undefined;
  const tasks = await listTasks({
    estado: estado === "TODAS" ? undefined : estado,
    q,
    limit: 50,
    offset: 0,
  });

  const pendientes = tasks.filter((t) => t.estado !== "COMPLETADA").length;

  return (
    <div className="flex flex-col gap-8 lg:grid lg:h-full lg:min-h-0 lg:grid-cols-[minmax(0,1fr)_340px] lg:grid-rows-[auto_auto_minmax(0,1fr)_auto] lg:gap-x-10 lg:gap-y-6 lg:overflow-hidden">
      <header className="order-1 pt-[4vh] lg:col-start-1 lg:row-start-1 lg:pt-2">
        <DayHeadline pendientes={pendientes} />
        <p className="mt-3 text-[17px] leading-[1.5] text-muted">
          {estado === "TODAS" && !q
            ? "Tus tareas del día."
            : `Mostrando ${tasks.length} · ${estado === "TODAS" ? "todas" : estado}${q ? ` · “${q}”` : ""}`}
        </p>
      </header>
      <div className="order-2 lg:col-start-2 lg:row-start-1 lg:row-span-3 lg:min-h-0 lg:overflow-y-auto">
        <TaskForm />
      </div>
      <div className="order-3 lg:col-start-1 lg:row-start-2">
        <Suspense>
          <TaskFilters estado={estado} q={q ?? ""} total={tasks.length} />
        </Suspense>
      </div>
      <section
        aria-label="Tareas"
        className="order-4 lg:col-start-1 lg:row-start-3 lg:min-h-0 lg:overflow-y-auto lg:pr-2"
      >
        <ul data-testid="task-list" className="flex flex-col gap-3">
          {tasks.map((t) => (
            <TaskItem key={t.id} task={t} />
          ))}
        </ul>
        {tasks.length === 0 && (
          <p className="text-[15px] text-muted">No hay tareas. Crea la primera.</p>
        )}
      </section>
      <footer className="order-5 lg:col-start-1 lg:col-end-3 lg:row-start-4">
        <p className="text-[13px] text-muted">Todo App · UI y MCP sobre la misma base.</p>
      </footer>
    </div>
  );
}
