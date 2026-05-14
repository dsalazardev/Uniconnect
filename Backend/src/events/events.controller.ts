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
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
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

  // ── GET /categories ──────────────────────────────────────────────────────
  @Get('categories')
  @ApiOperation({ summary: 'Obtener todas las categorías de eventos' })
  getCategories() {
    return this.eventsService.getCategories();
  }

  // ── GET /events/categories/subscriptions ─────────────────────────────────
  // Debe ir ANTES de /events/:id para que Express no lo trate como id="categories"
  @Get('events/categories/subscriptions')
  @ApiOperation({ summary: 'Obtener IDs de categorías suscritas por el usuario autenticado' })
  getSubscriptions(@GetClaim('sub') userId: number) {
    return this.eventsService.getSubscriptions(userId);
  }

  // ── POST /events/categories/:categoryId/subscribe ────────────────────────
  @Post('events/categories/:categoryId/subscribe')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Suscribirse a una categoría de eventos' })
  subscribeCategory(
    @Param('categoryId', ParseIntPipe) categoryId: number,
    @GetClaim('sub') userId: number,
  ) {
    return this.eventsService.subscribeCategory(categoryId, userId);
  }

  // ── DELETE /events/categories/:categoryId/subscribe ──────────────────────
  @Delete('events/categories/:categoryId/subscribe')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cancelar suscripción a una categoría de eventos' })
  unsubscribeCategory(
    @Param('categoryId', ParseIntPipe) categoryId: number,
    @GetClaim('sub') userId: number,
  ) {
    return this.eventsService.unsubscribeCategory(categoryId, userId);
  }

  // ── GET /events?categoryId= ──────────────────────────────────────────────
  @Get('events')
  @ApiOperation({ summary: 'Obtener eventos, filtrado opcional por categoryId' })
  @ApiQuery({ name: 'categoryId', required: false, type: Number })
  getEvents(@Query('categoryId') categoryId?: string) {
    const id = categoryId ? parseInt(categoryId, 10) : undefined;
    return this.eventsService.getEvents(id);
  }

  // ── GET /events/:id ──────────────────────────────────────────────────────
  @Get('events/:id')
  @ApiOperation({ summary: 'Obtener un evento por ID' })
  getEventById(@Param('id', ParseIntPipe) id: number) {
    return this.eventsService.getEventById(id);
  }

  // ── POST /events ─────────────────────────────────────────────────────────
  @Post('events')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Crear un nuevo evento (requiere autenticación)' })
  createEvent(
    @Body() dto: CreateEventDto,
    @GetClaim('sub') userId: number,
  ) {
    return this.eventsService.createEvent(dto, userId);
  }
}
