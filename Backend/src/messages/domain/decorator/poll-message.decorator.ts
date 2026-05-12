import { MessageDecorator } from './message-decorator.abstract';
import { IMessage } from './interfaces';

export type PollStatus = 'ACTIVE' | 'CLOSED';

export interface PollOption {
  id: number;
  text: string;
  count: number;
  percentage: number;
}

export interface PollData {
  pollId: number;
  question: string;
  options: PollOption[];
  closesAt: string;
  status: PollStatus;
  userVote: number | null;
}

/**
 * Decorator that adds poll capabilities to messages.
 * Composes with FileMessageDecorator, ReactionMessageDecorator, and MentionMessageDecorator
 * without modifying any of those classes or the IMessage base interface.
 */
export class PollMessageDecorator extends MessageDecorator {
  constructor(
    message: IMessage,
    private readonly poll: PollData,
  ) {
    super(message);
  }

  render(): string {
    const baseRender = JSON.parse(this.message.render());
    return JSON.stringify({
      ...baseRender,
      poll: this.poll,
    });
  }
}
