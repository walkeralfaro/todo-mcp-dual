import { Suspense } from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { listTasks, countPendingTasks } from "@/lib/tasks";
import { auth } from "@/lib/auth";
import { DayHeadline } from "@/components/day-headline";
import { TaskFilters } from "@/components/task-filters";
import { TaskForm } from "@/components/task-form";
import { TaskItem } from "@/components/task-item";

const ESTADOS = ["TODAS", "PENDIENTE", "EN_PROCESO", "COMPLETADA"] as const;

export default async function Tareas({
  searchParams,
}: {
  searchParams?: Promise<{ estado?: string; q?: string }>;
}) {
  const sp = (await searchParams) ?? {};
  const estado = ESTADOS.includes(sp.estado as (typeof ESTADOS)[number])
    ? (sp.estado as (typeof ESTADOS)[number])
    : "TODAS";
  const q = sp.q?.trim() ? sp.q.trim() : undefined;

  // Better Auth lee las cookies del header "cookie" de la solicitud real.
  // El layout de `app/(protegido)` ya garantiza sesión; este redirect es
  // defensivo (y da a TypeScript un `userId` no nulo).
  const session = await auth.api.getSession({ headers: await headers() });
  const userId = session?.user?.id;
  if (!userId) redirect("/?auth=login&next=%2Ftareas");

  // El titular cuenta todos los pendientes del usuario, no el subconjunto
  // filtrado ni las primeras 50 filas del listado.
  const [tasks, pendientes] = await Promise.all([
    listTasks({
      userId,
      estado: estado === "TODAS" ? undefined : estado,
      q,
      limit: 50,
      offset: 0,
    }),
    countPendingTasks(userId),
  ]);

  return (
    <div className="mx-auto flex w-full max-w-[1024px] flex-1 flex-col gap-8 px-5 py-8 lg:grid lg:min-h-0 lg:grid-cols-[minmax(0,1fr)_340px] lg:grid-rows-[auto_auto_minmax(0,1fr)] lg:gap-x-10 lg:gap-y-6 lg:overflow-hidden lg:py-10">
      <header className="order-1 lg:col-start-1 lg:row-start-1">
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
    </div>
  );
}
