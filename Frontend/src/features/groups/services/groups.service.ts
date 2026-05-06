import axios from 'axios';
import { groupsEndpoints, groupInvitationsEndpoints, groupJoinRequestsEndpoints } from '../api/endpoints';
import {
  Group,
  GroupCreateRequest,
  GroupInvitation,
  GroupInvitationRequest,
  GroupInvitationResponse,
  GroupJoinRequest,
  GroupWithJoinRequests,
  GroupInfo,
  JoinRequestResponse,
  DirectMessageResponse,
  OwnershipTransferResponse,
} from '../types';

class GroupsService {
  /**
   * Crear nuevo grupo de estudio
   */
  async createGroup(data: GroupCreateRequest, token: string): Promise<Group> {
    try {
      const response = await axios.post(groupsEndpoints.createGroup(), data, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return response.data;
    } catch (error: any) {
      console.error('Error al crear grupo:', error);
      // NestJS puede devolver message como string o array
      const raw = error.response?.data?.message;
      const message = Array.isArray(raw) ? raw[0] : raw || 'No se pudo crear el grupo';
      throw new Error(message);
    }
  }

  /**
   * Obtener grupos creados por el usuario (donde es owner/admin)
   */
  async getCreatedGroups(userId: number, token: string): Promise<Group[]> {
    try {
      const response = await axios.get(groupsEndpoints.getCreatedGroups(userId), {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return response.data;
    } catch (error) {
      console.error('Error al obtener grupos creados:', error);
      throw error;
    }
  }

  /**
   * Obtener grupos donde el usuario es miembro
   */
  async getMemberGroups(userId: number, token: string): Promise<Group[]> {
    try {
      const response = await axios.get(groupsEndpoints.getMemberGroups(userId), {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return response.data;
    } catch (error) {
      console.error('Error al obtener grupos como miembro:', error);
      throw error;
    }
  }

  /**
   * Descubrir grupos disponibles según las materias inscritas del usuario
   */
  async discoverGroups(userId: number, token: string): Promise<Group[]> {
    try {
      const response = await axios.get(groupsEndpoints.discoverGroups(userId), {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return response.data;
    } catch (error) {
      console.error('Error al descubrir grupos:', error);
      throw error;
    }
  }

  /**
   * Obtener grupos de una materia específica
   */
  async getGroupsByCourse(courseId: number, token: string): Promise<Group[]> {
    try {
      const response = await axios.get(groupsEndpoints.getGroupsByCourse(courseId), {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return response.data;
    } catch (error) {
      console.error('Error al obtener grupos por materia:', error);
      throw error;
    }
  }

  /**
   * Obtener detalle de un grupo específico
   */
  async getGroupDetail(groupId: number, token: string): Promise<Group> {
    try {
      const response = await axios.get(groupsEndpoints.getGroupDetail(groupId), {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return response.data;
    } catch (error) {
      console.error('Error al obtener detalle del grupo:', error);
      throw error;
    }
  }

  /**
   * Eliminar grupo (solo owner)
   */
  async deleteGroup(groupId: number, token: string): Promise<void> {
    try {
      await axios.delete(groupsEndpoints.deleteGroup(groupId), {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
    } catch (error) {
      console.error('Error al eliminar grupo:', error);
      throw error;
    }
  }
  async updateGroup(groupId: number, data: GroupCreateRequest, token: string): Promise<Group> {
    try {
      const response = await axios.patch(
        groupsEndpoints.updateGroup(groupId),
        data,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      return response.data;
    } catch (error: any) {
      console.error('Error updating group:', error);
      throw new Error(error.response?.data?.message || 'Error al actualizar el grupo');
    }
  }


  // ==================== INVITACIONES ====================

  /**
   * Enviar invitación a un grupo (solo admin)
   */
  async sendInvitation(data: GroupInvitationRequest, token: string): Promise<GroupInvitation> {
    try {
      const response = await axios.post(groupInvitationsEndpoints.sendInvitation(), data, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return response.data;
    } catch (error) {
      console.error('Error al enviar invitación:', error);
      throw error;
    }
  }

  /**
   * Obtener invitaciones pendientes del usuario
   */
  async getPendingInvitations(userId: number, token: string): Promise<GroupInvitation[]> {
    try {
      const response = await axios.get(groupInvitationsEndpoints.getPendingInvitations(userId), {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return response.data;
    } catch (error) {
      console.error('Error al obtener invitaciones pendientes:', error);
      throw error;
    }
  }

  /**
   * Obtener invitaciones enviadas por el usuario
   */
  async getSentInvitations(userId: number, token: string): Promise<GroupInvitation[]> {
    try {
      const response = await axios.get(groupInvitationsEndpoints.getSentInvitations(userId), {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return response.data;
    } catch (error) {
      console.error('Error al obtener invitaciones enviadas:', error);
      throw error;
    }
  }

  /**
   * Responder a una invitación (aceptar o rechazar)
   */
  async respondToInvitation(
    invitationId: number,
    response: 'accepted' | 'rejected',
    token: string
  ): Promise<GroupInvitationResponse> {
    try {
      const endpoint = groupInvitationsEndpoints.respondToInvitation(invitationId);
      const payload = { status: response };
      
      const res = await axios.patch(
        endpoint,
        payload, // Corregido: backend espera 'status', no 'response'
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      return res.data;
    } catch (error: any) {
      console.error('[GroupsService] Error responding to invitation', { 
        invitationId, 
        response, 
        error: error.response?.data || error.message, 
        status: error.response?.status 
      });
      throw error;
    }
  }

  /**
   * Cancelar invitación (solo quien la envió)
   */
  async cancelInvitation(invitationId: number, token: string): Promise<void> {
    try {
      await axios.delete(groupInvitationsEndpoints.cancelInvitation(invitationId), {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
    } catch (error) {
      console.error('Error al cancelar invitación:', error);
      throw error;
    }
  }

  // ==================== JOIN REQUESTS ====================

  /**
   * Solicitar acceso a un grupo
   */
  async requestJoinGroup(groupId: number, token: string): Promise<JoinRequestResponse> {
    try {
      const response = await axios.post(
        groupJoinRequestsEndpoints.requestJoin(groupId),
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      return response.data;
    } catch (error) {
      console.error('Error al solicitar acceso al grupo:', error);
      throw error;
    }
  }

  /**
   * Obtener solicitudes pendientes de acceso a un grupo específico (para el owner)
   */
  async getGroupJoinRequests(groupId: number, token: string): Promise<GroupJoinRequest[]> {
    try {
      const response = await axios.get(
        groupJoinRequestsEndpoints.getGroupPendingRequests(groupId),
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      return response.data;
    } catch (error) {
      console.error('Error al obtener solicitudes del grupo:', error);
      throw error;
    }
  }

  /**
   * Obtener solicitudes pendientes de acceso a todos los grupos del owner
   */
  async getPendingJoinRequests(token: string): Promise<GroupWithJoinRequests[]> {
    try {
      const response = await axios.get(
        groupJoinRequestsEndpoints.getPendingRequests(),
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      return response.data;
    } catch (error) {
      console.error('Error al obtener solicitudes pendientes:', error);
      throw error;
    }
  }

  /**
   * Aceptar solicitud de acceso a un grupo
   */
  async acceptJoinRequest(groupId: number, requestId: number, token: string): Promise<GroupJoinRequest> {
    try {
      const response = await axios.patch(
        groupJoinRequestsEndpoints.acceptRequest(groupId, requestId),
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      return response.data;
    } catch (error) {
      console.error('Error al aceptar solicitud:', error);
      throw error;
    }
  }

  /**
   * Rechazar solicitud de acceso a un grupo
   */
  async rejectJoinRequest(groupId: number, requestId: number, token: string): Promise<void> {
    try {
      await axios.patch(
        groupJoinRequestsEndpoints.rejectRequest(groupId, requestId),
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
    } catch (error) {
      console.error('Error al rechazar solicitud:', error);
      throw error;
    }
  }

  /**
   * Obtener información detallada del grupo (incluyendo miembros y permisos)
   */
  async getGroupInfo(groupId: number, token: string): Promise<GroupInfo> {
    try {
      const response = await axios.get(
        groupJoinRequestsEndpoints.getGroupInfo(groupId),
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      return response.data;
    } catch (error) {
      console.error('Error al obtener información del grupo:', error);
      throw error;
    }
  }

  /**
   * Sacar un miembro del grupo (solo para owner)
   */
  async removeMemberFromGroup(groupId: number, memberId: number, token: string): Promise<void> {
    try {
      await axios.delete(
        groupJoinRequestsEndpoints.removeMember(groupId, memberId),
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
    } catch (error) {
      console.error('Error al sacar miembro del grupo:', error);
      throw error;
    }
  }

  /**
   * Promocionar a admin a un miembro del grupo (solo para owner)
   */
  async makeMemberAdmin(groupId: number, memberId: number, token: string): Promise<void> {
    try {
      await axios.patch(
        groupJoinRequestsEndpoints.makeMemberAdmin(groupId, memberId),
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
    } catch (error) {
      console.error('Error al promocionar miembro a admin:', error);
      throw error;
    }
  }

  /**
   * Abandonar un grupo (no puede ser owner)
   */
  async leaveGroup(groupId: number, token: string): Promise<void> {
    try {
      await axios.delete(
        groupJoinRequestsEndpoints.leaveGroup(groupId),
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
    } catch (error) {
      console.error('Error al abandonar grupo:', error);
      throw error;
    }
  }

  async getConnectionsWithCourse(groupId: number, token: string) {
    const response = await axios.get(
      groupInvitationsEndpoints.getConnectionsWithCourse(groupId),
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    return response.data;
  }

  async getGroupJoinRequests(groupId: number, token: string): Promise<{ id_user: number }[]> {
    const response = await axios.get(
      groupJoinRequestsEndpoints.getGroupPendingRequests(groupId),
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return response.data;
  }

  async acceptGroupInvitation(groupId: number, invitationId: number, token: string) {
    const res = await axios.patch(
      groupInvitationsEndpoints.acceptGroupInvitation(groupId, invitationId),
      {},
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data;
  }

  async rejectGroupInvitation(groupId: number, invitationId: number, token: string) {
    const res = await axios.patch(
      groupInvitationsEndpoints.rejectGroupInvitation(groupId, invitationId),
      {},
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data;
  }

  // ==================== DIRECT MESSAGES ====================

  /**
   * Obtener todos los chats privados del usuario autenticado
   */
  async getDirectMessages(token: string): Promise<Group[]> {
    try {
      const response = await axios.get(groupsEndpoints.getDirectMessages(), {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return response.data;
    } catch (error) {
      console.error('Error al obtener chats privados:', error);
      throw error;
    }
  }

  /**
   * Crear o encontrar un chat privado con otro usuario
   */
  async findOrCreateDirectMessage(targetUserId: number, token: string): Promise<DirectMessageResponse> {
    try {
      const response = await axios.post(
        groupsEndpoints.findOrCreateDirectMessage(targetUserId),
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      return response.data;
    } catch (error) {
      console.error('Error al crear/encontrar chat privado:', error);
      throw error;
    }
  }

  /**
   * Transferir propiedad del grupo a otro miembro
   */
  async transferOwnership(groupId: number, newOwnerId: number, token: string): Promise<any> {
    try {
      const response = await axios.patch(
        groupJoinRequestsEndpoints.transferOwnership(groupId, newOwnerId),
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      return response.data;
    } catch (error) {
      console.error('Error al transferir propiedad:', error);
      throw error;
    }
  }

  // ==================== TRANSFERENCIA CON CONFIRMACIÓN (US-W02) ====================

  /**
   * POST /groups/:id/request-ownership-transfer/:candidateId
   * El owner designa un candidato. El candidato queda en pending_owner_id.
   */
  async requestOwnershipTransfer(groupId: number, candidateId: number, token: string): Promise<OwnershipTransferResponse> {
    try {
      const response = await axios.post(
        groupJoinRequestsEndpoints.requestOwnershipTransfer(groupId, candidateId),
        {},
        { headers: { Authorization: `Bearer ${token}` } },
      );
      return response.data;
    } catch (error: any) {
      console.error('[GroupsService] requestOwnershipTransfer error:', error);
      throw new Error(error.response?.data?.message || 'No se pudo solicitar la transferencia.');
    }
  }

  /**
   * DELETE /groups/:id/cancel-ownership-transfer
   * El owner cancela la solicitud pendiente.
   */
  async cancelOwnershipTransfer(groupId: number, token: string): Promise<{ message: string }> {
    try {
      const response = await axios.delete(
        groupJoinRequestsEndpoints.cancelOwnershipTransfer(groupId),
        { headers: { Authorization: `Bearer ${token}` } },
      );
      return response.data;
    } catch (error: any) {
      console.error('[GroupsService] cancelOwnershipTransfer error:', error);
      throw new Error(error.response?.data?.message || 'No se pudo cancelar la transferencia.');
    }
  }

  /**
   * PATCH /groups/:id/accept-ownership-transfer
   * El candidato acepta la transferencia.
   */
  async acceptOwnershipTransfer(groupId: number, token: string): Promise<OwnershipTransferResponse> {
    try {
      const response = await axios.patch(
        groupJoinRequestsEndpoints.acceptOwnershipTransfer(groupId),
        {},
        { headers: { Authorization: `Bearer ${token}` } },
      );
      return response.data;
    } catch (error: any) {
      console.error('[GroupsService] acceptOwnershipTransfer error:', error);
      throw new Error(error.response?.data?.message || 'No se pudo aceptar la transferencia.');
    }
  }

  /**
   * DELETE /groups/:id/decline-ownership-transfer
   * El candidato declina la propuesta.
   */
  async declineOwnershipTransfer(groupId: number, token: string): Promise<{ message: string }> {
    try {
      const response = await axios.delete(
        groupJoinRequestsEndpoints.declineOwnershipTransfer(groupId),
        { headers: { Authorization: `Bearer ${token}` } },
      );
      return response.data;
    } catch (error: any) {
      console.error('[GroupsService] declineOwnershipTransfer error:', error);
      throw new Error(error.response?.data?.message || 'No se pudo declinar la transferencia.');
    }
  }
}

export const groupsService = new GroupsService();
export default GroupsService;