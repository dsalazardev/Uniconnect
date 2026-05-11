/**
 * GroupsService - BFF (Backend for Frontend) layer with Dependency Injection
 * 
 * Handles HTTP communication with the backend API for groups, invitations, and join requests.
 * Uses injected Axios instance for platform-agnostic HTTP calls.
 * 
 * This service is platform-agnostic and uses dependency injection to avoid
 * coupling with specific HTTP clients or state management libraries.
 */

import type { AxiosInstance } from 'axios';
import type {
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
} from '../types/groups';
import { GROUPS_ENDPOINTS, GROUP_INVITATIONS_ENDPOINTS } from '../api/endpoints';

export class GroupsService {
  private readonly api: AxiosInstance;

  /**
   * Constructor with Dependency Injection
   * @param axiosInstance - Configured Axios instance (injected)
   */
  constructor(axiosInstance: AxiosInstance) {
    this.api = axiosInstance;
  }

  // ==================== GROUPS ====================

  /**
   * Create a new study group
   */
  async createGroup(data: GroupCreateRequest): Promise<Group> {
    try {
      const response = await this.api.post(GROUPS_ENDPOINTS.CREATE_GROUP, data);
      return response.data;
    } catch (error: unknown) {
      console.error('Error al crear grupo:', error);
      const axiosError = error as { response?: { data?: { message?: string | string[] } } };
      const raw = axiosError.response?.data?.message;
      const message = Array.isArray(raw) ? raw[0] : raw || 'No se pudo crear el grupo';
      throw new Error(message);
    }
  }

  /**
   * Get groups created by the user (where they are owner/admin)
   */
  async getCreatedGroups(userId: number): Promise<Group[]> {
    try {
      const response = await this.api.get(GROUPS_ENDPOINTS.GET_CREATED_GROUPS(userId));
      return response.data;
    } catch (error) {
      console.error('Error al obtener grupos creados:', error);
      throw error;
    }
  }

  /**
   * Get groups where the user is a member
   */
  async getMemberGroups(userId: number): Promise<Group[]> {
    try {
      const response = await this.api.get(GROUPS_ENDPOINTS.GET_MEMBER_GROUPS(userId));
      return response.data;
    } catch (error) {
      console.error('Error al obtener grupos como miembro:', error);
      throw error;
    }
  }

  /**
   * Discover available groups based on user's enrolled courses
   */
  async discoverGroups(userId: number): Promise<Group[]> {
    try {
      const response = await this.api.get(GROUPS_ENDPOINTS.DISCOVER_GROUPS(userId));
      return response.data;
    } catch (error) {
      console.error('Error al descubrir grupos:', error);
      throw error;
    }
  }

  /**
   * Get groups for a specific course
   */
  async getGroupsByCourse(courseId: number): Promise<Group[]> {
    try {
      const response = await this.api.get(GROUPS_ENDPOINTS.GET_GROUPS_BY_COURSE(courseId));
      return response.data;
    } catch (error) {
      console.error('Error al obtener grupos por materia:', error);
      throw error;
    }
  }

  /**
   * Get details of a specific group
   */
  async getGroupDetail(groupId: number): Promise<Group> {
    try {
      const response = await this.api.get(GROUPS_ENDPOINTS.GET_GROUP_DETAIL(groupId));
      return response.data;
    } catch (error) {
      console.error('Error al obtener detalle del grupo:', error);
      throw error;
    }
  }

  /**
   * Delete a group (only owner)
   */
  async deleteGroup(groupId: number): Promise<void> {
    try {
      await this.api.delete(GROUPS_ENDPOINTS.DELETE_GROUP(groupId));
    } catch (error) {
      console.error('Error al eliminar grupo:', error);
      throw error;
    }
  }

