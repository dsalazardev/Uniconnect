import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateEventDto } from './dto/create-event.dto';

@Injectable()
export class EventsService {
  constructor(private readonly prisma: PrismaService) {}

  // ── GET /categories ──────────────────────────────────────────────────────
  async getCategories() {
    return this.prisma.event_category.findMany({
      orderBy: { name: 'asc' },
    });
  }

  // ── GET /events?categoryId= ──────────────────────────────────────────────
  async getEvents(categoryId?: number) {
    return this.prisma.event.findMany({
      where: categoryId ? { id_category: categoryId } : undefined,
      include: {
        category: true,
        creator: {
          select: { id_user: true, full_name: true, picture: true },
        },
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
        creator: {
          select: { id_user: true, full_name: true, picture: true },
        },
      },
    });

    if (!event) {
      throw new NotFoundException(`Evento con id ${id} no encontrado`);
    }

    return event;
  }

  // ── POST /events ─────────────────────────────────────────────────────────
  async createEvent(dto: CreateEventDto, createdBy: number) {
    await this.prisma.event_category.findUniqueOrThrow({
      where: { id_category: dto.id_category },
    }).catch(() => {
      throw new NotFoundException(`Categoría con id ${dto.id_category} no encontrada`);
    });

    return this.prisma.event.create({
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
        creator: {
          select: { id_user: true, full_name: true, picture: true },
        },
      },
    });
  }
}
