import { IManejadorPregunta } from './interfaces/i-manejador-pregunta';
import { ValidacionMatriculaHandler } from './handlers/validacion-matricula.handler';
import { ValidacionContenidoHandler } from './handlers/validacion-contenido.handler';
import { ValidacionEstadoGrupoHandler } from './handlers/validacion-estado-grupo.handler';

/**
 * Construye la cadena: matrícula → contenido → estadoGrupo
 * y devuelve el primer eslabón listo para ejecutar.
 */
export function buildValidacionPreguntaChain(): IManejadorPregunta {
  const matricula    = new ValidacionMatriculaHandler();
  const contenido    = new ValidacionContenidoHandler();
  const estadoGrupo  = new ValidacionEstadoGrupoHandler();

  matricula.setSiguiente(contenido).setSiguiente(estadoGrupo);

  return matricula;
}
