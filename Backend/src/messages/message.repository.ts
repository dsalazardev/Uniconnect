import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMessageDto } from './dto/create-message.dto';
import { UpdateMessageDto } from './dto/update-message.dto';

/**
 * Patrón Repository — encapsula TODAS las operaciones de persistencia de mensajes.
 * MessagesService y MessagesGateway usan esta clase; nunca acceden a Prisma
 * directamente para la entidad message.
 */
@Injectable()
export class MessageRepository {
  constructor(private readonly prisma: PrismaService) {}

  // ── Inclusiones reutilizables ─────────────────────────────────────────────

  private readonly membershipInclude = {
    membership: {
      include: {
        user: {
          select: {
            id_user: true,
            full_name: true,
            picture: true,
          },
        },
        group: {
          select: {
            id_group: true,
            name: true,
          },
        },
      },
    },
    files: {
      select: {
        id_file: true,
        url: true,
        file_name: true,
        mime_type: true,
        size: true,
        created_at: true,
      },
    },
    poll: {
      include: {
        options: {
          include: {
            votes: { select: { id_user: true } },
          },
        },
        votes: {
          select: { id_user: true, id_option: true },
        },
      },
    },
  } as const;

  // ── Escritura ─────────────────────────────────────────────────────────────

  async create(dto: CreateMessageDto) {
    return this.prisma.message.create({
      data: {
        id_membership: dto.id_membership,
        text_content: dto.text_content,
        attachments: dto.attachments || null,
        send_at: dto.send_at ?? new Date(),
      },
      include: this.membershipInclude,
    });
  }

  /**
   * Crear mensaje con archivos asociados
   */
  async createWithFiles(
    dto: CreateMessageDto,
    files?: Array<{ url: string; file_name: string; mime_type: string; size: number; id_group: number }>,
  ) {
    const message = await this.prisma.message.create({
      data: {
        id_membership: dto.id_membership,
        text_content: dto.text_content,
        attachments: dto.attachments || null,
        send_at: dto.send_at ?? new Date(),
      },
      include: this.membershipInclude,
    });

    // Si hay archivos, crearlos después
    if (files && files.length > 0) {
      await Promise.all(
        files.map((file) =>
          this.prisma.file.create({
            data: {
              url: file.url,
              file_name: file.file_name,
              mime_type: file.mime_type,
              size: file.size,
              id_group: file.id_group,
              id_message: message.id_message,
            },
          }),
        ),
      );

      // Re-obtener mensaje con archivos actualizados
      return this.prisma.message.findUnique({
        where: { id_message: message.id_message },
        include: this.membershipInclude,
      });
    }

    return message;
  }

  /**
   * Solo actualiza si el mensaje le pertenece al usuario (por id_membership).
   * Retorna null si no tiene permisos.
   */
  async updateIfOwner(
    id_message: number,
    userId: number,
    dto: { text_content?: string; edited_at?: Date; is_edited?: boolean },
  ) {
    const msg = await this.prisma.message.findUnique({
      where: { id_message },
      include: { membership: { select: { id_user: true } } },
    });

    if (!msg || msg.membership?.id_user !== userId) return null;

    return this.prisma.message.update({
      where: { id_message },
      data: dto,
      include: this.membershipInclude,
    });
  }

  /**
   * El autor del mensaje puede borrarlo; el admin del grupo también puede.
   * Retorna false si no tiene permisos.
   */
  async removeIfOwnerOrAdmin(
    id_message: number,
    userId: number,
  ): Promise<boolean> {
    const msg = await this.prisma.message.findUnique({
      where: { id_message },
      include: {
        membership: {
          select: {
            id_user: true,
            id_group: true,
          },
        },
      },
    });

    if (!msg) return false;

    const isAuthor = msg.membership?.id_user === userId;

    if (!isAuthor) {
      // Verificar si el usuario es admin en ese grupo
      const adminMembership = await this.prisma.membership.findFirst({
        where: {
          id_user: userId,
          id_group: msg.membership?.id_group ?? undefined,
          is_admin: true,
        },
      });
      if (!adminMembership) return false;
    }

    await this.prisma.message.delete({ where: { id_message } });
    return true;
  }

