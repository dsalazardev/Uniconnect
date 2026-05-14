export interface ResultadoValidacionPregunta {
  valido: boolean;
  codigoError?: string;
  mensaje?: string;
}

export interface PreguntaDto {
  userId: number;
  groupId: number;
  membershipId: number | null;
  title: string;
  body: string;
}

/**
 * Contrato de la cadena de responsabilidad del foro.
 * Completamente independiente de IValidadorMensajeHandler (Sprint 3).
 */
export interface IManejadorPregunta {
  setSiguiente(manejador: IManejadorPregunta): IManejadorPregunta;
  manejar(pregunta: PreguntaDto): ResultadoValidacionPregunta;
}
