import {
  Injectable,
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
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
  constructor(private readonly prisma: PrismaService) {}

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
      throw new ConflictException('Ya registraste tu voto en esta encuesta');
    }

    await this.prisma.poll_vote.create({
      data: { id_poll: pollId, id_user: userId, id_option: optionId },
    });

    return this.getPoll(pollId, userId);
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
