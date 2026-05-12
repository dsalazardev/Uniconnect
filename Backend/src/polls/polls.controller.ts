import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  ParseIntPipe,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { PollsService } from './polls.service';
import { PollSchedulerService } from './poll-scheduler.service';
import { CreatePollDto } from './dto/create-poll.dto';
import { CastVoteDto } from './dto/cast-vote.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetClaim } from '../auth/decorators/get-token-claim.decorator';

@ApiTags('polls')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller()
export class PollsController {
  constructor(
    private readonly pollsService: PollsService,
    private readonly pollSchedulerService: PollSchedulerService,
  ) {}

  /**
   * POST /groups/:groupId/polls
   * Crear una encuesta en un grupo. Solo miembros del grupo.
   */
  @Post('groups/:groupId/polls')
  @ApiOperation({ summary: 'Crear una encuesta rápida en el chat de grupo' })
  @ApiResponse({ status: 201, description: 'Encuesta creada con opciones y estado inicial.' })
  @ApiResponse({ status: 400, description: 'closesAt debe ser en el futuro.' })
  async createPoll(
    @Param('groupId', ParseIntPipe) groupId: number,
    @GetClaim('sub') userId: number,
    @Body() dto: CreatePollDto,
  ) {
    const poll = await this.pollsService.createPoll(groupId, userId, dto);
    this.pollSchedulerService.schedulePollClose(poll.id, new Date(poll.closesAt));
    return poll;
  }

  /**
   * POST /polls/:pollId/vote
   * Registrar un voto. Devuelve 409 si el usuario ya votó.
   * Consumido tanto por web como por móvil.
   */
  @Post('polls/:pollId/vote')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Registrar voto en una encuesta activa' })
  @ApiResponse({ status: 200, description: 'Encuesta actualizada con los nuevos porcentajes.' })
  @ApiResponse({
    status: 409,
    description: 'Ya registraste tu voto en esta encuesta',
  })
  castVote(
    @Param('pollId', ParseIntPipe) pollId: number,
    @GetClaim('sub') userId: number,
    @Body() dto: CastVoteDto,
  ) {
    return this.pollsService.castVote(pollId, userId, dto.optionId);
  }

  /**
   * GET /polls/:pollId
   * Obtener encuesta con resultados parciales o finales y porcentajes calculados.
   */
  @Get('polls/:pollId')
  @ApiOperation({ summary: 'Obtener encuesta con resultados y porcentajes' })
  @ApiResponse({ status: 200, description: 'Encuesta con opciones, conteos y porcentajes.' })
  @ApiResponse({ status: 404, description: 'Encuesta no encontrada.' })
  getPoll(
    @Param('pollId', ParseIntPipe) pollId: number,
    @GetClaim('sub') userId: number,
  ) {
    return this.pollsService.getPoll(pollId, userId);
  }
}
