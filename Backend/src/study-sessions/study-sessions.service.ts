import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { StudyGroupSubject } from '../groups/domain/observer/study-group-subject';
import { CreateStudySessionDto } from './dto/create-study-session.dto';
import { UpdateAttendanceDto } from './dto/update-attendance.dto';

export interface StudySessionInstanceResponse {
  id_instance: number;
  id_session: number;
  title: string;
  description: string | null;
  scheduled_date: string;
  duration_minutes: number;
  is_recurring: boolean;
  created_by: number;
}

@Injectable()
export class StudySessionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly studyGroupSubject: StudyGroupSubject,
  ) {}

  async createSession(
    groupId: number,
    userId: number,
    dto: CreateStudySessionDto,
  ): Promise<StudySessionInstanceResponse[]> {
    const startDate = new Date(dto.startDatetime);
    if (startDate <= new Date()) {
      throw new BadRequestException(
        'La fecha de inicio debe ser en el futuro.',
      );
    }

    if (dto.recurrenceType === 'WEEKLY') {
      if (!dto.recurrenceEndDate) {
        throw new BadRequestException(
          'recurrenceEndDate es requerido para recurrencia semanal.',
        );
      }
      const endDate = new Date(dto.recurrenceEndDate);
      if (endDate <= startDate) {
        throw new BadRequestException(
          'La fecha de fin de recurrencia debe ser posterior a la fecha de inicio.',
        );
      }
    }

    // Verify group exists
    const group = await this.prisma.group.findUnique({
      where: { id_group: groupId },
      select: { id_group: true },
    });
    if (!group) {
      throw new NotFoundException('Grupo no encontrado.');
    }

    const session = await this.prisma.study_session.create({
      data: {
        id_group: groupId,
        created_by: userId,
        title: dto.title,
        description: dto.description ?? null,
        start_datetime: startDate,
        duration_minutes: dto.durationMinutes,
        recurrence_type: dto.recurrenceType,
        recurrence_end_date: dto.recurrenceEndDate
          ? new Date(dto.recurrenceEndDate)
          : null,
      },
    });

    // Generate instances
    const instanceDates: Date[] = [];
    const current = new Date(startDate);

    if (dto.recurrenceType === 'WEEKLY' && dto.recurrenceEndDate) {
      const endDate = new Date(dto.recurrenceEndDate);
      while (current <= endDate) {
        instanceDates.push(new Date(current));
        current.setDate(current.getDate() + 7);
      }
    } else {
      instanceDates.push(new Date(current));
    }

    await this.prisma.study_session_instance.createMany({
      data: instanceDates.map((d) => ({
        id_session: session.id_session,
        scheduled_date: d,
      })),
    });

    // Return created instances
    const instances = await this.prisma.study_session_instance.findMany({
      where: { id_session: session.id_session },
      orderBy: { scheduled_date: 'asc' },
    });

    return instances.map((inst) => ({
      id_instance: inst.id_instance,
      id_session: inst.id_session,
      title: session.title,
      description: session.description,
      scheduled_date: inst.scheduled_date.toISOString(),
      duration_minutes: session.duration_minutes,
      is_recurring: session.recurrence_type !== 'NONE',
      created_by: session.created_by,
    }));
  }

  async getSessionsByGroup(
    groupId: number,
  ): Promise<StudySessionInstanceResponse[]> {
    const instances = await this.prisma.study_session_instance.findMany({
      where: {
        status: 'ACTIVE',
        session: { id_group: groupId },
      },
      include: { session: true },
      orderBy: { scheduled_date: 'asc' },
    });

    return instances.map((inst) => ({
      id_instance: inst.id_instance,
      id_session: inst.id_session,
      title: inst.session.title,
      description: inst.session.description,
      scheduled_date: inst.scheduled_date.toISOString(),
      duration_minutes: inst.session.duration_minutes,
      is_recurring: inst.session.recurrence_type !== 'NONE',
      created_by: inst.session.created_by,
    }));
  }

  async cancelInstance(
    groupId: number,
    instanceId: number,
    userId: number,
  ): Promise<{ cancelled: true }> {
    const instance = await this.prisma.study_session_instance.findUnique({
      where: { id_instance: instanceId },
      include: {
        session: {
          include: { group: { select: { owner_id: true } } },
        },
      },
    });

    if (!instance) {
      throw new NotFoundException('Sesión no encontrada.');
    }
    if (instance.session.id_group !== groupId) {
      throw new NotFoundException('La sesión no pertenece a este grupo.');
    }
    if (instance.status === 'CANCELLED') {
      throw new BadRequestException('La sesión ya fue cancelada.');
    }

    const isOwner = instance.session.group.owner_id === userId;
    const isCreator = instance.session.created_by === userId;
    if (!isOwner && !isCreator) {
      throw new ForbiddenException(
        'Solo el propietario del grupo o el creador de la sesión pueden cancelarla.',
      );
    }

    await this.prisma.study_session_instance.update({
      where: { id_instance: instanceId },
      data: {
        status: 'CANCELLED',
        cancelled_at: new Date(),
        cancelled_by: userId,
      },
    });

    return { cancelled: true };
  }

  async updateAttendance(
    groupId: number,
    instanceId: number,
    userId: number,
    dto: UpdateAttendanceDto,
  ): Promise<{ id_attendance: number; status: string; updated_at: string }> {
    const instance = await this.prisma.study_session_instance.findUnique({
      where: { id_instance: instanceId },
      include: { session: true },
    });

    if (!instance) {
      throw new NotFoundException('Sesión no encontrada.');
    }
    if (instance.session.id_group !== groupId) {
      throw new NotFoundException('La sesión no pertenece a este grupo.');
    }
    if (instance.status === 'CANCELLED') {
      throw new BadRequestException('No se puede registrar asistencia en una sesión cancelada.');
    }

    const attendance = await this.prisma.session_attendance.upsert({
      where: { id_instance_id_user: { id_instance: instanceId, id_user: userId } },
      update: { status: dto.status, updated_at: new Date() },
      create: { id_instance: instanceId, id_user: userId, status: dto.status },
    });

    // CA7: notificar al organizador via Observer
    this.studyGroupSubject.notify({
      type: 'ATTENDANCE_UPDATED',
      targetUserId: instance.session.created_by,
      payload: {
        instanceId,
        userId,
        status: dto.status,
        sessionTitle: instance.session.title,
      },
      timestamp: new Date(),
    });

    return {
      id_attendance: attendance.id_attendance,
      status: attendance.status,
      updated_at: attendance.updated_at.toISOString(),
    };
  }
}
