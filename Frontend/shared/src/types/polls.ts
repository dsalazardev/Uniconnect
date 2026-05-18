import type {
  Poll as ZodPoll,
  PollOption as ZodPollOption,
  PollStatus as ZodPollStatus,
  CreatePollDto as ZodCreatePollDto,
  CastVoteDto as ZodCastVoteDto,
  PollVoteUpdatedPayload as ZodPollVoteUpdatedPayload,
  PollClosedPayload as ZodPollClosedPayload,
} from '../validators/polls.validator';

export type PollStatus = ZodPollStatus;

export interface PollOption extends ZodPollOption {}
export interface Poll extends ZodPoll {}
export interface CreatePollDto extends ZodCreatePollDto {}
export interface CastVoteDto extends ZodCastVoteDto {}
export interface PollVoteUpdatedPayload extends ZodPollVoteUpdatedPayload {}
export interface PollClosedPayload extends ZodPollClosedPayload {}
