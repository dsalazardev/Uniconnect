import { RecursoDecorator } from './recurso.decorator';
import { IRecurso } from './recurso.interface';

/**
 * CA2: Decorador concreto — RecursoConEtiquetas.
 * Agrega una lista de etiquetas/tags al recurso base.
 */
export class RecursoConEtiquetas extends RecursoDecorator {
  constructor(
    recurso: IRecurso,
    private readonly etiquetas: string[],
  ) {
    super(recurso);
  }

  override getMetadata(): Record<string, unknown> {
    return {
      ...super.getMetadata(),
      etiquetas: this.etiquetas,
    };
  }
}
