import { z } from 'zod';
import { createFENResponseSchema } from './fen.validator';

export const PollStatusSchema = z.enum(['ACTIVE', 'CLOSED']);

export const PollOptionSchema = z.object({
  id: z.number().int().positive(),
  text: z.string(),
  count: z.number().int().min(0),
  percentage: z.number().int().min(0).max(100),
});

export const PollOptionArraySchema = z.array(PollOptionSchema);

export const PollSchema = z.object({
  id: z.number().int().positive(),
  groupId: z.number().int().positive(),
  createdBy: z.number().int().positive(),
  question: z.string(),
  options: PollOptionArraySchema,
  closesAt: z.string().datetime(),
  status: PollStatusSchema,
  createdAt: z.string().datetime(),
  userVote: z.number().int().positive().nullable(),
});

export const PollArraySchema = z.array(PollSchema);
export const PollFENResponseSchema = createFENResponseSchema(PollSchema);
export const PollArrayFENResponseSchema = createFENResponseSchema(PollArraySchema);

export const CreatePollDtoSchema = z.object({
  question: z.string().min(1).max(500),
  options: z.array(z.string()).min(2).max(10),
  closesAt: z.string().datetime(),
});

export const CastVoteDtoSchema = z.object({
  optionId: z.number().int().positive(),
});

export const PollVoteUpdatedPayloadSchema = z.object({
  pollId: z.number().int().positive(),
  options: PollOptionArraySchema,
});

export const PollClosedPayloadSchema = z.object({
  pollId: z.number().int().positive(),
  options: PollOptionArraySchema,
  closedAt: z.string().datetime(),
});

export type Poll = z.infer<typeof PollSchema>;
export type PollOption = z.infer<typeof PollOptionSchema>;
export type PollStatus = z.infer<typeof PollStatusSchema>;
export type CreatePollDto = z.infer<typeof CreatePollDtoSchema>;
export type CastVoteDto = z.infer<typeof CastVoteDtoSchema>;
export type PollVoteUpdatedPayload = z.infer<typeof PollVoteUpdatedPayloadSchema>;
export type PollClosedPayload = z.infer<typeof PollClosedPayloadSchema>;