  // ── Lectura ───────────────────────────────────────────────────────────────

  async findById(id_message: number) {
    return this.prisma.message.findUnique({
      where: { id_message },
      include: this.membershipInclude,
    });
  }

  async findAll() {
    return this.prisma.message.findMany({
      include: this.membershipInclude,
      orderBy: { send_at: 'asc' },
    });
  }

  async findByGroup(id_group: number) {
    return this.prisma.message.findMany({
      where: { membership: { id_group } },
      include: this.membershipInclude,
      orderBy: { send_at: 'asc' },
    });
  }

  async findRecentByGroup(id_group: number, limit = 50, beforeId?: number, userId?: number) {
    const baseWhere = {
      membership: { id_group },
      ...(beforeId ? { id_message: { lt: beforeId } } : {}),
    };

    const rawMessages = await this.prisma.message.findMany({
      where: baseWhere,
      include: this.membershipInclude,
      orderBy: { send_at: 'desc' },
      take: limit,
    });

    const ordered = rawMessages.reverse();

    const messages = ordered.map((msg: any) => {
      if (!msg.poll) return msg;
      return { ...msg, poll: this.formatPoll(msg.poll, userId) };
    });

    const oldestId = ordered.length > 0 ? ordered[0].id_message : null;
    const hasMore = oldestId
      ? (await this.prisma.message.count({
          where: { membership: { id_group }, id_message: { lt: oldestId } },
        })) > 0
      : false;

    return { messages, hasMore };
  }

  private formatPoll(poll: any, userId?: number) {
    const totalVotes = poll.options.reduce(
      (sum: number, o: any) => sum + (o.votes?.length ?? 0),
      0,
    );
    const userVote =
      userId != null
        ? (poll.votes?.find((v: any) => v.id_user === userId)?.id_option ?? null)
        : null;

    return {
      id: poll.id_poll,
      groupId: poll.id_group,
      createdBy: poll.created_by,
      question: poll.question,
      options: poll.options.map((o: any) => {
        const count: number = o.votes?.length ?? 0;
        return {
          id: o.id_option,
          text: o.text,
          count,
          percentage: totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0,
        };
      }),
      closesAt: poll.closes_at.toISOString(),
      status: poll.status as 'ACTIVE' | 'CLOSED',
      createdAt: poll.created_at.toISOString(),
      userVote,
    };
  }

  async findByMembership(id_membership: number) {
    return this.prisma.message.findMany({
      where: { id_membership },
      include: this.membershipInclude,
      orderBy: { send_at: 'asc' },
    });
  }

  /**
   * Obtener archivos de un mensaje
   */
  async getMessageFiles(id_message: number) {
    return this.prisma.file.findMany({
      where: { id_message },
      select: {
        id_file: true,
        url: true,
        file_name: true,
        mime_type: true,
        size: true,
        created_at: true,
      },
    });
  }

  async countByGroup(id_group: number) {
    return this.prisma.message.count({
      where: { membership: { id_group } },
    });
  }

  /**
   * Marcar mensaje como editado (Fase 1 enhancement)
   */
  async markAsEdited(id_message: number, newContent: string, userId: number) {
    const msg = await this.prisma.message.findUnique({
      where: { id_message },
      include: { membership: { select: { id_user: true } } },
    });

    if (!msg || msg.membership?.id_user !== userId) return null;

    return this.prisma.message.update({
      where: { id_message },
      data: {
        text_content: newContent,
        is_edited: true,
        edited_at: new Date(),
      },
      include: this.membershipInclude,
    });
  }

  /**
   * Buscar mensajes por texto en un grupo
   */
  async searchInGroup(id_group: number, searchTerm: string) {
    return this.prisma.message.findMany({
      where: {
        membership: { id_group },
        text_content: {
          contains: searchTerm,
          mode: 'insensitive',
        },
      },
      include: this.membershipInclude,
      orderBy: { send_at: 'desc' },
      take: 20,
    });
  }

  /**
   * Obtener último mensaje de un grupo
   */
  async getLastMessageByGroup(id_group: number) {
    return this.prisma.message.findFirst({
      where: { membership: { id_group } },
      orderBy: { send_at: 'desc' },
      include: this.membershipInclude,
    });
  }
}
