import type { PollOption, PollVoteUpdatedPayload, PollClosedPayload } from '../types/polls';

export const POLL_WS_EVENTS = {
  VOTE_UPDATED: 'poll:vote_updated',
  CLOSED: 'poll:closed',
} as const;

export type PollVoteUpdatedCallback = (pollId: number, options: PollOption[]) => void;
export type PollClosedCallback = (pollId: number, options: PollOption[], closedAt: string) => void;

/**
 * Platform-agnostic handler for poll WebSocket events.
 * Web and mobile dashboards instantiate this class and register the callbacks
 * on their own socket instances using POLL_WS_EVENTS constants.
 *
 * Usage:
 *   const handler = new PollSocketHandler(onVoteUpdated, onPollClosed);
 *   socket.on(POLL_WS_EVENTS.VOTE_UPDATED, (p) => handler.handleVoteUpdated(p));
 *   socket.on(POLL_WS_EVENTS.CLOSED,        (p) => handler.handlePollClosed(p));
 */
export class PollSocketHandler {
  constructor(
    private readonly onVoteUpdated: PollVoteUpdatedCallback,
    private readonly onPollClosed: PollClosedCallback,
  ) {}

  handleVoteUpdated(payload: PollVoteUpdatedPayload): void {
    this.onVoteUpdated(payload.pollId, payload.options);
  }

  handlePollClosed(payload: PollClosedPayload): void {
    this.onPollClosed(payload.pollId, payload.options, payload.closedAt);
  }
}
