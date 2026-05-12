import {
  Injectable,
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MessagesGateway } from '../messages/messages.gateway';
import { CreatePollDto } from './dto/create-poll.dto';

export interface PollOptionResponse {
  id: number;
  text: string;
  count: number;
  percentage: number;
}

export interface PollResponse {
  id: number;
  groupId: number;
  createdBy: number;
  question: string;
  options: PollOptionResponse[];
  closesAt: string;
  status: 'ACTIVE' | 'CLOSED';
  createdAt: string;
  userVote: number | null;
}

@Injectable()
export class PollsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly messagesGateway: MessagesGateway,
  ) {}

  async createPoll(
    groupId: number,
    userId: number,
    dto: CreatePollDto,
  ): Promise<PollResponse> {
    if (new Date(dto.closesAt) <= new Date()) {
      throw new BadRequestException(
        'La fecha de cierre debe ser en el futuro.',
      );
    }

    const poll = await this.prisma.poll.create({
      data: {
        id_group: groupId,
        created_by: userId,
        question: dto.question,
        closes_at: new Date(dto.closesAt),
        options: {
          create: dto.options.map((text) => ({ text })),
        },
      },
      include: {
        options: { include: { votes: true } },
        votes: { where: { id_user: userId } },
      },
    });

    return this.formatPoll(poll);
  }

  async castVote(
    pollId: number,
    userId: number,
    optionId: number,
  ): Promise<PollResponse> {
    const poll = await this.prisma.poll.findUnique({
      where: { id_poll: pollId },
      include: { options: true },
    });

    if (!poll) {
      throw new NotFoundException('Encuesta no encontrada.');
    }
    if (poll.status === 'CLOSED') {
      throw new ConflictException('La encuesta ya está cerrada.');
    }

    const optionExists = poll.options.some((o) => o.id_option === optionId);
    if (!optionExists) {
      throw new NotFoundException('La opción no existe en esta encuesta.');
    }

    const existing = await this.prisma.poll_vote.findFirst({
      where: { id_poll: pollId, id_user: userId },
    });

    if (existing) {
      await this.prisma.poll_vote.update({
        where: { id_vote: existing.id_vote },
        data: { id_option: optionId },
      });
    } else {
      await this.prisma.poll_vote.create({
        data: { id_poll: pollId, id_user: userId, id_option: optionId },
      });
    }

    // Calcular conteos en memoria con una sola query liviana (sin getPoll completo).
    // Esto hace que el evento WS llegue a todos los clientes ~150ms antes.
    const allVotes = await this.prisma.poll_vote.findMany({
      where: { id_poll: pollId },
      select: { id_option: true, id_user: true },
    });

    const totalVotes = allVotes.length;
    const countMap = new Map<number, number>();
    for (const v of allVotes) {
      countMap.set(v.id_option, (countMap.get(v.id_option) ?? 0) + 1);
    }

    const updatedOptions: PollOptionResponse[] = poll.options.map((o) => {
      const count = countMap.get(o.id_option) ?? 0;
      return {
        id: o.id_option,
        text: o.text,
        count,
        percentage: totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0,
      };
    });

    // Emitir a todos los clientes del grupo inmediatamente (Observer via WS)
    this.messagesGateway.sendMessageToGroup(poll.id_group, 'poll:vote_updated', {
      pollId,
      options: updatedOptions,
    });

    // Devolver respuesta completa al votante (reutiliza datos ya en memoria)
    const userVoteFromDb = allVotes.find((v) => v.id_user === userId)?.id_option ?? null;
    return {
      id: poll.id_poll,
      groupId: poll.id_group,
      createdBy: poll.created_by,
      question: poll.question,
      options: updatedOptions,
      closesAt: poll.closes_at.toISOString(),
      status: poll.status as 'ACTIVE' | 'CLOSED',
      createdAt: poll.created_at.toISOString(),
      userVote: userVoteFromDb,
    };
  }

  /**
   * Emite poll:closed al room del grupo.
   * Llamado por PollSchedulerService (task 6) cuando expira el temporizador.
   */
  async emitPollClosed(pollId: number, closedAt: Date): Promise<void> {
    const poll = await this.prisma.poll.findUnique({
      where: { id_poll: pollId },
      include: { options: { include: { votes: true } } },
    });

    if (!poll) return;

    const totalVotes = poll.options.reduce(
      (sum, o) => sum + o.votes.length,
      0,
    );

    const options = poll.options.map((o) => ({
      id: o.id_option,
      text: o.text,
      count: o.votes.length,
      percentage:
        totalVotes > 0
          ? Math.round((o.votes.length / totalVotes) * 100)
          : 0,
    }));

    this.messagesGateway.sendMessageToGroup(poll.id_group, 'poll:closed', {
      pollId,
      options,
      closedAt: closedAt.toISOString(),
    });
  }

  async getPoll(pollId: number, userId: number): Promise<PollResponse> {
    const poll = await this.prisma.poll.findUnique({
      where: { id_poll: pollId },
      include: {
        options: { include: { votes: true } },
        votes: { where: { id_user: userId } },
      },
    });

    if (!poll) {
      throw new NotFoundException('Encuesta no encontrada.');
    }

    return this.formatPoll(poll);
  }

  private formatPoll(poll: any): PollResponse {
    const totalVotes = poll.options.reduce(
      (sum: number, o: any) => sum + (o.votes?.length ?? 0),
      0,
    );

    const userVote: number | null =
      poll.votes?.length > 0 ? (poll.votes[0].id_option as number) : null;

    return {
      id: poll.id_poll,
      groupId: poll.id_group,
      createdBy: poll.created_by,
      question: poll.question,
      options: poll.options.map((o: any) => {
        const count: number = o.votes?.length ?? 0;
        return {
          id: o.id_option,
          text: o.text,
          count,
          percentage:
            totalVotes > 0
              ? Math.round((count / totalVotes) * 100)
              : 0,
        };
      }),
      closesAt: poll.closes_at.toISOString(),
      status: poll.status as 'ACTIVE' | 'CLOSED',
      createdAt: poll.created_at.toISOString(),
      userVote,
    };
  }
}
