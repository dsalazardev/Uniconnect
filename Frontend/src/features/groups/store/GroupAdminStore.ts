import { makeAutoObservable, runInAction } from 'mobx';
import { groupsService } from '../services/groups.service';
import { authStore } from '@/src/features/auth/store/AuthStore';
import { GroupJoinRequest, GroupMembership, GroupWithJoinRequests } from '../types';
import { QueryClient } from '@tanstack/react-query';

// ============================================================================
// GroupAdminStore — Estado reactivo para el panel de administración de grupos
// Patrón: makeAutoObservable + runInAction (igual que AuthStore)
// Actualización optimista en accept/reject con rollback ante fallo del backend
// ============================================================================

export class GroupAdminStore {
  // ---------------------------------------------------------------------------
  // Estado observable
  // ---------------------------------------------------------------------------

  /** Grupos del owner con sus solicitudes pendientes agrupadas */
  groupsWithRequests: GroupWithJoinRequests[] = [];

  /** Miembros del grupo actualmente seleccionado en el panel */
  members: GroupMembership[] = [];

  /** ID del grupo actualmente abierto en el panel de admin */
  activeGroupId: number | null = null;

  isLoading: boolean = false;
  isMembersLoading: boolean = false;
  error: string | null = null;

  pendingTransferCandidateId: number | null = null;
  isTransferLoading: boolean = false;
  isAcceptingTransfer: boolean = false;
  isDecliningTransfer: boolean = false;

  constructor() {
    makeAutoObservable(this);
  }

  // ---------------------------------------------------------------------------
  // Computed
  // ---------------------------------------------------------------------------

  /** Total de solicitudes pendientes en todos los grupos del owner */
  get totalPendingCount(): number {
    return this.groupsWithRequests.reduce(
      (sum, g) => sum + g.joinRequests.length,
      0,
    );
  }

  /** Solicitudes pendientes del grupo activo */
  get activePendingRequests(): GroupJoinRequest[] {
    if (!this.activeGroupId) return [];
    return (
      this.groupsWithRequests.find((g) => g.id_group === this.activeGroupId)
        ?.joinRequests ?? []
    );
  }

  // ---------------------------------------------------------------------------
  // Acciones
  // ---------------------------------------------------------------------------

  setActiveGroup(groupId: number | null) {
    this.activeGroupId = groupId;
  }

  clearError() {
    this.error = null;
  }

  /**
   * Carga todas las solicitudes pendientes de todos los grupos del owner.
   * Llama a GET /groups/owner/pending-requests
   */
  async fetchPendingRequests(): Promise<void> {
    const token = authStore.accessToken;
    if (!token) {
      runInAction(() => {
        this.error = 'No hay sesión activa.';
      });
      return;
    }

    runInAction(() => {
      this.isLoading = true;
      this.error = null;
    });

    try {
      const data = await groupsService.getPendingJoinRequests(token);

      runInAction(() => {
        this.groupsWithRequests = data;
        this.isLoading = false;
      });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Error al cargar solicitudes pendientes.';
      runInAction(() => {
        this.error = message;
        this.isLoading = false;
      });
      console.error('[GroupAdminStore] fetchPendingRequests error:', err);
    }
  }

  /**
   * Acepta una solicitud de unión con actualización optimista.
   * 1. Quita la solicitud del estado local inmediatamente.
   * 2. Llama al backend para confirmar.
   * 3. Si el backend falla, revierte el estado al snapshot previo.
   */
  async acceptRequest(requestId: number, groupId: number): Promise<void> {
    const token = authStore.accessToken;
    if (!token) return;

    // Snapshot para rollback
    const snapshot = this._snapshotRequests(groupId);

    // Actualización optimista
    this._removeRequestFromGroup(requestId, groupId);

    try {
      await groupsService.acceptJoinRequest(groupId, requestId, token);
      
    } catch (err: unknown) {
      const message = (() => {
        if (err instanceof Error) return err.message;
        if (err && typeof err === 'object' && 'response' in err) {
          const axiosErr = err as { response?: { data?: { message?: string } } };
          return axiosErr.response?.data?.message ?? 'No se pudo aceptar la solicitud.';
        }
        return 'No se pudo aceptar la solicitud.';
      })();

      runInAction(() => {
        this._restoreSnapshot(groupId, snapshot);
        this.error = message;
      });
      console.error('[GroupAdminStore] acceptRequest rollback:', err);
    }
  }

