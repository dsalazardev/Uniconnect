/**
 * CA2: Interfaz base del patrón Decorator para recursos de biblioteca.
 * Paralela a IMessage (Sprint 3) para compatibilidad estructural (CA7).
 */
export interface IRecurso {
  /** Retorna el contenido principal del recurso (título + URL) */
  getContenido(): string;
  /** Retorna metadatos enriquecidos por los decoradores activos */
  getMetadata(): Record<string, unknown>;
}
