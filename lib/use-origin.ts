"use client";

import { useSyncExternalStore } from "react";

/** Suscripción vacía: el origen no cambia durante la vida de la página. */
const subscribe = () => () => {};

/**
 * Origen del despliegue en uso (`window.location.origin`), leído sin `useEffect`.
 *
 * Devuelve `""` mientras se renderiza en servidor y el valor real en el
 * navegador: React vuelve a renderizar tras la hidratación con la instantánea
 * del cliente, sin avisos de hidratación.
 */
export function useOrigin(): string {
  return useSyncExternalStore(subscribe, () => window.location.origin, () => "");
}