  /**
   * Rechaza una solicitud de unión con actualización optimista.
   * Mismo patrón que acceptRequest.
   */
  async rejectRequest(requestId: number, groupId: number): Promise<void> {
    const token = authStore.accessToken;
    if (!token) return;

    // Snapshot para rollback
    const snapshot = this._snapshotRequests(groupId);

    // Actualización optimista
    this._removeRequestFromGroup(requestId, groupId);

    try {
      await groupsService.rejectJoinRequest(groupId, requestId, token);
      
    } catch (err) {
      // Rollback
      runInAction(() => {
        this._restoreSnapshot(groupId, snapshot);
        this.error =
          err instanceof Error ? err.message : 'No se pudo rechazar la solicitud.';
      });
      console.error('[GroupAdminStore] rejectRequest rollback:', err);
    }
  }

  /**
   * Carga los miembros del grupo activo.
   * Llama a GET /groups/:id/members
   */
  async fetchMembers(groupId: number): Promise<void> {
    const token = authStore.accessToken;
    if (!token) return;

    runInAction(() => {
      this.isMembersLoading = true;
      this.error = null;
    });

    try {
      const data = await groupsService.getGroupInfo(groupId, token);

      runInAction(() => {
        this.members = data.memberships ?? [];
        this.isMembersLoading = false;
      });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Error al cargar miembros.';
      runInAction(() => {
        this.error = message;
        this.isMembersLoading = false;
      });
      console.error('[GroupAdminStore] fetchMembers error:', err);
    }
  }

  /**
   * Solicita la transferencia de ownership al candidato.
   * POST /groups/:id/request-ownership-transfer/:candidateId
   * Invalida el caché del grupo para reflejar el nuevo pending_owner_id en la UI.
   */
  async requestOwnershipTransfer(groupId: number, candidateId: number, queryClient?: QueryClient): Promise<void> {
    const token = authStore.accessToken;
    if (!token) return;

    runInAction(() => {
      this.isTransferLoading = true;
      this.error = null;
    });

    try {
      await groupsService.requestOwnershipTransfer(groupId, candidateId, token);

      runInAction(() => {
        this.pendingTransferCandidateId = candidateId;
        this.isTransferLoading = false;
      });

      // Invalidar caché del grupo para que la UI refleje pending_owner_id actualizado
      if (queryClient) {
        queryClient.invalidateQueries({ queryKey: ['group-info', groupId] });
        queryClient.invalidateQueries({ queryKey: ['myGroups'] });
        queryClient.invalidateQueries({ queryKey: ['createdGroups'] });
      }

      
    } catch (err) {
      runInAction(() => {
        this.error = err instanceof Error ? err.message : 'No se pudo solicitar la transferencia.';
        this.isTransferLoading = false;
      });
      console.error('[GroupAdminStore] requestOwnershipTransfer error:', err);
    }
  }

  /**
   * Cancela la transferencia de ownership pendiente.
   * DELETE /groups/:id/cancel-ownership-transfer
   */
  async cancelOwnershipTransfer(groupId: number): Promise<void> {
    const token = authStore.accessToken;
    if (!token) return;

    runInAction(() => {
      this.isTransferLoading = true;
      this.error = null;
    });

    try {
      await groupsService.cancelOwnershipTransfer(groupId, token);

      runInAction(() => {
        this.pendingTransferCandidateId = null;
        this.isTransferLoading = false;
      });

      
    } catch (err) {
      runInAction(() => {
        this.error = err instanceof Error ? err.message : 'No se pudo cancelar la transferencia.';
        this.isTransferLoading = false;
      });
      console.error('[GroupAdminStore] cancelOwnershipTransfer error:', err);
    }
  }

