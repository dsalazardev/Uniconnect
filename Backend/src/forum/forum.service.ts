import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateQuestionDto } from './dto/create-question.dto';
import { CreateAnswerDto } from './dto/create-answer.dto';
import { buildValidacionPreguntaChain } from './domain/chain-of-responsibility/validacion-pregunta.factory';

@Injectable()
export class ForumService {
  constructor(private readonly prisma: PrismaService) {}

  async getQuestions(groupId: number) {
    const questions = await this.prisma.forum_question.findMany({
      where: { id_group: groupId },
      orderBy: [{ vote_count: 'desc' }, { created_at: 'asc' }],
      include: {
        membership: {
          include: { user: { select: { id_user: true, full_name: true, picture: true } } },
        },
      },
    });

    return questions.map((q) => this.formatQuestion(q));
  }

  async createQuestion(groupId: number, userId: number, membershipId: number | null, dto: CreateQuestionDto) {
    // Cadena CoR: matrícula → contenido → estadoGrupo
    const chain = buildValidacionPreguntaChain();
    const resultado = chain.manejar({
      userId,
      groupId,
      membershipId,
      title: dto.title,
      body: dto.body,
    });

    if (!resultado.valido) {
      if (resultado.codigoError === 'FORUM_MATRICULA_REQUERIDA') {
        throw new ForbiddenException(resultado.mensaje);
      }
      throw new BadRequestException(resultado.mensaje);
    }

    const question = await this.prisma.forum_question.create({
      data: {
        id_group: groupId,
        id_membership: membershipId,
        title: dto.title,
        body: dto.body,
      },
      include: {
        membership: {
          include: { user: { select: { id_user: true, full_name: true, picture: true } } },
        },
      },
    });
    return this.formatQuestion(question);
  }

  async getAnswers(questionId: number) {
    const question = await this.prisma.forum_question.findUnique({
      where: { id_question: questionId },
    });
    if (!question) throw new NotFoundException('Pregunta no encontrada.');

    const answers = await this.prisma.forum_answer.findMany({
      where: { id_question: questionId },
      orderBy: [
        { is_accepted: 'desc' },
        { vote_count: 'desc' },
        { created_at: 'asc' },
      ],
      include: {
        membership: {
          include: { user: { select: { id_user: true, full_name: true, picture: true } } },
        },
      },
    });

    return answers.map((a) => this.formatAnswer(a));
  }

  async createAnswer(questionId: number, membershipId: number, dto: CreateAnswerDto) {
    const question = await this.prisma.forum_question.findUnique({
      where: { id_question: questionId },
    });
    if (!question) throw new NotFoundException('Pregunta no encontrada.');

    const answer = await this.prisma.forum_answer.create({
      data: {
        id_question: questionId,
        id_membership: membershipId,
        body: dto.body,
      },
      include: {
        membership: {
          include: { user: { select: { id_user: true, full_name: true, picture: true } } },
        },
      },
    });

    // Incrementar answer_count en la pregunta
    await this.prisma.forum_question.update({
      where: { id_question: questionId },
      data: { answer_count: { increment: 1 } },
    });

    return this.formatAnswer(answer);
  }

  async acceptAnswer(answerId: number, requestingUserId: number) {
    const answer = await this.prisma.forum_answer.findUnique({
      where: { id_answer: answerId },
      include: { question: true },
    });
    if (!answer) throw new NotFoundException('Respuesta no encontrada.');

    // Quitar aceptación anterior si existe
    await this.prisma.forum_answer.updateMany({
      where: { id_question: answer.id_question, is_accepted: true },
      data: { is_accepted: false },
    });

    // Aceptar la nueva respuesta y marcar pregunta como RESOLVED
    const [accepted] = await this.prisma.$transaction([
      this.prisma.forum_answer.update({
        where: { id_answer: answerId },
        data: { is_accepted: true },
        include: {
          membership: {
            include: { user: { select: { id_user: true, full_name: true, picture: true } } },
          },
        },
      }),
      this.prisma.forum_question.update({
        where: { id_question: answer.id_question },
        data: { status: 'RESOLVED' },
      }),
    ]);

    return this.formatAnswer(accepted);
  }

  // ── Helpers ─────────────────────────────────────────────────────────────────

  private formatQuestion(q: any) {
    return {
      id: q.id_question,
      groupId: q.id_group,
      authorId: q.membership?.user?.id_user ?? null,
      authorName: q.membership?.user?.full_name ?? 'Usuario',
      title: q.title,
      body: q.body,
      status: q.status,
      voteCount: q.vote_count,
      answerCount: q.answer_count,
      createdAt: q.created_at.toISOString(),
    };
  }

  private formatAnswer(a: any) {
    return {
      id: a.id_answer,
      questionId: a.id_question,
      authorId: a.membership?.user?.id_user ?? null,
      authorName: a.membership?.user?.full_name ?? 'Usuario',
      body: a.body,
      voteCount: a.vote_count,
      isAccepted: a.is_accepted,
      createdAt: a.created_at.toISOString(),
    };
  }
}
