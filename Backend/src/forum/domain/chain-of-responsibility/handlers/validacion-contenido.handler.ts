import { ManejadorPreguntaBase } from '../manejador-pregunta.abstract';
import { PreguntaDto, ResultadoValidacionPregunta } from '../interfaces/i-manejador-pregunta';

const MAX_TITLE_LENGTH = 300;
const MAX_BODY_LENGTH  = 2000;

/**
 * Eslabón 2: verifica que título y cuerpo no estén vacíos y no superen los límites.
 */
export class ValidacionContenidoHandler extends ManejadorPreguntaBase {
  manejar(pregunta: PreguntaDto): ResultadoValidacionPregunta {
    if (!pregunta.title?.trim()) {
      return { valido: false, codigoError: 'FORUM_TITULO_VACIO', mensaje: 'El título no puede estar vacío.' };
    }
    if (pregunta.title.length > MAX_TITLE_LENGTH) {
      return {
        valido: false,
        codigoError: 'FORUM_TITULO_LARGO',
        mensaje: `El título no puede superar ${MAX_TITLE_LENGTH} caracteres.`,
      };
    }
    if (!pregunta.body?.trim()) {
      return { valido: false, codigoError: 'FORUM_CUERPO_VACIO', mensaje: 'El cuerpo no puede estar vacío.' };
    }
    if (pregunta.body.length > MAX_BODY_LENGTH) {
      return {
        valido: false,
        codigoError: 'FORUM_CUERPO_LARGO',
        mensaje: `El cuerpo no puede superar ${MAX_BODY_LENGTH} caracteres.`,
      };
    }
    return super.manejar(pregunta);
  }
}
