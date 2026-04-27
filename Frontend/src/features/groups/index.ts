// ==================== API & Endpoints ====================
export { groupsEndpoints, groupInvitationsEndpoints, groupJoinRequestsEndpoints } from './api/endpoints';

// ==================== Services ====================
export { groupsService, default as GroupsService } from './services/groups.service';

// ==================== Types ====================
export type {
  Group,
  Course,
  Program,
  CreateGroupData,
  UpdateGroupData,
  GroupMembership,
  GroupInvitation,
  SendInvitationDto,
  RespondInvitationDto,
  GroupCreateRequest,
  GroupInvitationRequest,
  GroupInvitationResponse,
  GroupJoinRequest,
  GroupWithJoinRequests,
  GroupInfo,
  JoinRequestDto,
  JoinRequestResponse,
} from './types';

// ==================== Hooks ====================
export {
  useMyGroups,
  useCreatedGroups,
  useDiscoverGroups,
  useGroupDetail,
} from './hooks/useMyGroups';
export { useGroupInvitations } from './hooks/useGroupInvitations';
export { useJoinRequest, useCheckJoinRequestStatus } from './hooks/useJoinRequest';
export {
  usePendingJoinRequests,
  useAcceptJoinRequest,
  useRejectJoinRequest,
} from './hooks/usePendingJoinRequests';
export {
  useGroupInfo,
  useRemoveMember,
  useMakeMemberAdmin,
  useLeaveGroup,
} from './hooks/useGroupInfo';

// ==================== Components ====================
export { GroupInvitationCard } from './components/GroupInvitationCard';
export { GroupJoinButton } from './components/GroupJoinButton';
export { JoinRequestsList } from './components/JoinRequestsList';
export { GroupMembersTab } from './components/GroupMembersTab';
export { GroupInfoHeader } from './components/GroupInfoHeader';
