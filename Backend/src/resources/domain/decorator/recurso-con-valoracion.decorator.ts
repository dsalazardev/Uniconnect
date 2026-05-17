import { RecursoDecorator } from './recurso.decorator';
import { IRecurso } from './recurso.interface';

/**
 * CA2: Decorador concreto — RecursoConValoracion.
 * Agrega el promedio de valoraciones y el total de votos al recurso.
 */
export class RecursoConValoracion extends RecursoDecorator {
  constructor(
    recurso: IRecurso,
    private readonly promedio: number,
    private readonly totalValoraciones: number,
  ) {
    super(recurso);
  }

  override getMetadata(): Record<string, unknown> {
    return {
      ...super.getMetadata(),
      valoracion: {
        promedio: this.promedio,
        total: this.totalValoraciones,
      },
    };
  }
}
