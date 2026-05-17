import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateEventDto } from './dto/create-event.dto';
import { EventoUniversidadSubject } from './domain/observer/evento-universidad.subject';
import { MessagesGateway } from '../messages/messages.gateway';

@Injectable()
export class EventsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventoUniversidadSubject: EventoUniversidadSubject,
    private readonly messagesGateway: MessagesGateway,
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

    // CA1/CA3/CA4: notificar vía Observer pattern.
    // El EventPublishedObserver consulta suscriptores por categoría y filtra antes
    // de emitir el WebSocket — sólo los estudiantes suscritos a esta categoría reciben la notificación.
    this.eventoUniversidadSubject.notify({
      tipo: 'NUEVO_EVENTO',
      categoria: event.category.name,
      idCategoria: event.id_category,
      evento: {
        id_event: event.id_event,
        title: event.title,
        start_date: event.start_date,
      },
      timestamp: new Date(),
    });

    // Broadcast en tiempo real a todos los usuarios conectados para que actualicen
    // su listado de eventos sin necesidad de recargar la pantalla.
    this.messagesGateway.broadcastToAll('event:published', {
      event,
      categoryId: event.id_category,
    });

    return event;
  }

  // ── POST /events/categories/:categoryId/subscribe (alias: /eventos/suscribir) ──
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

  // ── DELETE /events/categories/:categoryId/subscribe (alias: /eventos/suscribir) ──
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
