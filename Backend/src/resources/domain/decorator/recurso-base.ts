import { IRecurso } from './recurso.interface';

/**
 * CA2: Componente concreto base — RecursoBase.
 * Encapsula los datos mínimos de un recurso: título, URL y metadata Open Graph.
 */
export class RecursoBase implements IRecurso {
  constructor(
    private readonly titulo: string,
    private readonly urlExterna: string | null,
    private readonly descripcion: string | null,
    private readonly imagenPreview: string | null,
    private readonly tipoContenido: string,
    private readonly creadoPor: number,
  ) {}

  getContenido(): string {
    return `[${this.tipoContenido}] ${this.titulo}${this.urlExterna ? ` — ${this.urlExterna}` : ''}`;
  }

  getMetadata(): Record<string, unknown> {
    return {
      titulo: this.titulo,
      url_externa: this.urlExterna,
      descripcion: this.descripcion,
      imagen_preview: this.imagenPreview,
      tipo_contenido: this.tipoContenido,
      creado_por: this.creadoPor,
    };
  }
}