  /**
   * Update a group
   */
  async updateGroup(groupId: number, data: GroupCreateRequest): Promise<Group> {
    try {
      const response = await this.api.patch(GROUPS_ENDPOINTS.UPDATE_GROUP(groupId), data);
      return response.data;
    } catch (error: unknown) {
      console.error('Error updating group:', error);
      const axiosError = error as { response?: { data?: { message?: string } } };
      throw new Error(axiosError.response?.data?.message || 'Error al actualizar el grupo');
    }
  }

  // ==================== INVITATIONS ====================

  /**
   * Send an invitation to a group (only admin)
   */
  async sendInvitation(data: GroupInvitationRequest): Promise<GroupInvitation> {
    try {
      const response = await this.api.post(GROUP_INVITATIONS_ENDPOINTS.SEND_INVITATION, data);
      return response.data;
    } catch (error) {
      console.error('Error al enviar invitación:', error);
      throw error;
    }
  }

  /**
   * Get pending invitations for the user
   */
  async getPendingInvitations(userId: number): Promise<GroupInvitation[]> {
    try {
      const response = await this.api.get(GROUP_INVITATIONS_ENDPOINTS.GET_PENDING_INVITATIONS(userId));
      return response.data;
    } catch (error) {
      console.error('Error al obtener invitaciones pendientes:', error);
      throw error;
    }
  }

  /**
   * Get invitations sent by the user
   */
  async getSentInvitations(userId: number): Promise<GroupInvitation[]> {
    try {
      const response = await this.api.get(GROUP_INVITATIONS_ENDPOINTS.GET_SENT_INVITATIONS(userId));
      return response.data;
    } catch (error) {
      console.error('Error al obtener invitaciones enviadas:', error);
      throw error;
    }
  }

