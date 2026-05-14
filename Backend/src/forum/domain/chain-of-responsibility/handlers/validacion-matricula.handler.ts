import { ManejadorPreguntaBase } from '../manejador-pregunta.abstract';
import { PreguntaDto, ResultadoValidacionPregunta } from '../interfaces/i-manejador-pregunta';

/**
 * Eslabón 1: verifica que el usuario tenga membresía activa en el grupo.
 * Si membershipId es null, la cadena se detiene aquí y no llega al siguiente handler.
 */
export class ValidacionMatriculaHandler extends ManejadorPreguntaBase {
  manejar(pregunta: PreguntaDto): ResultadoValidacionPregunta {
    if (pregunta.membershipId === null || pregunta.membershipId <= 0) {
      return {
        valido: false,
        codigoError: 'FORUM_MATRICULA_REQUERIDA',
        mensaje: 'Se requiere matrícula en la asignatura.',
      };
    }
    return super.manejar(pregunta);
  }
}
