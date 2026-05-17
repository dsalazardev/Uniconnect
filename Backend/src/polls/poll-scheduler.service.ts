import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PollsService } from './polls.service';

// Node.js setTimeout max safe delay (~24.8 days). Polls beyond this are capped.
const MAX_TIMEOUT_MS = 2_147_483_647;

@Injectable()
export class PollSchedulerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PollSchedulerService.name);
  private readonly timers = new Map<number, NodeJS.Timeout>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly pollsService: PollsService,
  ) {}

  /**
   * On server start: close any polls that expired while the server was down,
   * then re-schedule all remaining active polls.
   * Wrapped in try/catch so a missing table (pre-migration) does not crash startup.
   */
  async onModuleInit(): Promise<void> {
    try {
      const now = new Date();

      // Close polls that expired during downtime
      const expired = await this.prisma.poll.findMany({
        where: { status: 'ACTIVE', closes_at: { lte: now } },
        select: { id_poll: true },
      });

      for (const { id_poll } of expired) {
        this.logger.log(`Closing expired poll ${id_poll} on startup`);
        await this.closePoll(id_poll);
      }

      // Re-schedule polls that are still in the future
      const active = await this.prisma.poll.findMany({
        where: { status: 'ACTIVE', closes_at: { gt: now } },
        select: { id_poll: true, closes_at: true },
      });

      for (const { id_poll, closes_at } of active) {
        this.schedulePollClose(id_poll, closes_at);
      }

      this.logger.log(
        `PollSchedulerService initialized — closed ${expired.length} expired, scheduled ${active.length} active polls`,
      );
    } catch (err: any) {
      // P2021 = table does not exist (migration not run yet). Skip gracefully.
      if (err?.code === 'P2021') {
        this.logger.warn(
          'Poll table not found — run `prisma migrate dev` to create it. Scheduler will be inactive until then.',
        );
      } else if (
        err?.message?.includes('Connection terminated') ||
        err?.message?.includes('connection timeout') ||
        err?.code === 'ECONNREFUSED'
      ) {
        // Transient connection error on startup — retry after 5 s
        this.logger.warn(
          'PollSchedulerService: DB not ready on startup, retrying in 5 s…',
        );
        setTimeout(() => void this.onModuleInit(), 5_000);
      } else {
        this.logger.error('PollSchedulerService init error:');
        this.logger.error(err);
      }
    }
  }

  onModuleDestroy(): void {
    for (const timer of this.timers.values()) {
      clearTimeout(timer);
    }
    this.timers.clear();
  }

  /**
   * Schedule auto-close for a poll.
   * Called by PollsController after POST /groups/:groupId/polls.
   */
  schedulePollClose(pollId: number, closesAt: Date): void {
    // Cancel any existing timer for this poll
    const existing = this.timers.get(pollId);
    if (existing) {
      clearTimeout(existing);
    }

    const delay = closesAt.getTime() - Date.now();

    if (delay <= 0) {
      void this.closePoll(pollId);
      return;
    }

    const safeDelay = Math.min(delay, MAX_TIMEOUT_MS);
    const timer = setTimeout(() => void this.closePoll(pollId), safeDelay);
    this.timers.set(pollId, timer);

    this.logger.log(
      `Scheduled poll ${pollId} to close in ${Math.round(safeDelay / 1000)}s`,
    );
  }

  /**
   * 1. Mark poll CLOSED in DB.
   * 2. Emit poll:closed via WebSocket through PollsService.
   */
  private async closePoll(pollId: number): Promise<void> {
    this.timers.delete(pollId);

    try {
      const closedAt = new Date();

      await this.prisma.poll.update({
        where: { id_poll: pollId },
        data: { status: 'CLOSED' },
      });

      await this.pollsService.emitPollClosed(pollId, closedAt);

      this.logger.log(`Poll ${pollId} closed at ${closedAt.toISOString()}`);
    } catch (err) {
      this.logger.error(`Failed to close poll ${pollId}:`, err);
    }
  }
}
