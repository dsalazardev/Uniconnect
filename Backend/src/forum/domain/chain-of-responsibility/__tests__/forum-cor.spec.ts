import { buildValidacionPreguntaChain } from '../validacion-pregunta.factory';
import { ValidacionContenidoHandler } from '../handlers/validacion-contenido.handler';
import { PreguntaDto } from '../interfaces/i-manejador-pregunta';

const preguntaValida: PreguntaDto = {
  userId: 1,
  groupId: 10,
  membershipId: 5,
  title: '¿Cómo funciona la recursión?',
  body: 'Estoy intentando entender la recursión en Python.',
};

describe('Forum CoR — buildValidacionPreguntaChain', () => {

  describe('ValidacionMatriculaHandler', () => {
    it('debe rechazar con FORUM_MATRICULA_REQUERIDA cuando membershipId es null', () => {
      const chain = buildValidacionPreguntaChain();
      const resultado = chain.manejar({ ...preguntaValida, membershipId: null });

      expect(resultado.valido).toBe(false);
      expect(resultado.codigoError).toBe('FORUM_MATRICULA_REQUERIDA');
      expect(resultado.mensaje).toContain('matrícula');
    });

    it('debe rechazar con FORUM_MATRICULA_REQUERIDA cuando membershipId es 0', () => {
      const chain = buildValidacionPreguntaChain();
      const resultado = chain.manejar({ ...preguntaValida, membershipId: 0 });

      expect(resultado.valido).toBe(false);
      expect(resultado.codigoError).toBe('FORUM_MATRICULA_REQUERIDA');
    });

    it('NO debe llegar al handler de contenido cuando la matrícula falla', () => {
      const contenidoSpy = jest.spyOn(ValidacionContenidoHandler.prototype, 'manejar');

      const chain = buildValidacionPreguntaChain();
      chain.manejar({ ...preguntaValida, membershipId: null });

      // El handler de contenido nunca debe ser invocado
      expect(contenidoSpy).not.toHaveBeenCalled();

      contenidoSpy.mockRestore();
    });
  });

  describe('ValidacionContenidoHandler', () => {
    it('debe rechazar cuando el título está vacío', () => {
      const chain = buildValidacionPreguntaChain();
      const resultado = chain.manejar({ ...preguntaValida, title: '   ' });

      expect(resultado.valido).toBe(false);
      expect(resultado.codigoError).toBe('FORUM_TITULO_VACIO');
    });

    it('debe rechazar cuando el título supera 300 caracteres', () => {
      const chain = buildValidacionPreguntaChain();
      const resultado = chain.manejar({ ...preguntaValida, title: 'a'.repeat(301) });

      expect(resultado.valido).toBe(false);
      expect(resultado.codigoError).toBe('FORUM_TITULO_LARGO');
    });

    it('debe rechazar cuando el cuerpo está vacío', () => {
      const chain = buildValidacionPreguntaChain();
      const resultado = chain.manejar({ ...preguntaValida, body: '' });

      expect(resultado.valido).toBe(false);
      expect(resultado.codigoError).toBe('FORUM_CUERPO_VACIO');
    });

    it('debe rechazar cuando el cuerpo supera 2000 caracteres', () => {
      const chain = buildValidacionPreguntaChain();
      const resultado = chain.manejar({ ...preguntaValida, body: 'b'.repeat(2001) });

      expect(resultado.valido).toBe(false);
      expect(resultado.codigoError).toBe('FORUM_CUERPO_LARGO');
    });
  });

  describe('ValidacionEstadoGrupoHandler', () => {
    it('debe rechazar cuando groupId es 0', () => {
      const chain = buildValidacionPreguntaChain();
      const resultado = chain.manejar({ ...preguntaValida, groupId: 0 });

      expect(resultado.valido).toBe(false);
      expect(resultado.codigoError).toBe('FORUM_GRUPO_INVALIDO');
    });
  });

  describe('Cadena completa válida', () => {
    it('debe retornar valido: true cuando todos los eslabones pasan', () => {
      const chain = buildValidacionPreguntaChain();
      const resultado = chain.manejar(preguntaValida);

      expect(resultado.valido).toBe(true);
    });
  });
});
