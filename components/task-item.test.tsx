// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Task } from "@/lib/generated/prisma/client";
import { TaskItem } from "@/components/task-item";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn() }),
}));

const { deleteTaskActionMock, updateTaskActionMock } = vi.hoisted(() => ({
  deleteTaskActionMock: vi.fn(async (_id: string) => ({ ok: true })),
  updateTaskActionMock: vi.fn(async (_id: string, _fd: FormData) => ({ ok: true })),
}));

vi.mock("@/app/actions", () => ({
  deleteTaskAction: deleteTaskActionMock,
  updateTaskAction: updateTaskActionMock,
}));

function makeTask(overrides: Partial<Task> = {}): Task {
  return {
    id: "task-1",
    titulo: "Titulo de prueba",
    descripcion: "Descripcion de prueba",
    estado: "PENDIENTE",
    fechaCreacion: new Date("2026-01-01T00:00:00Z"),
    fechaCulminada: null,
    ...overrides,
  } as Task;
}

beforeEach(() => {
  deleteTaskActionMock.mockClear();
  updateTaskActionMock.mockClear();
});

afterEach(() => {
  cleanup();
});

describe("TaskItem shadcn", () => {
  it("expone el desplegable de estado shadcn con el testid existente", () => {
    render(<TaskItem task={makeTask({ estado: "PENDIENTE" })} />);
    const trigger = screen.getByTestId("status-select");
    expect(trigger).toBeTruthy();
    expect(trigger.getAttribute("aria-label")).toBe("Cambiar estado");
    expect(trigger.textContent).toContain("PENDIENTE");
  });

  it("confirmar el diálogo elimina la tarea", async () => {
    render(<TaskItem task={makeTask()} />);
    fireEvent.click(screen.getByTestId("delete-btn"));
    expect(await screen.findByText("¿Eliminar esta tarea?")).toBeTruthy();
    fireEvent.click(screen.getByTestId("delete-confirm"));
    await waitFor(() => {
      expect(deleteTaskActionMock).toHaveBeenCalledWith("task-1");
    });
  });

  it("cancelar o Escape no elimina la tarea", async () => {
    render(<TaskItem task={makeTask()} />);
    fireEvent.click(screen.getByTestId("delete-btn"));
    expect(await screen.findByText("¿Eliminar esta tarea?")).toBeTruthy();
    fireEvent.click(screen.getByTestId("delete-cancel"));
    await waitFor(() => {
      expect(screen.queryByText("¿Eliminar esta tarea?")).toBeNull();
    });
    expect(deleteTaskActionMock).not.toHaveBeenCalled();
  });
});

describe("TaskItem acciones Button shadcn", () => {
  it("Editar/Guardar/Eliminar usan Button con data-slot y sin window.confirm", () => {
    const confirmSpy = vi.spyOn(window, "confirm").mockReturnValue(true);
    render(<TaskItem task={makeTask()} />);
    for (const id of ["edit-btn", "delete-btn"]) {
      const btn = screen.getByTestId(id);
      expect(btn.tagName).toBe("BUTTON");
      expect(btn.className).toContain("inline-flex");
      expect(btn.className).toContain("rounded-md");
      expect(btn.className).toContain("focus-visible:ring-2");
    }
    expect(screen.getByTestId("edit-btn").getAttribute("data-slot")).toBe("button");
    expect(confirmSpy).not.toHaveBeenCalled();
    confirmSpy.mockRestore();
  });

  it("editar título y guardar llama a update con Button", async () => {
    render(<TaskItem task={makeTask()} />);
    fireEvent.click(screen.getByTestId("edit-btn"));
    const title = screen.getByTestId("edit-title");
    fireEvent.change(title, { target: { value: "Nuevo titulo" } });
    fireEvent.click(screen.getByTestId("save-btn"));
    await waitFor(() => {
      expect(updateTaskActionMock).toHaveBeenCalled();
    });
    const fd = updateTaskActionMock.mock.calls[0][1] as FormData;
    expect(fd.get("titulo")).toBe("Nuevo titulo");
  });
});

describe("TaskItem card", () => {
  it("la tarjeta se distingue del fondo en reposo", () => {
    render(<TaskItem task={makeTask()} />);
    const card = screen.getByTestId("task-task-1");
    expect(card.tagName).toBe("LI");
    expect(card.className).toContain("bg-elevated");
  });

  it("el texto largo no desborda la tarjeta", () => {
    const larga = "a".repeat(120);
    render(<TaskItem task={makeTask({ titulo: larga, descripcion: `${larga} ${larga}` })} />);
    const titulo = screen.getByText(larga);
    expect(titulo.className).toContain("break-words");
    const li = screen.getByTestId("task-task-1");
    expect(li.scrollWidth).toBeLessThanOrEqual(li.clientWidth + 1);
  });

  it("la fecha de culminación se muestra en español", () => {
    render(
      <TaskItem
        task={makeTask({ estado: "COMPLETADA", fechaCulminada: new Date("2026-10-16T12:00:00Z") })}
      />
    );
    const esperada = new Intl.DateTimeFormat("es", {
      day: "numeric",
      month: "numeric",
      year: "numeric",
    }).format(new Date("2026-10-16T12:00:00Z"));
    expect(screen.getByText(new RegExp(esperada.replaceAll("/", "\\/")))).toBeTruthy();
  });
});
