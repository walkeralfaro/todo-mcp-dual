/**
 * Mapea errores de Better Auth a mensajes claros en español.
 *
 * El cliente de Better Auth (`better-auth/react`) NO lanza en errores HTTP:
 * devuelve `{ data, error }`. El `error` viene la forma del body del backend,
 * p. ej. `{ message: "Password too short", code: "PASSWORD_TOO_SHORT" }`
 * (códigos verificados en vivo contra /api/auth en este proyecto).
 *
 * Mapeamos por `code` para no filtrar textos internos de la librería al
 * usuario; lo no mapeado cae en un mensaje genérico.
 */

interface AuthApiError {
  code?: string | null;
  message?: string | null;
  status?: number;
}

const MESSAGES_BY_CODE: Record<string, string> = {
  INVALID_EMAIL_OR_PASSWORD: "Correo o contraseña incorrectos.",
  PASSWORD_TOO_SHORT: "La contraseña debe tener al menos 8 caracteres.",
  PASSWORD_TOO_LONG: "La contraseña es demasiado larga.",
  INVALID_PASSWORD: "La contraseña no es válida.",
  INVALID_EMAIL: "El correo no tiene un formato válido.",
  USER_ALREADY_EXISTS: "Ese correo ya tiene una cuenta. Prueba a iniciar sesión.",
  USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL:
    "Ese correo ya tiene una cuenta. Prueba a iniciar sesión.",
  USER_NOT_FOUND: "No existe una cuenta con ese correo.",
  VALIDATION_ERROR: "Datos no válidos. Revisa los campos e inténtalo de nuevo.",
  FAILED_TO_GET_USER_INFO:
    "No se pudo completar el acceso con Google. Revisa la configuración del proveedor.",
  FAILED_TO_CREATE_USER:
    "No se pudo crear la cuenta. Inténtalo de nuevo.",
};

function messageForStatus(status?: number): string | null {
  switch (status) {
    case 401:
      return "Correo o contraseña incorrectos.";
    case 403:
      return "No tienes permiso para realizar esta acción.";
    case 422:
      return "Datos no válidos. Revisa los campos e inténtalo de nuevo.";
    case 500:
      return "Error del servidor. Inténtalo de nuevo en unos segundos.";
    default:
      return null;
  }
}

export function authErrorToMessage(error: AuthApiError | null | undefined): string {
  if (!error) return "Error de autenticación. Inténtalo de nuevo.";
  const byCode = error.code ? MESSAGES_BY_CODE[error.code] : undefined;
  if (byCode) return byCode;
  const byStatus = messageForStatus(error.status);
  if (byStatus) return byStatus;
  return "Error de autenticación. Inténtalo de nuevo.";
}