  /**
   * El candidato acepta la transferencia de ownership.
   * PATCH /groups/:id/accept-ownership-transfer
   */
  async acceptOwnershipTransfer(groupId: number): Promise<boolean> {
    const token = authStore.accessToken;
    if (!token) return false;

    runInAction(() => {
      this.isAcceptingTransfer = true;
      this.error = null;
    });

    try {
      await groupsService.acceptOwnershipTransfer(groupId, token);

      runInAction(() => {
        this.isAcceptingTransfer = false;
      });

      
      return true;
    } catch (err) {
      runInAction(() => {
        this.error = err instanceof Error ? err.message : 'No se pudo aceptar la transferencia.';
        this.isAcceptingTransfer = false;
      });
      console.error('[GroupAdminStore] acceptOwnershipTransfer error:', err);
      return false;
    }
  }

  /**
   * El candidato rechaza/declina la transferencia.
   * DELETE /groups/:id/decline-ownership-transfer
   */
  async rejectOwnershipTransfer(groupId: number): Promise<boolean> {
    const token = authStore.accessToken;
    if (!token) return false;

    runInAction(() => {
      this.isDecliningTransfer = true;
      this.error = null;
    });

    try {
      await groupsService.declineOwnershipTransfer(groupId, token);

      runInAction(() => {
        this.isDecliningTransfer = false;
      });

      
      return true;
    } catch (err) {
      runInAction(() => {
        this.error = err instanceof Error ? err.message : 'No se pudo declinar la transferencia.';
        this.isDecliningTransfer = false;
      });
      console.error('[GroupAdminStore] rejectOwnershipTransfer error:', err);
      return false;
    }
  }

  /** Limpia el estado al salir del panel de admin */
  reset() {
    this.groupsWithRequests = [];
    this.members = [];
    this.activeGroupId = null;
    this.isLoading = false;
    this.isMembersLoading = false;
    this.error = null;
    this.pendingTransferCandidateId = null;
    this.isTransferLoading = false;
    this.isAcceptingTransfer = false;
    this.isDecliningTransfer = false;
  }

  // ---------------------------------------------------------------------------
  // Helpers privados
  // ---------------------------------------------------------------------------

  /** Quita una solicitud del arreglo del grupo correspondiente */
  private _removeRequestFromGroup(requestId: number, groupId: number) {
    runInAction(() => {
      const group = this.groupsWithRequests.find((g) => g.id_group === groupId);
      if (group) {
        group.joinRequests = group.joinRequests.filter(
          (r) => r.id_request !== requestId,
        );
        // Si el grupo ya no tiene solicitudes, lo eliminamos de la lista
        if (group.joinRequests.length === 0) {
          this.groupsWithRequests = this.groupsWithRequests.filter(
            (g) => g.id_group !== groupId,
          );
        }
      }
    });
  }

  /** Toma un snapshot de las solicitudes de un grupo para poder hacer rollback */
  private _snapshotRequests(groupId: number): GroupJoinRequest[] {
    const group = this.groupsWithRequests.find((g) => g.id_group === groupId);
    return group ? [...group.joinRequests] : [];
  }

  /** Restaura el snapshot de solicitudes de un grupo */
  private _restoreSnapshot(groupId: number, snapshot: GroupJoinRequest[]) {
    const group = this.groupsWithRequests.find((g) => g.id_group === groupId);
    if (group) {
      group.joinRequests = snapshot;
    } else if (snapshot.length > 0) {
      // El grupo fue eliminado de la lista durante el optimistic update — lo restauramos
      this.groupsWithRequests.push({
        id_group: groupId,
        name: '',
        joinRequests: snapshot,
      });
    }
  }
}

// Singleton — mismo patrón que authStore
export const groupAdminStore = new GroupAdminStore();
