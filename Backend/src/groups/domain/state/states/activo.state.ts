import { BadRequestException, ForbiddenException } from '@nestjs/common';
import {
  IEstadoGrupo,
  IGroupStateContext,
  TransferPayload,
} from '../interfaces/group-state.interface';

/**
 * Estado Activo: el grupo opera con normalidad.
 * Transiciones permitidas:
 *   - solicitar() → PendienteTransferencia
 *   - transferir() → TransferenciaAceptada
 * Operaciones no permitidas: aceptar(), rechazar()
 */
export class EstadoActivo implements IEstadoGrupo {
  getNombre(): string {
    return 'Activo';
  }

  solicitar(context: IGroupStateContext, payload: TransferPayload): void {
    const group = context.getGroupData();

    if (group.is_direct_message) {
      throw new BadRequestException('No puedes transferir propiedad de un chat privado');
    }
    if (group.owner_id !== payload.currentUserId) {
      throw new ForbiddenException('Solo el propietario puede iniciar una transferencia');
    }
    if (payload.candidateId === payload.currentUserId) {
      throw new BadRequestException('No puedes transferirte la propiedad a ti mismo');
    }
    if (group.pending_owner_id !== null) {
      throw new BadRequestException(
        'Ya existe una solicitud de transferencia en curso. Cancélala antes de iniciar una nueva.',
      );
    }

    const { EstadoPendienteTransferencia } = require('./pendiente-transferencia.state') as typeof import('./pendiente-transferencia.state');
    context.transitionTo(new EstadoPendienteTransferencia());

    context.emitEvent({
      type: 'ADMIN_TRANSFER_REQUESTED',
      payload: {
        id_group: group.id_group,
        group_name: group.name ?? 'Grupo',
        current_owner_id: payload.currentUserId,
        candidate_id: payload.candidateId,
        candidate_name: payload.candidateName,
        nuevo_estado: 'PendienteTransferencia',
      },
      targetUserId: payload.candidateId!,
      timestamp: new Date(),
    });
  }

  aceptar(_context: IGroupStateContext, _payload: TransferPayload): void {
    throw new BadRequestException('No hay transferencia pendiente para aceptar');
  }

  rechazar(_context: IGroupStateContext, _payload: TransferPayload): void {
    throw new BadRequestException('No hay transferencia pendiente para rechazar');
  }

  transferir(context: IGroupStateContext, payload: TransferPayload): void {
    const group = context.getGroupData();

    if (group.is_direct_message) {
      throw new BadRequestException('No puedes transferir propiedad de un chat privado');
    }
    if (group.owner_id !== payload.currentUserId) {
      throw new ForbiddenException('Solo el propietario puede transferir el grupo');
    }

    const { EstadoTransferenciaAceptada } = require('./transferencia-aceptada.state') as typeof import('./transferencia-aceptada.state');
    context.transitionTo(new EstadoTransferenciaAceptada());

    context.emitEvent({
      type: 'ADMIN_TRANSFER_ACCEPTED',
      payload: {
        id_group: group.id_group,
        group_name: group.name ?? 'Grupo',
        previous_owner_id: payload.currentUserId,
        new_owner_id: payload.candidateId,
        nuevo_estado: 'TransferenciaAceptada',
      },
      targetUserId: payload.candidateId!,
      timestamp: new Date(),
    });
  }
}
