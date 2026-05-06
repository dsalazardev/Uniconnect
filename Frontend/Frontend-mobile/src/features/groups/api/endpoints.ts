import { API_BASE_URL } from '@/src/constants/api';

export const groupsEndpoints = {
  // Crear nuevo grupo
  createGroup: () =>
    `${API_BASE_URL}/groups`,

  // Obtener grupos creados por el usuario
  getCreatedGroups: (userId: number) =>
    `${API_BASE_URL}/groups/created-by/${userId}`,

  // Obtener grupos donde el usuario es miembro
  getMemberGroups: (userId: number) =>
    `${API_BASE_URL}/groups/member-of/${userId}`,

  // Descubrir grupos disponibles
  discoverGroups: (userId: number) =>
    `${API_BASE_URL}/groups/discover/${userId}`,

  // Obtener grupos por materia
  getGroupsByCourse: (courseId: number) =>
    `${API_BASE_URL}/groups/by-course/${courseId}`,

  // Obtener detalle de un grupo
  getGroupDetail: (groupId: number) =>
    `${API_BASE_URL}/groups/${groupId}`,

  // Actualizar grupo
  updateGroup: (groupId: number) =>
    `${API_BASE_URL}/groups/${groupId}`,

  // Eliminar grupo
  deleteGroup: (groupId: number) =>
    `${API_BASE_URL}/groups/${groupId}`,

  // ==================== DIRECT MESSAGES ====================
  
  // Obtener todos los chats privados del usuario
  getDirectMessages: () =>
    `${API_BASE_URL}/groups/direct-messages`,

  // Crear o encontrar chat privado con otro usuario
  findOrCreateDirectMessage: (targetUserId: number) =>
    `${API_BASE_URL}/groups/direct-message/${targetUserId}`,
};

export const groupInvitationsEndpoints = {
  // Enviar invitación
  sendInvitation: () =>
    `${API_BASE_URL}/group-invitations`,

  // Obtener invitaciones pendientes
  getPendingInvitations: (userId: number) =>
    `${API_BASE_URL}/group-invitations/pending/${userId}`,

  // Obtener invitaciones enviadas
  getSentInvitations: (userId: number) =>
    `${API_BASE_URL}/group-invitations/sent/${userId}`,

  // Responder a invitación
  respondToInvitation: (invitationId: number) =>
    `${API_BASE_URL}/group-invitations/${invitationId}/respond`,

  // Cancelar invitación
  cancelInvitation: (invitationId: number) =>
    `${API_BASE_URL}/group-invitations/${invitationId}`,

  getConnectionsWithCourse: (groupId: number) =>
    `${API_BASE_URL}/users/connections/with-courses/${groupId}`,

  // Aceptar invitación a grupo
  acceptGroupInvitation: (groupId: number, invitationId: number) =>
    `${API_BASE_URL}/groups/${groupId}/invitations/${invitationId}/accept`,

  // Rechazar invitación a grupo
  rejectGroupInvitation: (groupId: number, invitationId: number) =>
    `${API_BASE_URL}/groups/${groupId}/invitations/${invitationId}/reject`,
};

// ==================== JOIN REQUESTS ====================

export const groupJoinRequestsEndpoints = {
  // Solicitar acceso a un grupo
  requestJoin: (groupId: number) =>
    `${API_BASE_URL}/groups/${groupId}/join-request`,

  // Obtener solicitudes pendientes de un grupo específico (para el owner)
  getGroupPendingRequests: (groupId: number) =>
    `${API_BASE_URL}/groups/${groupId}/join-requests`,

  // Obtener solicitudes pendientes de todos los grupos del owner (endpoint genérico)
  getPendingRequests: () =>
    `${API_BASE_URL}/groups/owner/pending-requests`,

  // Aceptar solicitud
  acceptRequest: (groupId: number, requestId: number) =>
    `${API_BASE_URL}/groups/${groupId}/join-requests/${requestId}/accept`,

  // Rechazar solicitud
  rejectRequest: (groupId: number, requestId: number) =>
    `${API_BASE_URL}/groups/${groupId}/join-requests/${requestId}/reject`,

  // Obtener información del grupo (con permisos y miembros)
  getGroupInfo: (groupId: number) =>
    `${API_BASE_URL}/groups/${groupId}/info`,

  // Sacar miembro del grupo
  removeMember: (groupId: number, memberId: number) =>
    `${API_BASE_URL}/groups/${groupId}/members/${memberId}`,

  // Hacer admin a un miembro
  makeMemberAdmin: (groupId: number, memberId: number) =>
    `${API_BASE_URL}/groups/${groupId}/members/${memberId}/make-admin`,

  // Abandonar grupo
  leaveGroup: (groupId: number) =>
    `${API_BASE_URL}/groups/${groupId}/leave`,

  // Transferir propiedad del grupo
  transferOwnership: (groupId: number, newOwnerId: number) =>
    `${API_BASE_URL}/groups/${groupId}/transfer-ownership/${newOwnerId}`,

  // ==================== TRANSFERENCIA CON CONFIRMACIÓN (US-W02) ====================

  // Solicitar transferencia al candidato (owner → candidato)
  requestOwnershipTransfer: (groupId: number, candidateId: number) =>
    `${API_BASE_URL}/groups/${groupId}/request-ownership-transfer/${candidateId}`,

  // Cancelar transferencia pendiente (solo owner)
  cancelOwnershipTransfer: (groupId: number) =>
    `${API_BASE_URL}/groups/${groupId}/cancel-ownership-transfer`,

  // Aceptar transferencia (solo el candidato designado)
  acceptOwnershipTransfer: (groupId: number) =>
    `${API_BASE_URL}/groups/${groupId}/accept-ownership-transfer`,

  // Declinar transferencia (solo el candidato designado)
  declineOwnershipTransfer: (groupId: number) =>
    `${API_BASE_URL}/groups/${groupId}/decline-ownership-transfer`,
};