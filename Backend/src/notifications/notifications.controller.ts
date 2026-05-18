import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { GetClaim } from 'src/auth/decorators/get-token-claim.decorator';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { ExpoPushTokenDto } from './dto/expo-push-token.dto';
import { PreferenciaCanalDto } from './dto/preferencia-canal.dto';
import { NotificationsService } from './notifications.service';

@ApiTags('Notifications')
@ApiBearerAuth()
@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  @ApiOperation({ summary: 'Listar todas las notificaciones del usuario autenticado' })
  @ApiResponse({ status: 200, description: 'Lista de notificaciones' })
  @ApiResponse({ status: 401, description: 'Token JWT ausente o inválido' })
  async findAll(@GetClaim('sub') userId: number) {
    return this.notificationsService.findAllForUser(userId);
  }

  @Get('unread-count')
  @ApiOperation({ summary: 'Obtener conteo de notificaciones no leídas' })
  @ApiResponse({ status: 200, description: '{ count: number }' })
  @ApiResponse({ status: 401, description: 'Token JWT ausente o inválido' })
  async getUnreadCount(@GetClaim('sub') userId: number) {
    return this.notificationsService.getUnreadCount(userId);
  }

  @Patch(':id/read')
  @ApiOperation({ summary: 'Marcar una notificación como leída' })
  @ApiParam({ name: 'id', description: 'ID de la notificación', type: Number })
  @ApiResponse({ status: 200, description: 'Notificación marcada como leída' })
  @ApiResponse({ status: 401, description: 'Token JWT ausente o inválido' })
  @ApiResponse({ status: 404, description: 'Notificación no encontrada' })
  async markAsRead(
    @GetClaim('sub') userId: number,
    @Param('id', ParseIntPipe) notificationId: number,
  ) {
    return this.notificationsService.markAsRead(userId, notificationId);
  }

  @Patch('read-all')
  @ApiOperation({ summary: 'Marcar todas las notificaciones del usuario como leídas' })
  @ApiResponse({ status: 200, description: 'Todas las notificaciones marcadas como leídas' })
  @ApiResponse({ status: 401, description: 'Token JWT ausente o inválido' })
  async markAllAsRead(@GetClaim('sub') userId: number) {
    return this.notificationsService.markAllAsRead(userId);
  }

  @Post('expo-push-token')
  @ApiOperation({ summary: 'Registrar token de Expo Push para notificaciones push' })
  @ApiResponse({ status: 201, description: 'Token registrado' })
  @ApiResponse({ status: 401, description: 'Token JWT ausente o inválido' })
  async saveExpoPushToken(
    @GetClaim('sub') userId: number,
    @Body() dto: ExpoPushTokenDto,
  ) {
    return this.notificationsService.saveExpoPushToken(userId, dto);
  }

  @Delete('expo-push-token/:token')
  @ApiOperation({ summary: 'Eliminar token de Expo Push del usuario' })
  @ApiParam({ name: 'token', description: 'Expo push token a eliminar', type: String })
  @ApiResponse({ status: 200, description: 'Token eliminado' })
  @ApiResponse({ status: 401, description: 'Token JWT ausente o inválido' })
  async deleteExpoPushToken(
    @GetClaim('sub') userId: number,
    @Param('token') token: string,
  ) {
    return this.notificationsService.deleteExpoPushToken(userId, token);
  }

  // ─── Preferencias de canal ────────────────────────────────────────────────

  @Get('preferencias')
  @ApiOperation({ summary: 'Obtener preferencias de notificación del usuario' })
  @ApiResponse({ status: 200, description: 'Lista de preferencias por tipo de evento y canal' })
  @ApiResponse({ status: 401, description: 'Token JWT ausente o inválido' })
  async obtenerPreferencias(@GetClaim('sub') userId: number) {
    return this.notificationsService.obtenerPreferencias(userId);
  }

  @Patch('preferencias')
  @ApiOperation({ summary: 'Actualizar preferencia de notificación (tipo_evento + canal + activo)' })
  @ApiResponse({ status: 200, description: 'Preferencia actualizada' })
  @ApiResponse({ status: 400, description: 'Payload inválido' })
  @ApiResponse({ status: 401, description: 'Token JWT ausente o inválido' })
  async actualizarPreferencia(
    @GetClaim('sub') userId: number,
    @Body() dto: PreferenciaCanalDto,
  ) {
    return this.notificationsService.actualizarPreferencia(
      userId,
      dto.tipo_evento,
      dto.canal,
      dto.activo,
    );
  }
}
