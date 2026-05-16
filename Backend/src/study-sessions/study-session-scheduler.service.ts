import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';

const STUDY_SESSION_REMINDER_EVENT = 'study_session_reminder';
const REMINDER_WINDOW_MINUTES = 30;

@Injectable()
export class StudySessionSchedulerService {
  private readonly logger = new Logger(StudySessionSchedulerService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
  ) {}

  /**
   * Runs every minute. Finds ACTIVE instances starting in ~30 min that have not
   * yet had their reminder sent, notifies all group members, then marks the
   * instance so the reminder is not sent again (CA2, CA6).
   */
  @Cron(CronExpression.EVERY_MINUTE)
  async checkUpcomingSessions(): Promise<void> {
    const now = new Date();
    const from = new Date(now.getTime() + (REMINDER_WINDOW_MINUTES - 1) * 60 * 1000);
    const to = new Date(now.getTime() + (REMINDER_WINDOW_MINUTES + 1) * 60 * 1000);

    try {
      const instances = await this.prisma.study_session_instance.findMany({
        where: {
          status: 'ACTIVE',
          reminder_sent: false,
          scheduled_date: { gte: from, lte: to },
        },
        include: { session: true },
      });

      if (instances.length === 0) return;

      this.logger.log(
        `StudySessionScheduler: ${instances.length} session(s) upcoming in ~${REMINDER_WINDOW_MINUTES}min`,
      );

      for (const instance of instances) {
        await this.sendRemindersForInstance(instance);
      }
    } catch (err) {
      // Graceful startup: table may not exist yet if migration hasn't run
      if ((err as any)?.code === 'P2021') {
        this.logger.warn('study_session_instance table not found — scheduler inactive.');
        return;
      }
      this.logger.error('StudySessionScheduler: error querying instances', err);
    }
  }

  private async sendRemindersForInstance(
    instance: { id_instance: number; session: { id_group: number; title: string } },
  ): Promise<void> {
    const members = await this.prisma.membership.findMany({
      where: { id_group: instance.session.id_group },
      select: { id_user: true },
    });

    const mensaje = `Recordatorio: "${instance.session.title}" comienza en ${REMINDER_WINDOW_MINUTES} minutos`;

    const results = await Promise.allSettled(
      members
        .filter((m) => m.id_user !== null)
        .map((m) =>
          this.notificationsService.enviarNotificacion({
            id_user: m.id_user as number,
            tipo_evento: STUDY_SESSION_REMINDER_EVENT,
            mensaje,
            entidad_relacionada_id: instance.id_instance,
          }),
        ),
    );

    const failed = results.filter((r) => r.status === 'rejected').length;
    if (failed > 0) {
      this.logger.warn(
        `StudySessionScheduler: ${failed}/${members.length} reminder(s) failed for instance ${instance.id_instance}`,
      );
    }

    // Mark reminder as sent regardless of partial failures to avoid spam
    await this.prisma.study_session_instance.update({
      where: { id_instance: instance.id_instance },
      data: { reminder_sent: true },
    });

    this.logger.log(
      `StudySessionScheduler: reminder sent for instance ${instance.id_instance} to ${members.length} member(s)`,
    );
  }
}
