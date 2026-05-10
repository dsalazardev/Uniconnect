import { BadRequestException } from '@nestjs/common';
import {
  IEstadoGrupo,
  IGroupStateContext,
  TransferPayload,
} from '../interfaces/group-state.interface';

/**
 * Estado Bloqueado: el grupo está suspendido por un administrador del sistema.
 * No permite ninguna operación de transferencia hasta ser desbloqueado.
 */
export class EstadoBloqueado implements IEstadoGrupo {
  getNombre(): string {
    return 'Bloqueado';
  }

  solicitar(_context: IGroupStateContext, _payload: TransferPayload): void {
    throw new BadRequestException('El grupo está bloqueado. Contacta al administrador del sistema');
  }

  aceptar(_context: IGroupStateContext, _payload: TransferPayload): void {
    throw new BadRequestException('El grupo está bloqueado. Contacta al administrador del sistema');
  }

  rechazar(_context: IGroupStateContext, _payload: TransferPayload): void {
    throw new BadRequestException('El grupo está bloqueado. Contacta al administrador del sistema');
  }

  transferir(_context: IGroupStateContext, _payload: TransferPayload): void {
    throw new BadRequestException('El grupo está bloqueado. Contacta al administrador del sistema');
  }
}
