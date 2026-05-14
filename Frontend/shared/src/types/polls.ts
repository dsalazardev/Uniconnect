export type PollStatus = 'ACTIVE' | 'CLOSED';

export interface PollOption {
  id: number;
  text: string;
  count: number;
  percentage: number;
}

export interface Poll {
  id: number;
  groupId: number;
  createdBy: number;
  question: string;
  options: PollOption[];
  closesAt: string;
  status: PollStatus;
  createdAt: string;
}

export interface CreatePollDto {
  question: string;
  options: string[];
  closesAt: string;
}

export interface CastVoteDto {
  optionId: number;
}

export interface PollVoteUpdatedPayload {
  pollId: number;
  options: PollOption[];
}

export interface PollClosedPayload {
  pollId: number;
  options: PollOption[];
  closedAt: string;
}
