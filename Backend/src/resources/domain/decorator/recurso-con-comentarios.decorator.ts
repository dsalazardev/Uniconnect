import { RecursoDecorator } from './recurso.decorator';
import { IRecurso } from './recurso.interface';

export interface ComentarioSnapshot {
  id_comment: number;
  contenido: string;
  usuario: string;
  fecha: string;
}

/**
 * CA2: Decorador concreto — RecursoConComentarios.
 * Agrega la lista de comentarios al recurso.
 * CA7: getMetadata() devuelve Record<string,unknown>, misma firma que IMessage.getMetadata().
 */
export class RecursoConComentarios extends RecursoDecorator {
  constructor(
    recurso: IRecurso,
    private readonly comentarios: ComentarioSnapshot[],
  ) {
    super(recurso);
  }

  override getMetadata(): Record<string, unknown> {
    return {
      ...super.getMetadata(),
      comentarios: this.comentarios,
    };
  }
}
