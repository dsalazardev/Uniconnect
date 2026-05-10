import { BadRequestException } from '@nestjs/common';
import {
  IEstadoGrupo,
  IGroupStateContext,
  TransferPayload,
} from '../interfaces/group-state.interface';

/**
 * Estado Disuelto: el grupo ha sido eliminado o disuelto.
 * Estado terminal. Ninguna operación es válida.
 */
export class EstadoDisuelto implements IEstadoGrupo {
  getNombre(): string {
    return 'Disuelto';
  }

  solicitar(_context: IGroupStateContext, _payload: TransferPayload): void {
    throw new BadRequestException('El grupo ha sido disuelto y no admite operaciones de transferencia');
  }

  aceptar(_context: IGroupStateContext, _payload: TransferPayload): void {
    throw new BadRequestException('El grupo ha sido disuelto y no admite operaciones de transferencia');
  }

  rechazar(_context: IGroupStateContext, _payload: TransferPayload): void {
    throw new BadRequestException('El grupo ha sido disuelto y no admite operaciones de transferencia');
  }

  transferir(_context: IGroupStateContext, _payload: TransferPayload): void {
    throw new BadRequestException('El grupo ha sido disuelto y no admite operaciones de transferencia');
  }
}
