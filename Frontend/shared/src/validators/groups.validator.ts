import { z } from 'zod';
import { createFENResponseSchema } from './fen.validator';

/**
 * Group Schema
 * 
 * Esquema de validación para la entidad Group del backend.
 */
export const GroupSchema = z.object({
  id_group: z.number().int().positive(),
  name: z.string().nullable(),
  description: z.string().nullable(),
  id_course: z.number().int().positive().nullable(),
  owner_id: z.number().int().positive().nullable(),
  created_at: z.string().datetime(),
  is_direct_message: z.boolean(),
});

/**
 * Membership Schema
 */
export const MembershipSchema = z.object({
  id_membership: z.number().int().positive(),
  id_user: z.number().int().positive().nullable(),
  id_group: z.number().int().positive().nullable(),
  is_admin: z.boolean().nullable(),
  joined_at: z.string().datetime().nullable(),
});

/**
 * Group Invitation Schema
 */
export const GroupInvitationSchema = z.object({
  id_invitation: z.number().int().positive(),
  id_group: z.number().int().positive(),
  inviter_id: z.number().int().positive(),
  invitee_id: z.number().int().positive(),
  status: z.enum(['pending', 'accepted', 'rejected']),
  invited_at: z.string().datetime(),
  responded_at: z.string().datetime().nullable(),
});

/**
 * Group Join Request Schema
 */
export const GroupJoinRequestSchema = z.object({
  id_request: z.number().int().positive(),
  requester_id: z.number().int().positive(),
  id_group: z.number().int().positive(),
  status: z.enum(['pending', 'accepted', 'rejected']),
  requested_at: z.string().datetime(),
  responded_at: z.string().datetime().nullable(),
});

/**
 * Group Array Schema
 */
export const GroupArraySchema = z.array(GroupSchema);

/**
 * Membership Array Schema
 */
export const MembershipArraySchema = z.array(MembershipSchema);

/**
 * Group Invitation Array Schema
 */
export const GroupInvitationArraySchema = z.array(GroupInvitationSchema);

/**
 * Group Join Request Array Schema
 */
export const GroupJoinRequestArraySchema = z.array(GroupJoinRequestSchema);

/**
 * FEN Response Schemas for Groups
 */
export const GroupFENResponseSchema = createFENResponseSchema(GroupSchema);
export const GroupArrayFENResponseSchema = createFENResponseSchema(GroupArraySchema);
export const MembershipFENResponseSchema = createFENResponseSchema(MembershipSchema);
export const MembershipArrayFENResponseSchema = createFENResponseSchema(MembershipArraySchema);
export const GroupInvitationFENResponseSchema = createFENResponseSchema(GroupInvitationSchema);
export const GroupInvitationArrayFENResponseSchema = createFENResponseSchema(GroupInvitationArraySchema);
export const GroupJoinRequestFENResponseSchema = createFENResponseSchema(GroupJoinRequestSchema);
export const GroupJoinRequestArrayFENResponseSchema = createFENResponseSchema(GroupJoinRequestArraySchema);

/**
 * Create Group DTO Schema
 */
export const CreateGroupDTOSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  id_course: z.number().int().positive().optional(),
  is_direct_message: z.boolean().optional(),
});

/**
 * Update Group DTO Schema
 */
export const UpdateGroupDTOSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
});

/**
 * Invite User DTO Schema
 */
export const InviteUserDTOSchema = z.object({
  invitee_id: z.number().int().positive(),
});

/**
 * Respond Invitation DTO Schema
 */
export const RespondInvitationDTOSchema = z.object({
  status: z.enum(['accepted', 'rejected']),
});

/**
 * Transfer Ownership DTO Schema
 */
export const TransferOwnershipDTOSchema = z.object({
  new_owner_id: z.number().int().positive(),
});

/**
 * Type exports
 */
export type Group = z.infer<typeof GroupSchema>;
export type Membership = z.infer<typeof MembershipSchema>;
export type GroupInvitation = z.infer<typeof GroupInvitationSchema>;
export type GroupJoinRequest = z.infer<typeof GroupJoinRequestSchema>;
export type CreateGroupDTO = z.infer<typeof CreateGroupDTOSchema>;
export type UpdateGroupDTO = z.infer<typeof UpdateGroupDTOSchema>;
export type InviteUserDTO = z.infer<typeof InviteUserDTOSchema>;
export type RespondInvitationDTO = z.infer<typeof RespondInvitationDTOSchema>;
export type TransferOwnershipDTO = z.infer<typeof TransferOwnershipDTOSchema>;
