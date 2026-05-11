import { StudyGroupSubject } from '../../observer/study-group-subject';
import { StudyGroupEvent } from '../../observer/study-group-event.interface';
import {
  IEstadoGrupo,
  IGroupStateContext,
  GroupData,
  TransferPayload,
} from '../interfaces/group-state.interface';

/**
 * Contexto del patrón State para el ciclo de vida de transferencia de grupo.
 * Mantiene una referencia al estado actual y delega las operaciones a él.
 * Los estados solo interactúan con este contexto a través de IGroupStateContext.
 */
export class GroupStateContext implements IGroupStateContext {
  private currentState: IEstadoGrupo;

  constructor(
    private readonly groupData: GroupData,
    initialState: IEstadoGrupo,
    private readonly subject: StudyGroupSubject,
  ) {
    this.currentState = initialState;
  }

  transitionTo(state: IEstadoGrupo): void {
    this.currentState = state;
  }

  getState(): IEstadoGrupo {
    return this.currentState;
  }

  getGroupData(): GroupData {
    return this.groupData;
  }

  emitEvent(event: StudyGroupEvent): void {
    this.subject.notify(event);
  }

  solicitar(payload: TransferPayload): void {
    this.currentState.solicitar(this, payload);
  }

  aceptar(payload: TransferPayload): void {
    this.currentState.aceptar(this, payload);
  }

  rechazar(payload: TransferPayload): void {
    this.currentState.rechazar(this, payload);
  }

  transferir(payload: TransferPayload): void {
    this.currentState.transferir(this, payload);
  }

  getNombreEstado(): string {
    return this.currentState.getNombre();
  }
}
