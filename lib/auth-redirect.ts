/**
 * Validación del parámetro `next` de los redirects de acceso.
 *
 * Solo se aceptan rutas locales: deben empezar por `/`, no por `//`
 * (URL protocolo-relativa) ni por `/\` (algunos navegadores normalizan la
 * barra invertida a `/`), y no contener barras invertidas ni saltos de línea.
 * Cualquier otro valor se ignora para evitar open redirects.
 */
export function safeNextPath(value: string | null | undefined): string | null {
  if (!value) return null;
  if (!value.startsWith("/")) return null;
  if (value.startsWith("//") || value.startsWith("/\\")) return null;
  if (value.includes("\\") || /[\r\n]/.test(value)) return null;
  return value;
}

/** Destino tras autenticarse: la ruta local solicitada o `/tareas` por defecto. */
export function postAuthPath(next: string | null | undefined): string {
  return safeNextPath(next) ?? "/tareas";
}
