/**
 * Nombre visible del usuario en la barra: solo el primer nombre, recortado a
 * 10 caracteres para que el disparador del menú no compita por el ancho.
 * Cae a `fallback` cuando el nombre no aporta nada (vacío o solo espacios).
 */
export function shortDisplayName(
  name: string | null | undefined,
  fallback: string,
): string {
  const firstSegment = name?.trim().split(/\s+/)[0] ?? "";
  const base = firstSegment.length > 0 ? firstSegment : fallback.trim();
  return base.slice(0, 10);
}
