import { BadRequestException } from '@nestjs/common';
import {
  IEstadoGrupo,
  IGroupStateContext,
  TransferPayload,
} from '../interfaces/group-state.interface';

/**
 * Estado TransferenciaAceptada: la transferencia se completó exitosamente.
 * Estado terminal para el flujo de transferencia.
 * Ninguna operación de transferencia es válida desde este estado.
 */
export class EstadoTransferenciaAceptada implements IEstadoGrupo {
  getNombre(): string {
    return 'TransferenciaAceptada';
  }

  solicitar(_context: IGroupStateContext, _payload: TransferPayload): void {
    throw new BadRequestException('La transferencia ya fue completada');
  }

  aceptar(_context: IGroupStateContext, _payload: TransferPayload): void {
    throw new BadRequestException('La transferencia ya fue completada');
  }

  rechazar(_context: IGroupStateContext, _payload: TransferPayload): void {
    throw new BadRequestException('La transferencia ya fue completada');
  }

  transferir(_context: IGroupStateContext, _payload: TransferPayload): void {
    throw new BadRequestException('La transferencia ya fue completada');
  }
}
