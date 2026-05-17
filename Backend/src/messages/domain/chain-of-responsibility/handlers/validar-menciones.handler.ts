import { MessageDto } from '../../../dto/message.dto';
import { ResultadoValidacion } from '../interfaces/resultado-validacion.interface';
import { ValidadorMensajeAbstracto } from '../validador-mensaje.abstract';

export const MAX_MENCIONES_POR_MENSAJE = 3;

export class ValidarMencionesHandler extends ValidadorMensajeAbstracto {
  constructor(private readonly maxMenciones: number = MAX_MENCIONES_POR_MENSAJE) {
    super();
  }

  manejar(mensaje: MessageDto): ResultadoValidacion {
    const menciones = mensaje.mentions ?? [];

    // Verificar menciones duplicadas (misma persona mencionada más de una vez)
    const nombres = menciones.map((m) => m.displayName?.toLowerCase() ?? '');
    const nombresUnicos = new Set(nombres);
    if (nombresUnicos.size < nombres.length) {
      return {
        valido: false,
        codigoError: 'MSG_MENCIONES_DUPLICADAS',
        mensaje: 'No puedes mencionar a la misma persona más de una vez por mensaje',
      };
    }

    // Verificar que no se supere el máximo de personas distintas
    if (nombresUnicos.size > this.maxMenciones) {
      return {
        valido: false,
        codigoError: 'MSG_MENCIONES_EXCEDIDAS',
        mensaje: `Solo puedes mencionar hasta ${this.maxMenciones} personas por mensaje (recibidas: ${nombresUnicos.size})`,
      };
    }

    return super.manejar(mensaje);
  }
}
