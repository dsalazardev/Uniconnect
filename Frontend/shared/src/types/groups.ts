// Group types
import type { Course } from './courses';

export interface Group {
  id_group: number;
  name: string;
  description: string;
  id_course: number;
  owner_id: number;
  created_at: string;
  is_direct_message?: boolean;
  user_request_status?: 'none' | 'join_requested' | 'invited';
  course: Course;
  owner?: {
    id_user: number;
    full_name: string;
    picture?: string;
  };
  _count?: {
    memberships: number;
  };
  member_count?: number;
  members_count?: number;
  last_message?: {
    text_content: string;
    send_at: string;
  };
  user_membership?: {
    id_membership: number;
    id_role: number;
    role: 'admin' | 'member';
  };
  memberships?: Array<{
    id_membership: number;
    id_user: number;
    is_admin?: boolean;
    user: {
      id_user: number;
      full_name: string;
      picture?: string;
      email: string;
    };
  }>;
}

export interface CreateGroupData {
  name: string;
  description: string;
  id_course: number;
}

export interface UpdateGroupData {
  name: string;
  description: string;
  id_course: number;
}

export interface GroupMembership {
  id_membership: number;
  id_group: number;
  id_user: number;
  role: 'admin' | 'member';
  joined_at: string;
  user?: {
    id_user: number;
    full_name: string;
    email: string;
    picture?: string;
  };
  group?: Group;
}

export interface GroupInvitation {
  id_invitation: number;
  id_group: number;
  inviter_id: number;
  invitee_id: number;
  status: 'pending' | 'accepted' | 'rejected';
  created_at: string;
  group?: {
    id_group: number;
    name: string;
    description?: string;
    course: {
      id_course: number;
      name: string;
      code: string;
    };
  };
  inviter?: {
    id_user: number;
    full_name: string;
    picture?: string;
  };
}

export interface SendInvitationDto {
  id_group: number;
  inviter_id: number;
  invitee_id: number;
}

export interface RespondInvitationDto {
  response: 'accepted' | 'rejected';
}

export interface GroupCreateRequest {
  name: string;
  description: string;
  id_course: number;
}

export interface GroupInvitationRequest {
  id_group: number;
  inviter_id: number;
  invitee_id: number;
}

export interface GroupInvitationResponse {
  message: string;
  invitation?: GroupInvitation;
  membership?: GroupMembership;
}

export interface GroupJoinRequest {
  id_request: number;
  id_group: number;
  id_user: number;
  status: 'pending' | 'accepted' | 'rejected';
  requested_at: string;
  group?: {
    id_group: number;
    name: string;
    description?: string;
    course?: {
      id_course: number;
      name: string;
    };
  };
  requester: {
    id_user: number;
    full_name: string;
    picture?: string;
    email: string;
    program?: {
      name: string;
    };
  };
}

export interface GroupWithJoinRequests {
  id_group: number;
  name: string;
  description?: string;
  joinRequests: GroupJoinRequest[];
}

export interface GroupInfo {
  id_group: number;
  name: string;
  description: string;
  id_course: number;
  course: {
    name: string;
    code?: string;
  };
  owner: {
    id_user: number;
    full_name: string;
    picture?: string;
  };
  created_at: string;
  pending_owner_id?: number | null;
  userRole: 'owner' | 'admin' | 'member' | 'none';
  canManage: boolean;
  canManageMembers: boolean;
  isMember: boolean;
  isOwner: boolean;
  hasPendingRequest?: boolean;
  hasActiveInvitation?: boolean;
  memberships: GroupMembership[];
}

export interface JoinRequestDto {
  id_group: number;
}

export interface JoinRequestResponse {
  id_request: number;
  status: 'pending';
  requested_at: string;
  requester: {
    id_user: number;
    full_name: string;
    picture?: string;
    email: string;
  };
}

export interface DirectMessageResponse {
  success: boolean;
  isNew: boolean;
  group: Group;
}

export interface OwnershipTransferResponse {
  message: string;
  group?: {
    id_group: number;
    name: string | null;
    owner_id: number | null;
    pending_owner_id: number | null;
  };
  candidate?: {
    id_user: number;
    full_name: string;
    email: string;
  };
  previous_owner_id?: number;
  new_owner_id?: number;
}

export interface GroupFilters {
  search?: string;
  id_course?: number;
}
