import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  ParseIntPipe,
  UseGuards,
  HttpCode,
  HttpStatus,
  ForbiddenException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { ForumService } from './forum.service';
import { CreateQuestionDto } from './dto/create-question.dto';
import { CreateAnswerDto } from './dto/create-answer.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetClaim } from '../auth/decorators/get-token-claim.decorator';
import { PrismaService } from '../prisma/prisma.service';

@ApiTags('forum')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller()
export class ForumController {
  constructor(
    private readonly forumService: ForumService,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * GET /groups/:groupId/forum/questions
   * Listar preguntas del foro de un grupo, ordenadas por votos desc.
   */
  @Get('groups/:groupId/forum/questions')
  @ApiOperation({ summary: 'Listar preguntas del foro por grupo' })
  @ApiResponse({ status: 200, description: 'Lista de preguntas ordenadas por votos.' })
  getQuestions(@Param('groupId', ParseIntPipe) groupId: number) {
    return this.forumService.getQuestions(groupId);
  }

  /**
   * POST /groups/:groupId/forum/questions
   * Publicar una pregunta. Requiere membresía activa en el grupo.
   */
  @Post('groups/:groupId/forum/questions')
  @ApiOperation({ summary: 'Publicar una pregunta en el foro del grupo' })
  @ApiResponse({ status: 201, description: 'Pregunta creada.' })
  @ApiResponse({ status: 403, description: 'Se requiere matrícula en la asignatura.' })
  async createQuestion(
    @Param('groupId', ParseIntPipe) groupId: number,
    @GetClaim('sub') userId: number,
    @Body() dto: CreateQuestionDto,
  ) {
    const membership = await this.prisma.membership.findFirst({
      where: { id_user: userId, id_group: groupId },
      select: { id_membership: true },
    });
    // La CoR en ForumService valida la matrícula — se pasa null si no existe
    return this.forumService.createQuestion(
      groupId,
      userId,
      membership?.id_membership ?? null,
      dto,
    );
  }

  /**
   * GET /forum/questions/:questionId/answers
   * Listar respuestas de una pregunta: aceptada primero, luego por votos.
   */
  @Get('forum/questions/:questionId/answers')
  @ApiOperation({ summary: 'Listar respuestas de una pregunta' })
  @ApiResponse({ status: 200, description: 'Respuestas ordenadas: aceptada > votos > fecha.' })
  @ApiResponse({ status: 404, description: 'Pregunta no encontrada.' })
  getAnswers(@Param('questionId', ParseIntPipe) questionId: number) {
    return this.forumService.getAnswers(questionId);
  }

  /**
   * POST /forum/questions/:questionId/answers
   * Responder una pregunta. Requiere membresía en el grupo de la pregunta.
   */
  @Post('forum/questions/:questionId/answers')
  @ApiOperation({ summary: 'Publicar una respuesta' })
  @ApiResponse({ status: 201, description: 'Respuesta creada.' })
  @ApiResponse({ status: 403, description: 'Se requiere matrícula en la asignatura.' })
  async createAnswer(
    @Param('questionId', ParseIntPipe) questionId: number,
    @GetClaim('sub') userId: number,
    @Body() dto: CreateAnswerDto,
  ) {
    const question = await this.prisma.forum_question.findUnique({
      where: { id_question: questionId },
      select: { id_group: true },
    });
    const membership = question
      ? await this.prisma.membership.findFirst({
          where: { id_user: userId, id_group: question.id_group },
          select: { id_membership: true },
        })
      : null;

    if (!membership) {
      throw new ForbiddenException('Se requiere matrícula en la asignatura.');
    }
    return this.forumService.createAnswer(questionId, membership.id_membership, dto);
  }

  /**
   * POST /forum/questions/:questionId/vote
   * Votar una pregunta. 409 si el usuario ya votó (@@unique en forum_vote).
   */
  @Post('forum/questions/:questionId/vote')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Votar una pregunta del foro' })
  @ApiResponse({ status: 200, description: 'Pregunta actualizada con nuevo conteo de votos.' })
  @ApiResponse({ status: 409, description: 'Ya registraste tu voto en esta pregunta.' })
  voteQuestion(
    @Param('questionId', ParseIntPipe) questionId: number,
    @GetClaim('sub') userId: number,
  ) {
    return this.forumService.castVoteQuestion(questionId, userId);
  }

  /**
   * POST /forum/answers/:answerId/vote
   * Votar una respuesta. 409 si el usuario ya votó.
   */
  @Post('forum/answers/:answerId/vote')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Votar una respuesta del foro' })
  @ApiResponse({ status: 200, description: 'Respuesta actualizada con nuevo conteo de votos.' })
  @ApiResponse({ status: 409, description: 'Ya registraste tu voto en esta respuesta.' })
  voteAnswer(
    @Param('answerId', ParseIntPipe) answerId: number,
    @GetClaim('sub') userId: number,
  ) {
    return this.forumService.castVoteAnswer(answerId, userId);
  }

  /**
   * PATCH /forum/answers/:answerId/accept
   * Marcar respuesta como aceptada. Solo el docente (is_admin) del grupo.
   */
  @Patch('forum/answers/:answerId/accept')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Aceptar una respuesta (solo docente)' })
  @ApiResponse({ status: 200, description: 'Respuesta aceptada y pregunta marcada como RESOLVED.' })
  @ApiResponse({ status: 403, description: 'Solo el docente puede aceptar respuestas.' })
  async acceptAnswer(
    @Param('answerId', ParseIntPipe) answerId: number,
    @GetClaim('sub') userId: number,
  ) {
    const answer = await this.prisma.forum_answer.findUnique({
      where: { id_answer: answerId },
      include: { question: { select: { id_group: true } } },
    });
    const isAdmin = answer
      ? await this.prisma.membership.findFirst({
          where: { id_user: userId, id_group: answer.question.id_group, is_admin: true },
        })
      : null;

    if (!isAdmin) {
      throw new ForbiddenException('Solo el docente puede aceptar respuestas.');
    }
    return this.forumService.acceptAnswer(answerId, userId);
  }
}
