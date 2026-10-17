import { describe, expect, it } from "vitest";
import { postAuthPath, safeNextPath } from "./auth-redirect";

describe("safeNextPath", () => {
  it("acepta rutas locales", () => {
    expect(safeNextPath("/tareas")).toBe("/tareas");
    expect(safeNextPath("/mcp")).toBe("/mcp");
    expect(safeNextPath("/mcp?tab=1")).toBe("/mcp?tab=1");
    expect(safeNextPath("/")).toBe("/");
  });

  it("rechaza URLs externas y protocolos", () => {
    expect(safeNextPath("https://ejemplo.com")).toBeNull();
    expect(safeNextPath("http://ejemplo.com/tareas")).toBeNull();
    expect(safeNextPath("javascript:alert(1)")).toBeNull();
    expect(safeNextPath("//evil.com")).toBeNull();
    expect(safeNextPath("/\\evil.com")).toBeNull();
  });

  it("rechaza valores vacíos o relativos sin barra inicial", () => {
    expect(safeNextPath("")).toBeNull();
    expect(safeNextPath(null)).toBeNull();
    expect(safeNextPath(undefined)).toBeNull();
    expect(safeNextPath("tareas")).toBeNull();
  });

  it("rechaza barras invertidas y saltos de línea", () => {
    expect(safeNextPath("/tareas\\..\\.\\./x")).toBeNull();
    expect(safeNextPath("/tareas\nSet-Cookie: x=y")).toBeNull();
    expect(safeNextPath("/tareas\r\nx")).toBeNull();
  });
});

describe("postAuthPath", () => {
  it("usa la ruta solicitada cuando es local", () => {
    expect(postAuthPath("/mcp")).toBe("/mcp");
  });

  it("cae a /tareas con valores inválidos o ausentes", () => {
    expect(postAuthPath("https://ejemplo.com")).toBe("/tareas");
    expect(postAuthPath(null)).toBe("/tareas");
    expect(postAuthPath(undefined)).toBe("/tareas");
    expect(postAuthPath("//evil")).toBe("/tareas");
  });
});