  /**
   * Respond to an invitation (accept or reject)
   */
  async respondToInvitation(
    invitationId: number,
    response: 'accepted' | 'rejected'
  ): Promise<GroupInvitationResponse> {
    try {
      const endpoint = GROUP_INVITATIONS_ENDPOINTS.RESPOND_TO_INVITATION(invitationId);
      const payload = { status: response };
      
      const res = await this.api.patch(endpoint, payload);
      return res.data;
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: unknown; status?: number }; message?: string };
      console.error('[GroupsService] Error responding to invitation', { 
        invitationId, 
        response, 
        error: axiosError.response?.data || axiosError.message, 
        status: axiosError.response?.status 
      });
      throw error;
    }
  }

  /**
   * Cancel an invitation (only the sender)
   */
  async cancelInvitation(invitationId: number): Promise<void> {
    try {
      await this.api.delete(GROUP_INVITATIONS_ENDPOINTS.CANCEL_INVITATION(invitationId));
    } catch (error) {
      console.error('Error al cancelar invitación:', error);
      throw error;
    }
  }

  /**
   * Get connections with the same course as the group
   */
  async getConnectionsWithCourse(groupId: number): Promise<unknown> {
    const response = await this.api.get(GROUP_INVITATIONS_ENDPOINTS.GET_CONNECTIONS_WITH_COURSE(groupId));
    return response.data;
  }

  /**
   * Accept a group invitation
   */
  async acceptGroupInvitation(groupId: number, invitationId: number): Promise<unknown> {
    const res = await this.api.patch(
      GROUP_INVITATIONS_ENDPOINTS.ACCEPT_GROUP_INVITATION(groupId, invitationId),
      {}
    );
    return res.data;
  }

  /**
   * Reject a group invitation
   */
  async rejectGroupInvitation(groupId: number, invitationId: number): Promise<unknown> {
    const res = await this.api.patch(
      GROUP_INVITATIONS_ENDPOINTS.REJECT_GROUP_INVITATION(groupId, invitationId),
      {}
    );
    return res.data;
  }

  // ==================== JOIN REQUESTS ====================

  /**
   * Request to join a group
   */
  async requestJoinGroup(groupId: number): Promise<JoinRequestResponse> {
    try {
      const response = await this.api.post(GROUPS_ENDPOINTS.REQUEST_JOIN(groupId), {});
      return response.data;
    } catch (error) {
      console.error('Error al solicitar acceso al grupo:', error);
      throw error;
    }
  }

  /**
   * Get pending join requests for a specific group (for the owner)
   */
  async getGroupJoinRequests(groupId: number): Promise<GroupJoinRequest[]> {
    try {
      const response = await this.api.get(GROUPS_ENDPOINTS.GET_GROUP_PENDING_REQUESTS(groupId));
      return response.data;
    } catch (error) {
      console.error('Error al obtener solicitudes del grupo:', error);
      throw error;
    }
  }

  /**
   * Get pending join requests for all groups owned by the user
   */
  async getPendingJoinRequests(): Promise<GroupWithJoinRequests[]> {
    try {
      const response = await this.api.get(GROUPS_ENDPOINTS.GET_PENDING_REQUESTS);
      return response.data;
    } catch (error) {
      console.error('Error al obtener solicitudes pendientes:', error);
      throw error;
    }
  }

  /**
   * Accept a join request to a group
   */
  async acceptJoinRequest(groupId: number, requestId: number): Promise<GroupJoinRequest> {
    try {
      const response = await this.api.patch(
        GROUPS_ENDPOINTS.ACCEPT_REQUEST(groupId, requestId),
        {}
      );
      return response.data;
    } catch (error) {
      console.error('Error al aceptar solicitud:', error);
      throw error;
    }
  }

  /**
   * Reject a join request to a group
   */
  async rejectJoinRequest(groupId: number, requestId: number): Promise<void> {
    try {
      await this.api.patch(GROUPS_ENDPOINTS.REJECT_REQUEST(groupId, requestId), {});
    } catch (error) {
      console.error('Error al rechazar solicitud:', error);
      throw error;
    }
  }

  /**
   * Get detailed group information (including members and permissions)
   */
  async getGroupInfo(groupId: number): Promise<GroupInfo> {
    try {
      const response = await this.api.get(GROUPS_ENDPOINTS.GET_GROUP_INFO(groupId));
      return response.data;
    } catch (error) {
      console.error('Error al obtener información del grupo:', error);
      throw error;
    }
  }

  /**
   * Remove a member from the group (only for owner)
   */
  async removeMemberFromGroup(groupId: number, memberId: number): Promise<void> {
    try {
      await this.api.delete(GROUPS_ENDPOINTS.REMOVE_MEMBER(groupId, memberId));
    } catch (error: unknown) {
      console.error('Error al sacar miembro del grupo:', error);
      const axiosError = error as { response?: { data?: { message?: string | string[] } } };
      const raw = axiosError.response?.data?.message;
      const message = Array.isArray(raw) ? raw[0] : raw || 'No se pudo sacar al miembro del grupo';
      throw new Error(message);
    }
  }

  /**
   * Promote a member to admin (only for owner)
   */
  async makeMemberAdmin(groupId: number, memberId: number): Promise<void> {
    try {
      await this.api.patch(GROUPS_ENDPOINTS.MAKE_MEMBER_ADMIN(groupId, memberId), {});
    } catch (error) {
      console.error('Error al promocionar miembro a admin:', error);
      throw error;
    }
  }

  /**
   * Leave a group (cannot be owner)
   */
  async leaveGroup(groupId: number): Promise<void> {
    try {
      await this.api.delete(GROUPS_ENDPOINTS.LEAVE_GROUP(groupId));
    } catch (error) {
      console.error('Error al abandonar grupo:', error);
      throw error;
    }
  }

  // ==================== DIRECT MESSAGES ====================

  /**
   * Get all private chats for the authenticated user
   */
  async getDirectMessages(): Promise<Group[]> {
    try {
      const response = await this.api.get(GROUPS_ENDPOINTS.GET_DIRECT_MESSAGES);
      return response.data;
    } catch (error) {
      console.error('Error al obtener chats privados:', error);
      throw error;
    }
  }

  /**
   * Create or find a private chat with another user
   */
  async findOrCreateDirectMessage(targetUserId: number): Promise<DirectMessageResponse> {
    try {
      const response = await this.api.post(GROUPS_ENDPOINTS.FIND_OR_CREATE_DIRECT_MESSAGE(targetUserId), {});
      return response.data;
    } catch (error) {
      console.error('Error al crear/encontrar chat privado:', error);
      throw error;
    }
  }

  /**
   * Transfer group ownership to another member (legacy method)
   */
  async transferOwnership(groupId: number, newOwnerId: number): Promise<unknown> {
    try {
      const response = await this.api.patch(
        GROUPS_ENDPOINTS.TRANSFER_OWNERSHIP(groupId, newOwnerId),
        {}
      );
      return response.data;
    } catch (error) {
      console.error('Error al transferir propiedad:', error);
      throw error;
    }
  }

  // ==================== OWNERSHIP TRANSFER WITH CONFIRMATION (US-W02) ====================

  /**
   * Request ownership transfer to a candidate
   * POST /groups/:id/request-ownership-transfer/:candidateId
   * The owner designates a candidate. The candidate is set as pending_owner_id.
   */
  async requestOwnershipTransfer(groupId: number, candidateId: number): Promise<OwnershipTransferResponse> {
    try {
      const response = await this.api.post(
        GROUPS_ENDPOINTS.REQUEST_OWNERSHIP_TRANSFER(groupId, candidateId),
        {}
      );
      return response.data;
    } catch (error: unknown) {
      console.error('[GroupsService] requestOwnershipTransfer error:', error);
      const axiosError = error as { response?: { data?: { message?: string } } };
      throw new Error(axiosError.response?.data?.message || 'No se pudo solicitar la transferencia.');
    }
  }

  /**
   * Cancel a pending ownership transfer request
   * DELETE /groups/:id/cancel-ownership-transfer
   * The owner cancels the pending request.
   */
  async cancelOwnershipTransfer(groupId: number): Promise<{ message: string }> {
    try {
      const response = await this.api.delete(GROUPS_ENDPOINTS.CANCEL_OWNERSHIP_TRANSFER(groupId));
      return response.data;
    } catch (error: unknown) {
      console.error('[GroupsService] cancelOwnershipTransfer error:', error);
      const axiosError = error as { response?: { data?: { message?: string } } };
      throw new Error(axiosError.response?.data?.message || 'No se pudo cancelar la transferencia.');
    }
  }

  /**
   * Accept an ownership transfer
   * PATCH /groups/:id/accept-ownership-transfer
   * The candidate accepts the transfer.
   */
  async acceptOwnershipTransfer(groupId: number): Promise<OwnershipTransferResponse> {
    try {
      const response = await this.api.patch(GROUPS_ENDPOINTS.ACCEPT_OWNERSHIP_TRANSFER(groupId), {});
      return response.data;
    } catch (error: unknown) {
      console.error('[GroupsService] acceptOwnershipTransfer error:', error);
      const axiosError = error as { response?: { data?: { message?: string } } };
      throw new Error(axiosError.response?.data?.message || 'No se pudo aceptar la transferencia.');
    }
  }

  /**
   * Decline an ownership transfer
   * DELETE /groups/:id/decline-ownership-transfer
   * The candidate declines the proposal.
   */
  async declineOwnershipTransfer(groupId: number): Promise<{ message: string }> {
    try {
      const response = await this.api.delete(GROUPS_ENDPOINTS.DECLINE_OWNERSHIP_TRANSFER(groupId));
      return response.data;
    } catch (error: unknown) {
      console.error('[GroupsService] declineOwnershipTransfer error:', error);
      const axiosError = error as { response?: { data?: { message?: string } } };
      throw new Error(axiosError.response?.data?.message || 'No se pudo declinar la transferencia.');
    }
  }
}
