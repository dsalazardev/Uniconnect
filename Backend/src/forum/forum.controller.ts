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
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
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

  /** GET /courses/:courseId/forum/questions — visible para todos los autenticados */
  @Get('courses/:courseId/forum/questions')
  @ApiOperation({ summary: 'Listar preguntas del foro de una asignatura' })
  @ApiResponse({ status: 200, description: 'Preguntas ordenadas por votos desc.' })
  getQuestions(@Param('courseId', ParseIntPipe) courseId: number) {
    return this.forumService.getQuestions(courseId);
  }

  /** POST /courses/:courseId/forum/questions — requiere matrícula (inscrita o finalizada) */
  @Post('courses/:courseId/forum/questions')
  @ApiOperation({ summary: 'Publicar una pregunta (requiere matrícula en la asignatura)' })
  @ApiResponse({ status: 201, description: 'Pregunta creada.' })
  @ApiResponse({ status: 403, description: 'Se requiere matrícula en la asignatura.' })
  createQuestion(
    @Param('courseId', ParseIntPipe) courseId: number,
    @GetClaim('sub') userId: number,
    @Body() dto: CreateQuestionDto,
  ) {
    return this.forumService.createQuestion(courseId, userId, dto);
  }

  /** GET /forum/questions/:questionId/answers */
  @Get('forum/questions/:questionId/answers')
  @ApiOperation({ summary: 'Listar respuestas de una pregunta' })
  getAnswers(@Param('questionId', ParseIntPipe) questionId: number) {
    return this.forumService.getAnswers(questionId);
  }

  /** POST /forum/questions/:questionId/answers — requiere matrícula */
  @Post('forum/questions/:questionId/answers')
  @ApiOperation({ summary: 'Responder una pregunta (requiere matrícula)' })
  @ApiResponse({ status: 201, description: 'Respuesta creada.' })
  @ApiResponse({ status: 403, description: 'Se requiere matrícula en la asignatura.' })
  createAnswer(
    @Param('questionId', ParseIntPipe) questionId: number,
    @GetClaim('sub') userId: number,
    @Body() dto: CreateAnswerDto,
  ) {
    return this.forumService.createAnswer(questionId, userId, dto);
  }

  /** POST /forum/questions/:questionId/vote */
  @Post('forum/questions/:questionId/vote')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Votar una pregunta' })
  voteQuestion(
    @Param('questionId', ParseIntPipe) questionId: number,
    @GetClaim('sub') userId: number,
  ) {
    return this.forumService.castVoteQuestion(questionId, userId);
  }

  /** POST /forum/answers/:answerId/vote */
  @Post('forum/answers/:answerId/vote')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Votar una respuesta' })
  voteAnswer(
    @Param('answerId', ParseIntPipe) answerId: number,
    @GetClaim('sub') userId: number,
  ) {
    return this.forumService.castVoteAnswer(answerId, userId);
  }

  /** PATCH /forum/answers/:answerId/accept — solo docente (is_admin en grupo del curso) */
  @Patch('forum/answers/:answerId/accept')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Marcar respuesta como aceptada (solo docente)' })
  @ApiResponse({ status: 403, description: 'Solo el docente puede aceptar respuestas.' })
  async acceptAnswer(
    @Param('answerId', ParseIntPipe) answerId: number,
    @GetClaim('sub') userId: number,
  ) {
    const answer = await this.prisma.forum_answer.findUnique({
      where: { id_answer: answerId },
      include: { question: { select: { id_course: true } } },
    });

    // Verificar que el usuario es admin en algún grupo del curso (= docente)
    const isTeacher = answer
      ? await this.prisma.membership.findFirst({
          where: {
            id_user: userId,
            is_admin: true,
            group: { id_course: answer.question.id_course },
          },
        })
      : null;

    if (!isTeacher) throw new ForbiddenException('Solo el docente puede aceptar respuestas.');
    return this.forumService.acceptAnswer(answerId, userId);
  }
}
