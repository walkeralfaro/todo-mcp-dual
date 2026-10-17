import { describe, expect, it } from "vitest";
import { authErrorToMessage } from "./auth-error";

describe("authErrorToMessage", () => {
  it("mapea los códigos reales de Better Auth a español", () => {
    expect(authErrorToMessage({ code: "INVALID_EMAIL_OR_PASSWORD" })).toBe(
      "Correo o contraseña incorrectos.",
    );
    expect(authErrorToMessage({ code: "PASSWORD_TOO_SHORT" })).toBe(
      "La contraseña debe tener al menos 8 caracteres.",
    );
    expect(authErrorToMessage({ code: "USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL" })).toBe(
      "Ese correo ya tiene una cuenta. Prueba a iniciar sesión.",
    );
  });

  it("mapea códigos secundarios y de validación", () => {
    expect(authErrorToMessage({ code: "VALIDATION_ERROR" })).toContain("Datos no válidos");
    expect(authErrorToMessage({ code: "USER_NOT_FOUND" })).toContain("No existe una cuenta");
    expect(authErrorToMessage({ code: "INVALID_EMAIL" })).toContain("formato válido");
  });

  it("falla a estado HTTP cuando no hay código", () => {
    expect(authErrorToMessage({ status: 401 })).toBe("Correo o contraseña incorrectos.");
    expect(authErrorToMessage({ status: 403 })).toContain("permiso");
    expect(authErrorToMessage({ status: 500 })).toContain("Error del servidor");
  });

  it("devuelve un mensaje genérico para errores desconocidos o vacíos", () => {
    expect(authErrorToMessage(null)).toContain("Error de autenticación");
    expect(authErrorToMessage(undefined)).toContain("Error de autenticación");
    expect(authErrorToMessage({ code: "UNKNOWN_CODE_XYZ" })).toContain(
      "Error de autenticación",
    );
    expect(authErrorToMessage({})).toContain("Error de autenticación");
  });

  it("nunca devuelve inglés de la librería (no filtra el message crudo)", () => {
    const r = authErrorToMessage({
      code: "ALGO_NO_MAPEADO",
      message: "Password too short",
    });
    expect(r).not.toContain("Password too short");
  });
});
