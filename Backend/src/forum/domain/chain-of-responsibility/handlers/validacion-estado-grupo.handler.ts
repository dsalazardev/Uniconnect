import { ManejadorPreguntaBase } from '../manejador-pregunta.abstract';
import { PreguntaDto, ResultadoValidacionPregunta } from '../interfaces/i-manejador-pregunta';

/**
 * Eslabón 3: verifica que el groupId sea válido (mayor a 0).
 * La verificación de estado activo real se delega al servicio vía NotFoundException
 * cuando Prisma no encuentra el grupo, pero este handler garantiza el invariante básico.
 */
export class ValidacionEstadoGrupoHandler extends ManejadorPreguntaBase {
  manejar(pregunta: PreguntaDto): ResultadoValidacionPregunta {
    if (!pregunta.groupId || pregunta.groupId <= 0) {
      return {
        valido: false,
        codigoError: 'FORUM_GRUPO_INVALIDO',
        mensaje: 'El grupo o asignatura no es válido.',
      };
    }
    return super.manejar(pregunta);
  }
}
