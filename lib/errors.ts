/**
 * Error de negocio: su mensaje está escrito para el usuario o el agente y
 * puede devolverse tal cual (`La tarea no existe`, `No autorizada`,
 * `No autenticado`…).
 *
 * Cualquier otro error se considera interno: su detalle se registra solo en el
 * servidor y al cliente/agente le llega un mensaje genérico.
 */
export class DomainError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DomainError";
  }
}
