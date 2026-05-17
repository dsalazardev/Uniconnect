import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '../prisma/prisma.service';
import { CreateEventDto } from './dto/create-event.dto';
import { MESSAGE_EVENTS } from '../messages/events/message.events';

@Injectable()
export class EventsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  // ── GET /categories ──────────────────────────────────────────────────────
  async getCategories() {
    return this.prisma.event_category.findMany({ orderBy: { name: 'asc' } });
  }

  // ── GET /events?categoryId= ──────────────────────────────────────────────
  async getEvents(categoryId?: number) {
    return this.prisma.event.findMany({
      where: categoryId ? { id_category: categoryId } : undefined,
      include: {
        category: true,
        creator: { select: { id_user: true, full_name: true, picture: true } },
      },
      orderBy: { start_date: 'asc' },
    });
  }

  // ── GET /events/:id ──────────────────────────────────────────────────────
  async getEventById(id: number) {
    const event = await this.prisma.event.findUnique({
      where: { id_event: id },
      include: {
        category: true,
        creator: { select: { id_user: true, full_name: true, picture: true } },
      },
    });
    if (!event) throw new NotFoundException(`Evento con id ${id} no encontrado`);
    return event;
  }

  // ── POST /events ─────────────────────────────────────────────────────────
  async createEvent(dto: CreateEventDto, createdBy: number) {
    await this.prisma.event_category
      .findUniqueOrThrow({ where: { id_category: dto.id_category } })
      .catch(() => { throw new NotFoundException(`Categoría con id ${dto.id_category} no encontrada`); });

    const event = await this.prisma.event.create({
      data: {
        id_category: dto.id_category,
        title:       dto.title,
        description: dto.description,
        location:    dto.location,
        start_date:  new Date(dto.start_date),
        end_date:    new Date(dto.end_date),
        created_by:  createdBy,
      },
      include: {
        category: true,
        creator: { select: { id_user: true, full_name: true, picture: true } },
      },
    });

    // Obtener suscriptores de esta categoría
    const subscriptions = await this.prisma.event_category_subscription.findMany({
      where: { id_category: dto.id_category },
      select: { id_user: true },
    });

    // Emitir evento del sistema → NotificationEventListener lo procesa
    // Esto guarda en tabla notification + emite notification:new por WS
    this.eventEmitter.emit(MESSAGE_EVENTS.EVENT_PUBLISHED, {
      event,
      subscriberIds: subscriptions.map((s) => s.id_user),
      categoryName: event.category.name,
    });

    return event;
  }

  // ── POST /events/categories/:categoryId/subscribe ────────────────────────
  async subscribeCategory(categoryId: number, userId: number) {
    await this.prisma.event_category
      .findUniqueOrThrow({ where: { id_category: categoryId } })
      .catch(() => { throw new NotFoundException(`Categoría con id ${categoryId} no encontrada`); });

    try {
      return await this.prisma.event_category_subscription.create({
        data: { id_user: userId, id_category: categoryId },
        select: { id_subscription: true, id_category: true, created_at: true },
      });
    } catch (err: any) {
      if (err?.code === 'P2002') throw new ConflictException('Ya estás suscrito a esta categoría');
      throw err;
    }
  }

  // ── DELETE /events/categories/:categoryId/subscribe ──────────────────────
  async unsubscribeCategory(categoryId: number, userId: number) {
    const sub = await this.prisma.event_category_subscription.findUnique({
      where: { id_user_id_category: { id_user: userId, id_category: categoryId } },
    });
    if (!sub) throw new NotFoundException('No estás suscrito a esta categoría');
    await this.prisma.event_category_subscription.delete({ where: { id_subscription: sub.id_subscription } });
    return { message: 'Suscripción eliminada' };
  }

  // ── GET /events/categories/subscriptions ─────────────────────────────────
  async getSubscriptions(userId: number): Promise<number[]> {
    const subs = await this.prisma.event_category_subscription.findMany({
      where: { id_user: userId },
      select: { id_category: true },
    });
    return subs.map((s) => s.id_category);
  }
}
