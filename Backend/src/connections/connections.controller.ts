import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  UseGuards,
  Request,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { ConnectionsService } from './connections.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetClaim } from 'src/auth/decorators/get-token-claim.decorator';
import { CreateConnectionDto } from './dto/create-connection';

@ApiTags('connections')
@ApiBearerAuth()
@Controller('connections')
@UseGuards(JwtAuthGuard)
export class ConnectionsController {
  constructor(private readonly connectionsService: ConnectionsService) {}

  @Get('pending')
  @ApiOperation({ summary: 'Listar solicitudes de conexión pendientes del usuario autenticado' })
  @ApiResponse({ status: 200, description: 'Lista de solicitudes pendientes' })
  @ApiResponse({ status: 401, description: 'Token JWT ausente o inválido' })
  async getPendingRequests(@GetClaim('sub') userId: number) {
    return this.connectionsService.getPendingRequests(userId);
  }

  @Get('status/:userId')
  @ApiOperation({ summary: 'Obtener estado de conexión entre el usuario autenticado y otro usuario' })
  @ApiParam({ name: 'userId', description: 'ID del otro usuario', type: Number })
  @ApiResponse({ status: 200, description: 'Estado de la conexión (pending/accepted/none)' })
  @ApiResponse({ status: 401, description: 'Token JWT ausente o inválido' })
  async getConnectionStatus(
    @GetClaim('sub') currentUserId: number,
    @Param('userId') userId: string,
  ) {
    return this.connectionsService.getConnectionStatus(currentUserId, +userId);
  }

  @Post('request')
  @ApiOperation({ summary: 'Enviar solicitud de conexión a otro usuario' })
  @ApiResponse({ status: 201, description: 'Solicitud enviada correctamente' })
  @ApiResponse({ status: 400, description: 'Solicitud duplicada o usuario inválido' })
  @ApiResponse({ status: 401, description: 'Token JWT ausente o inválido' })
  async sendConnectionRequest(
    @GetClaim('sub') requesterId: number,
    @Body() dto: CreateConnectionDto,
  ) {
    return this.connectionsService.sendConnectionRequest(
      requesterId,
      dto.addressee_id,
    );
  }

  @Patch(':id/accept')
  @ApiOperation({ summary: 'Aceptar solicitud de conexión' })
  @ApiParam({ name: 'id', description: 'ID de la solicitud de conexión', type: Number })
  @ApiResponse({ status: 200, description: 'Solicitud aceptada' })
  @ApiResponse({ status: 400, description: 'ID inválido' })
  @ApiResponse({ status: 401, description: 'Token JWT ausente o inválido' })
  @ApiResponse({ status: 403, description: 'No es el destinatario de la solicitud' })
  async acceptConnectionRequest(
    @Param('id') id: string,
    @GetClaim('sub') userId: number,
  ) {
    try {
      const connectionId = parseInt(id, 10);
      
      if (isNaN(connectionId)) {
        throw new BadRequestException('ID de conexión inválido');
      }

      return await this.connectionsService.acceptConnectionRequest(connectionId, userId);
    } catch (error) {
      console.error('❌ [ConnectionsController.acceptConnectionRequest] Error:', {
        id,
        userId,
        error: error.message,
      });
      throw error;
    }
  }

  @Patch(':id/reject')
  @ApiOperation({ summary: 'Rechazar solicitud de conexión' })
  @ApiParam({ name: 'id', description: 'ID de la solicitud de conexión', type: Number })
  @ApiResponse({ status: 200, description: 'Solicitud rechazada' })
  @ApiResponse({ status: 400, description: 'ID inválido' })
  @ApiResponse({ status: 401, description: 'Token JWT ausente o inválido' })
  async rejectConnectionRequest(
    @Param('id') id: string,
    @GetClaim('sub') userId: number,
  ) {
    try {
      const connectionId = parseInt(id, 10);
      
      if (isNaN(connectionId)) {
        throw new BadRequestException('ID de conexión inválido');
      }

      return await this.connectionsService.rejectConnectionRequest(connectionId, userId);
    } catch (error) {
      console.error('❌ [ConnectionsController.rejectConnectionRequest] Error:', {
        id,
        userId,
        error: error.message,
      });
      throw error;
    }
  }
}