import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Query,
  Body,
  ParseIntPipe,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery, ApiBody, ApiResponse, ApiParam } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetClaim } from '../auth/decorators/get-token-claim.decorator';
import { EventsService } from './events.service';
import { CreateEventDto } from './dto/create-event.dto';

@ApiTags('events')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller()
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Get('categories')
  @ApiOperation({ summary: 'Obtener todas las categorías de eventos' })
  @ApiResponse({ status: 200, description: 'Lista de categorías de eventos' })
  @ApiResponse({ status: 401, description: 'Token JWT ausente o inválido' })
  getCategories() {
    return this.eventsService.getCategories();
  }

  // Debe ir ANTES de /events/:id para que Express no lo trate como id="categories"
  @Get('events/categories/subscriptions')
  @ApiOperation({ summary: 'Obtener IDs de categorías suscritas por el usuario autenticado' })
  @ApiResponse({ status: 200, description: 'Lista de IDs de categorías suscritas' })
  @ApiResponse({ status: 401, description: 'Token JWT ausente o inválido' })
  getSubscriptions(@GetClaim('sub') userId: number) {
    return this.eventsService.getSubscriptions(userId);
  }

  @Post('eventos/suscribir')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Suscribirse a una categoría de eventos' })
  @ApiBody({ schema: { properties: { id_category: { type: 'integer' } }, required: ['id_category'] } })
  @ApiResponse({ status: 201, description: 'Suscripción creada' })
  @ApiResponse({ status: 401, description: 'Token JWT ausente o inválido' })
  subscribeByBody(
    @Body('id_category', ParseIntPipe) categoryId: number,
    @GetClaim('sub') userId: number,
  ) {
    return this.eventsService.subscribeCategory(categoryId, userId);
  }

  @Delete('eventos/suscribir')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cancelar suscripción a una categoría de eventos' })
  @ApiBody({ schema: { properties: { id_category: { type: 'integer' } }, required: ['id_category'] } })
  @ApiResponse({ status: 200, description: 'Suscripción cancelada' })
  @ApiResponse({ status: 401, description: 'Token JWT ausente o inválido' })
  unsubscribeByBody(
    @Body('id_category', ParseIntPipe) categoryId: number,
    @GetClaim('sub') userId: number,
  ) {
    return this.eventsService.unsubscribeCategory(categoryId, userId);
  }

  @Post('events/categories/:categoryId/subscribe')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Suscribirse a una categoría de eventos (vía path param)' })
  @ApiParam({ name: 'categoryId', description: 'ID de la categoría', type: Number })
  @ApiResponse({ status: 201, description: 'Suscripción creada' })
  @ApiResponse({ status: 401, description: 'Token JWT ausente o inválido' })
  subscribeCategory(
    @Param('categoryId', ParseIntPipe) categoryId: number,
    @GetClaim('sub') userId: number,
  ) {
    return this.eventsService.subscribeCategory(categoryId, userId);
  }

  @Delete('events/categories/:categoryId/subscribe')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cancelar suscripción a una categoría de eventos (vía path param)' })
  @ApiParam({ name: 'categoryId', description: 'ID de la categoría', type: Number })
  @ApiResponse({ status: 200, description: 'Suscripción cancelada' })
  @ApiResponse({ status: 401, description: 'Token JWT ausente o inválido' })
  unsubscribeCategory(
    @Param('categoryId', ParseIntPipe) categoryId: number,
    @GetClaim('sub') userId: number,
  ) {
    return this.eventsService.unsubscribeCategory(categoryId, userId);
  }

  @Get('events')
  @ApiOperation({ summary: 'Listar eventos, filtrado opcional por categoría' })
  @ApiQuery({ name: 'categoryId', required: false, type: Number, description: 'Filtrar por ID de categoría' })
  @ApiResponse({ status: 200, description: 'Lista de eventos' })
  @ApiResponse({ status: 401, description: 'Token JWT ausente o inválido' })
  getEvents(@Query('categoryId') categoryId?: string) {
    const id = categoryId ? parseInt(categoryId, 10) : undefined;
    return this.eventsService.getEvents(id);
  }

  @Get('events/:id')
  @ApiOperation({ summary: 'Obtener un evento por ID' })
  @ApiParam({ name: 'id', description: 'ID del evento', type: Number })
  @ApiResponse({ status: 200, description: 'Evento encontrado' })
  @ApiResponse({ status: 401, description: 'Token JWT ausente o inválido' })
  @ApiResponse({ status: 404, description: 'Evento no encontrado' })
  getEventById(@Param('id', ParseIntPipe) id: number) {
    return this.eventsService.getEventById(id);
  }

  @Post('events')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Crear un nuevo evento académico (admin/superadmin)' })
  @ApiResponse({ status: 201, description: 'Evento creado', type: CreateEventDto })
  @ApiResponse({ status: 400, description: 'Payload inválido' })
  @ApiResponse({ status: 401, description: 'Token JWT ausente o inválido' })
  @ApiResponse({ status: 403, description: 'Rol insuficiente — requiere admin o superadmin' })
  createEvent(
    @Body() dto: CreateEventDto,
    @GetClaim('sub') userId: number,
  ) {
    return this.eventsService.createEvent(dto, userId);
  }
}
