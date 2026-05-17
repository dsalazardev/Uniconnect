/**
 * Tipos de eventos emitidos por EventoUniversidadSubject.
 * CA1: el subject emite NUEVO_EVENTO con la categoría como campo del payload.
 */
export type EventoUniversidadEventType = 'NUEVO_EVENTO';

export interface EventoUniversidadEvent {
  /** Tipo de evento — siempre 'NUEVO_EVENTO' */
  tipo: EventoUniversidadEventType;
  /** Nombre de la categoría (ej: "Academico") — CA1 */
  categoria: string;
  /** ID de la categoría, usado por el observer para filtrar suscriptores — CA4 */
  idCategoria: number;
  /** Datos del evento universitario recién publicado */
  evento: {
    id_event: number;
    title: string;
    start_date: Date;
  };
  timestamp: Date;
}
