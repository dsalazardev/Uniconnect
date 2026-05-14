import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MessagesGateway } from '../messages/messages.gateway';
import { CreateQuestionDto } from './dto/create-question.dto';
import { CreateAnswerDto } from './dto/create-answer.dto';
import { buildValidacionPreguntaChain } from './domain/chain-of-responsibility/validacion-pregunta.factory';

@Injectable()
export class ForumService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly gateway: MessagesGateway,
  ) {}

  // ── Consultas ────────────────────────────────────────────────────────────────

  async getQuestions(courseId: number) {
    const questions = await this.prisma.forum_question.findMany({
      where: { id_course: courseId },
      orderBy: [{ vote_count: 'desc' }, { created_at: 'asc' }],
      include: { author: { select: { id_user: true, full_name: true, picture: true } } },
    });
    return questions.map(this.formatQuestion);
  }

  async getAnswers(questionId: number) {
    const question = await this.prisma.forum_question.findUnique({
      where: { id_question: questionId },
    });
    if (!question) throw new NotFoundException('Pregunta no encontrada.');

    const answers = await this.prisma.forum_answer.findMany({
      where: { id_question: questionId },
      orderBy: [{ is_accepted: 'desc' }, { vote_count: 'desc' }, { created_at: 'asc' }],
      include: { author: { select: { id_user: true, full_name: true, picture: true } } },
    });
    return answers.map(this.formatAnswer);
  }

  // ── Escritura ─────────────────────────────────────────────────────────────────

  async createQuestion(courseId: number, userId: number, dto: CreateQuestionDto) {
    // CoR: matrícula → contenido → estadoGrupo
    const chain = buildValidacionPreguntaChain();
    const enrollment = await this.prisma.enrollment.findFirst({
      where: { id_user: userId, id_course: courseId },
    });
    const resultado = chain.manejar({
      userId,
      groupId: courseId,
      membershipId: enrollment ? 1 : null, // 1 = tiene matrícula
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
      data: { id_course: courseId, id_user: userId, title: dto.title, body: dto.body },
      include: { author: { select: { id_user: true, full_name: true, picture: true } } },
    });
    return this.formatQuestion(question);
  }

  async createAnswer(questionId: number, userId: number, dto: CreateAnswerDto) {
    const question = await this.prisma.forum_question.findUnique({
      where: { id_question: questionId },
      select: { id_course: true },
    });
    if (!question) throw new NotFoundException('Pregunta no encontrada.');

    const enrollment = await this.prisma.enrollment.findFirst({
      where: { id_user: userId, id_course: question.id_course },
    });
    if (!enrollment) throw new ForbiddenException('Se requiere matrícula en la asignatura.');

    const answer = await this.prisma.forum_answer.create({
      data: { id_question: questionId, id_user: userId, body: dto.body },
      include: { author: { select: { id_user: true, full_name: true, picture: true } } },
    });

    await this.prisma.forum_question.update({
      where: { id_question: questionId },
      data: { answer_count: { increment: 1 } },
    });

    return this.formatAnswer(answer);
  }

  async acceptAnswer(answerId: number, userId: number) {
    const answer = await this.prisma.forum_answer.findUnique({
      where: { id_answer: answerId },
      include: { question: { select: { id_question: true, id_course: true } } },
    });
    if (!answer) throw new NotFoundException('Respuesta no encontrada.');

    // Solo quien tenga rol docente (is_admin en algún grupo del curso, o enrollment con rol admin)
    // Simplificación: cualquier usuario matriculado puede marcar como aceptada en su pregunta
    // Para "docente" usamos la ausencia de un check específico — se valida en el controller

    await this.prisma.forum_answer.updateMany({
      where: { id_question: answer.id_question, is_accepted: true },
      data: { is_accepted: false },
    });

    const [accepted] = await this.prisma.$transaction([
      this.prisma.forum_answer.update({
        where: { id_answer: answerId },
        data: { is_accepted: true },
        include: { author: { select: { id_user: true, full_name: true, picture: true } } },
      }),
      this.prisma.forum_question.update({
        where: { id_question: answer.id_question },
        data: { status: 'RESOLVED' },
      }),
    ]);

    this.gateway.sendToSubjectRoom(answer.question.id_course, 'forum:answer_accepted', {
      questionId: answer.id_question,
      answerId,
    });

    return this.formatAnswer(accepted);
  }

  // ── Votos ──────────────────────────────────────────────────────────────────

  async castVoteQuestion(questionId: number, userId: number) {
    const question = await this.prisma.forum_question.findUnique({
      where: { id_question: questionId },
      select: { id_course: true },
    });
    if (!question) throw new NotFoundException('Pregunta no encontrada.');

    try {
      await this.prisma.forum_vote.create({
        data: { id_user: userId, entity_type: 'QUESTION', entity_id: questionId },
      });
    } catch (e: any) {
      if (e?.code === 'P2002') throw new ConflictException('Ya registraste tu voto en esta pregunta.');
      throw e;
    }

    const newCount = await this.prisma.forum_vote.count({
      where: { entity_type: 'QUESTION', entity_id: questionId },
    });
    const updated = await this.prisma.forum_question.update({
      where: { id_question: questionId },
      data: { vote_count: newCount },
      include: { author: { select: { id_user: true, full_name: true, picture: true } } },
    });

    this.gateway.sendToSubjectRoom(question.id_course, 'forum:vote_updated', {
      entityType: 'QUESTION',
      entityId: questionId,
      voteCount: newCount,
    });

    return this.formatQuestion(updated);
  }

  async castVoteAnswer(answerId: number, userId: number) {
    const answer = await this.prisma.forum_answer.findUnique({
      where: { id_answer: answerId },
      include: { question: { select: { id_course: true } } },
    });
    if (!answer) throw new NotFoundException('Respuesta no encontrada.');

    try {
      await this.prisma.forum_vote.create({
        data: { id_user: userId, entity_type: 'ANSWER', entity_id: answerId },
      });
    } catch (e: any) {
      if (e?.code === 'P2002') throw new ConflictException('Ya registraste tu voto en esta respuesta.');
      throw e;
    }

    const newCount = await this.prisma.forum_vote.count({
      where: { entity_type: 'ANSWER', entity_id: answerId },
    });
    const updated = await this.prisma.forum_answer.update({
      where: { id_answer: answerId },
      data: { vote_count: newCount },
      include: { author: { select: { id_user: true, full_name: true, picture: true } } },
    });

    this.gateway.sendToSubjectRoom(answer.question.id_course, 'forum:vote_updated', {
      entityType: 'ANSWER',
      entityId: answerId,
      voteCount: newCount,
    });

    return this.formatAnswer(updated);
  }

  // ── Helpers ──────────────────────────────────────────────────────────────────

  private formatQuestion(q: any) {
    return {
      id: q.id_question,
      courseId: q.id_course,
      authorId: q.author?.id_user ?? null,
      authorName: q.author?.full_name ?? 'Usuario',
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
      authorId: a.author?.id_user ?? null,
      authorName: a.author?.full_name ?? 'Usuario',
      body: a.body,
      voteCount: a.vote_count,
      isAccepted: a.is_accepted,
      createdAt: a.created_at.toISOString(),
    };
  }
}
