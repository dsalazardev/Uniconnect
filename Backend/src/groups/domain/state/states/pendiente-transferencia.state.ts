import { BadRequestException, ForbiddenException } from '@nestjs/common';
import {
  IEstadoGrupo,
  IGroupStateContext,
  TransferPayload,
} from '../interfaces/group-state.interface';

/**
 * Estado PendienteTransferencia: hay una solicitud de transferencia en curso.
 * Transiciones permitidas:
 *   - aceptar()  → TransferenciaAceptada
 *   - rechazar() → Activo
 * Operaciones no permitidas: solicitar(), transferir()
 */
export class EstadoPendienteTransferencia implements IEstadoGrupo {
  getNombre(): string {
    return 'PendienteTransferencia';
  }

  solicitar(_context: IGroupStateContext, _payload: TransferPayload): void {
    throw new BadRequestException(
      'Ya existe una solicitud de transferencia en curso. Cancélala antes de iniciar una nueva.',
    );
  }

  aceptar(context: IGroupStateContext, payload: TransferPayload): void {
    const group = context.getGroupData();

    if (group.pending_owner_id === null) {
      throw new BadRequestException('No hay ninguna transferencia pendiente para este grupo');
    }
    if (group.pending_owner_id !== payload.currentUserId) {
      throw new ForbiddenException('No eres el candidato designado para recibir la propiedad de este grupo');
    }

    const { EstadoTransferenciaAceptada } = require('./transferencia-aceptada.state') as typeof import('./transferencia-aceptada.state');
    context.transitionTo(new EstadoTransferenciaAceptada());

    context.emitEvent({
      type: 'ADMIN_TRANSFER_ACCEPTED',
      payload: {
        id_group: group.id_group,
        group_name: group.name ?? 'Grupo',
        previous_owner_id: group.owner_id,
        new_owner_id: payload.currentUserId,
        nuevo_estado: 'TransferenciaAceptada',
      },
      targetUserId: group.owner_id!,
      timestamp: new Date(),
    });
  }

  rechazar(context: IGroupStateContext, payload: TransferPayload): void {
    const group = context.getGroupData();

    if (group.pending_owner_id === null) {
      throw new BadRequestException('No hay ninguna transferencia pendiente');
    }
    if (group.pending_owner_id !== payload.currentUserId) {
      throw new ForbiddenException('Solo el candidato designado puede rechazar la transferencia');
    }

    const { EstadoActivo } = require('./activo.state') as typeof import('./activo.state');
    context.transitionTo(new EstadoActivo());

    context.emitEvent({
      type: 'ADMIN_TRANSFER_DECLINED',
      payload: {
        id_group: group.id_group,
        group_name: group.name ?? 'Grupo',
        owner_id: group.owner_id,
        declined_by: payload.currentUserId,
        nuevo_estado: 'Activo',
      },
      targetUserId: group.owner_id!,
      timestamp: new Date(),
    });
  }

  transferir(_context: IGroupStateContext, _payload: TransferPayload): void {
    throw new BadRequestException(
      'No se puede iniciar una transferencia directa mientras hay una solicitud pendiente',
    );
  }
}
