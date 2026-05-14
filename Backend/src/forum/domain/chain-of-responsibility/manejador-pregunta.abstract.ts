import { IManejadorPregunta, PreguntaDto, ResultadoValidacionPregunta } from './interfaces/i-manejador-pregunta';

/**
 * Implementación base de IManejadorPregunta.
 * Almacena la referencia al siguiente eslabón y delega si la validación propia pasa.
 * No comparte ninguna clase con la CoR de mensajes del Sprint 3.
 */
export abstract class ManejadorPreguntaBase implements IManejadorPregunta {
  private siguiente: IManejadorPregunta | null = null;

  setSiguiente(manejador: IManejadorPregunta): IManejadorPregunta {
    this.siguiente = manejador;
    return manejador;
  }

  manejar(pregunta: PreguntaDto): ResultadoValidacionPregunta {
    if (this.siguiente) {
      return this.siguiente.manejar(pregunta);
    }
    return { valido: true };
  }
}
