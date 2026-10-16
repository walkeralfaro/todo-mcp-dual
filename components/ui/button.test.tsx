// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { Button, buttonVariants } from "@/components/ui/button";

afterEach(() => {
  cleanup();
});

describe("Button shadcn", () => {
  it("aplica variante destructive sólida", () => {
    render(<Button variant="destructive" data-testid="btn">Eliminar</Button>);
    const btn = screen.getByTestId("btn");
    expect(btn.className).toContain("bg-destructive");
    expect(btn.className).toContain("text-ground");
  });

  it("aplica ghost y tamaño sm para acciones de fila", () => {
    render(
      <Button variant="ghost" size="sm" data-testid="btn">
        Editar
      </Button>
    );
    const btn = screen.getByTestId("btn");
    expect(btn.className).toContain("h-8");
    expect(btn.getAttribute("data-slot")).toBe("button");
  });

  it("expone foco visible y disabled accesible", () => {
    render(
      <Button data-testid="btn" disabled>
        Guardar
      </Button>
    );
    const btn = screen.getByTestId("btn");
    expect(btn.className).toContain("focus-visible:ring-2");
    expect(btn.className).toContain("disabled:opacity-50");
    expect(btn.hasAttribute("disabled")).toBe(true);
  });

  it("soporta asChild sin romper estilos", () => {
    render(
      <Button asChild variant="outline" data-testid="wrap">
        <a href="/tareas">Ver</a>
      </Button>
    );
    const link = screen.getByRole("link");
    expect(link.className).toContain("border");
    expect(link.getAttribute("data-slot")).toBe("button");
  });

  it("buttonVariants genera clases por defecto", () => {
    const cls = buttonVariants({ variant: "default", size: "default" });
    expect(cls).toContain("bg-accent");
    expect(cls).toContain("rounded-md");
  });
});
