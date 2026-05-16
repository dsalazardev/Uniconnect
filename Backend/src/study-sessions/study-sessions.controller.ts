import {
  Controller,
  Post,
  Get,
  Delete,
  Patch,
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
import { StudySessionsService } from './study-sessions.service';
import { CreateStudySessionDto } from './dto/create-study-session.dto';
import { UpdateAttendanceDto } from './dto/update-attendance.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetClaim } from '../auth/decorators/get-token-claim.decorator';

@ApiTags('study-sessions')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller()
export class StudySessionsController {
  constructor(private readonly studySessionsService: StudySessionsService) {}

  /**
   * POST /groups/:groupId/study-sessions
   * Crea una sesión de estudio y genera la serie de instancias si hay recurrencia semanal.
   */
  @Post('groups/:groupId/study-sessions')
  @ApiOperation({ summary: 'Crear sesión de estudio con recurrencia opcional' })
  @ApiResponse({ status: 201, description: 'Sesión(es) creada(s) con sus instancias.' })
  @ApiResponse({ status: 400, description: 'Validación fallida o fecha en el pasado.' })
  @ApiResponse({ status: 404, description: 'Grupo no encontrado.' })
  createSession(
    @Param('groupId', ParseIntPipe) groupId: number,
    @GetClaim('sub') userId: number,
    @Body() dto: CreateStudySessionDto,
  ) {
    return this.studySessionsService.createSession(groupId, userId, dto);
  }

  /**
   * GET /groups/:groupId/study-sessions
   * Retorna todas las instancias activas del grupo ordenadas cronológicamente.
   */
  @Get('groups/:groupId/study-sessions')
  @ApiOperation({ summary: 'Listar sesiones activas del grupo ordenadas por fecha' })
  @ApiResponse({ status: 200, description: 'Lista de instancias con indicador de recurrencia.' })
  getSessionsByGroup(
    @Param('groupId', ParseIntPipe) groupId: number,
    @GetClaim('sub') userId: number,
  ) {
    return this.studySessionsService.getSessionsByGroup(groupId, userId);
  }

  /**
   * DELETE /groups/:groupId/study-sessions/:instanceId
   * Cancela solo esa instancia sin afectar las demás de la misma serie.
   */
  @Delete('groups/:groupId/study-sessions/:instanceId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cancelar una instancia individual de la serie (CA3)' })
  @ApiResponse({ status: 200, description: 'Instancia cancelada.' })
  @ApiResponse({ status: 403, description: 'No eres el owner ni el creador de la sesión.' })
  @ApiResponse({ status: 404, description: 'Instancia no encontrada.' })
  cancelInstance(
    @Param('groupId', ParseIntPipe) groupId: number,
    @Param('instanceId', ParseIntPipe) instanceId: number,
    @GetClaim('sub') userId: number,
  ) {
    return this.studySessionsService.cancelInstance(groupId, instanceId, userId);
  }

  /**
   * PATCH /groups/:groupId/study-sessions/:instanceId/attendance
   * Confirma, declina o marca como pendiente la asistencia del usuario.
   * Notifica al organizador de la sesión via Observer (CA7).
   */
  @Patch('groups/:groupId/study-sessions/:instanceId/attendance')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Actualizar asistencia a una sesión (CA7)' })
  @ApiResponse({ status: 200, description: 'Asistencia actualizada. Organizador notificado via Observer.' })
  @ApiResponse({ status: 400, description: 'Sesión cancelada o datos inválidos.' })
  @ApiResponse({ status: 404, description: 'Instancia no encontrada.' })
  updateAttendance(
    @Param('groupId', ParseIntPipe) groupId: number,
    @Param('instanceId', ParseIntPipe) instanceId: number,
    @GetClaim('sub') userId: number,
    @Body() dto: UpdateAttendanceDto,
  ) {
    return this.studySessionsService.updateAttendance(groupId, instanceId, userId, dto);
  }
}
