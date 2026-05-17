import { IRecurso } from './recurso.interface';

/**
 * Clase abstracta base para los decoradores de recurso.
 * Delega por defecto al componente envuelto — las subclases sobrescriben
 * solo lo que necesitan enriquecer.
 */
export abstract class RecursoDecorator implements IRecurso {
  constructor(protected readonly recurso: IRecurso) {}

  getContenido(): string {
    return this.recurso.getContenido();
  }

  getMetadata(): Record<string, unknown> {
    return this.recurso.getMetadata();
  }
}
