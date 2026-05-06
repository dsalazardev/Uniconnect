// Groups API endpoints

export const GROUPS_ENDPOINTS = {
  CREATE_GROUP: '/groups',
  GET_CREATED_GROUPS: (userId: number) => `/groups/created-by/${userId}`,
  GET_MEMBER_GROUPS: (userId: number) => `/groups/member-of/${userId}`,
  DISCOVER_GROUPS: (userId: number) => `/groups/discover/${userId}`,
  GET_GROUPS_BY_COURSE: (courseId: number) => `/groups/by-course/${courseId}`,
  GET_GROUP_DETAIL: (groupId: number) => `/groups/${groupId}`,
  UPDATE_GROUP: (groupId: number) => `/groups/${groupId}`,
  DELETE_GROUP: (groupId: number) => `/groups/${groupId}`,
  GET_DIRECT_MESSAGES: '/groups/direct-messages',
  FIND_OR_CREATE_DIRECT_MESSAGE: (targetUserId: number) => `/groups/direct-message/${targetUserId}`,
  REQUEST_JOIN: (groupId: number) => `/groups/${groupId}/join-request`,
  GET_GROUP_PENDING_REQUESTS: (groupId: number) => `/groups/${groupId}/join-requests`,
  GET_PENDING_REQUESTS: '/groups/owner/pending-requests',
  ACCEPT_REQUEST: (groupId: number, requestId: number) => `/groups/${groupId}/join-requests/${requestId}/accept`,
  REJECT_REQUEST: (groupId: number, requestId: number) => `/groups/${groupId}/join-requests/${requestId}/reject`,
  GET_GROUP_INFO: (groupId: number) => `/groups/${groupId}/info`,
  REMOVE_MEMBER: (groupId: number, memberId: number) => `/groups/${groupId}/members/${memberId}`,
  MAKE_MEMBER_ADMIN: (groupId: number, memberId: number) => `/groups/${groupId}/members/${memberId}/make-admin`,
  LEAVE_GROUP: (groupId: number) => `/groups/${groupId}/leave`,
  TRANSFER_OWNERSHIP: (groupId: number, newOwnerId: number) => `/groups/${groupId}/transfer-ownership/${newOwnerId}`,
  REQUEST_OWNERSHIP_TRANSFER: (groupId: number, candidateId: number) => `/groups/${groupId}/request-ownership-transfer/${candidateId}`,
  CANCEL_OWNERSHIP_TRANSFER: (groupId: number) => `/groups/${groupId}/cancel-ownership-transfer`,
  ACCEPT_OWNERSHIP_TRANSFER: (groupId: number) => `/groups/${groupId}/accept-ownership-transfer`,
  DECLINE_OWNERSHIP_TRANSFER: (groupId: number) => `/groups/${groupId}/decline-ownership-transfer`,
} as const;

export const GROUP_INVITATIONS_ENDPOINTS = {
  SEND_INVITATION: '/group-invitations',
  GET_PENDING_INVITATIONS: (userId: number) => `/group-invitations/pending/${userId}`,
  GET_SENT_INVITATIONS: (userId: number) => `/group-invitations/sent/${userId}`,
  RESPOND_TO_INVITATION: (invitationId: number) => `/group-invitations/${invitationId}/respond`,
  CANCEL_INVITATION: (invitationId: number) => `/group-invitations/${invitationId}`,
  GET_CONNECTIONS_WITH_COURSE: (groupId: number) => `/users/connections/with-courses/${groupId}`,
  ACCEPT_GROUP_INVITATION: (groupId: number, invitationId: number) => `/groups/${groupId}/invitations/${invitationId}/accept`,
  REJECT_GROUP_INVITATION: (groupId: number, invitationId: number) => `/groups/${groupId}/invitations/${invitationId}/reject`,
} as const;
