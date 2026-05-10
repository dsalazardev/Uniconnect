import { StudyGroupEvent } from '../../observer/study-group-event.interface';

export interface TransferPayload {
  groupId: number;
  currentUserId: number;
  candidateId?: number;
  groupName?: string;
  candidateName?: string;
}

export interface GroupData {
  id_group: number;
  name: string | null;
  owner_id: number | null;
  pending_owner_id: number | null;
  is_direct_message: boolean;
}

/**
 * Contrato del contexto que los estados concretos reciben.
 * Evita dependencia circular: los estados solo conocen IGroupStateContext.
 */
export interface IGroupStateContext {
  transitionTo(state: IEstadoGrupo): void;
  getGroupData(): GroupData;
  emitEvent(event: StudyGroupEvent): void;
}

/**
 * Interfaz del patrón State para el ciclo de vida de un grupo.
 * Cinco estados concretos implementan esta interfaz:
 * Activo, PendienteTransferencia, TransferenciaAceptada, Disuelto, Bloqueado.
 *
 * Regla: ningún estado concreto referencia a otro estado directamente;
 * todas las transiciones pasan por IGroupStateContext.transitionTo(IEstadoGrupo).
 */
export interface IEstadoGrupo {
  solicitar(context: IGroupStateContext, payload: TransferPayload): void;
  aceptar(context: IGroupStateContext, payload: TransferPayload): void;
  rechazar(context: IGroupStateContext, payload: TransferPayload): void;
  transferir(context: IGroupStateContext, payload: TransferPayload): void;
  getNombre(): string;
}
