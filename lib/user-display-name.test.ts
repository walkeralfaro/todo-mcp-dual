import { describe, expect, it } from "vitest";
import { shortDisplayName } from "@/lib/user-display-name";

describe("shortDisplayName", () => {
  it("usa solo el primer nombre cuando hay apellidos", () => {
    expect(shortDisplayName("Ana María López", "Usuario")).toBe("Ana");
  });

  it("ignora espacios sobrantes antes de tomar el primer nombre", () => {
    expect(shortDisplayName("  Ana   María ", "Usuario")).toBe("Ana");
  });

  it("recorta a 10 caracteres los nombres largos", () => {
    const resultado = shortDisplayName("Christopher Alexander", "Usuario");
    expect(resultado).toBe("Christophe");
    expect(resultado).toHaveLength(10);
  });

  it("mantiene intactos los nombres de 10 caracteres o menos", () => {
    expect(shortDisplayName("Alejandra", "Usuario")).toBe("Alejandra");
    expect(shortDisplayName("Beto", "Usuario")).toBe("Beto");
  });

  it("cae al respaldo cuando no hay nombre", () => {
    expect(shortDisplayName(null, "Invitado")).toBe("Invitado");
    expect(shortDisplayName(undefined, "Invitado")).toBe("Invitado");
  });

  it("cae al respaldo con cadena vacía o solo espacios", () => {
    expect(shortDisplayName("", "Invitado")).toBe("Invitado");
    expect(shortDisplayName("   ", "Invitado")).toBe("Invitado");
  });

  it("recorta también el respaldo a 10 caracteres", () => {
    const resultado = shortDisplayName(undefined, "walker.alfaro@prueba.test");
    expect(resultado).toBe("walker.alf");
    expect(resultado).toHaveLength(10);
  });
});
