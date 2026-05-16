import { Injectable, Logger } from '@nestjs/common';
import { IObserver } from '../../../messages/domain/observer/interfaces';
import { StudyGroupEvent } from '../../domain/observer/study-group-event.interface';
import { NotificationsService } from '../../../notifications/notifications.service';

/**
 * Observer concreto para CA7: notifica al organizador cuando un participante
 * actualiza su disponibilidad en una sesión de estudio.
 * Se adjunta a StudyGroupSubject y reacciona únicamente a ATTENDANCE_UPDATED.
 */
@Injectable()
export class AttendanceNotificationObserver implements IObserver<StudyGroupEvent> {
  private readonly logger = new Logger(AttendanceNotificationObserver.name);

  constructor(private readonly notificationsService: NotificationsService) {}

  update(event: StudyGroupEvent): void {
    if (event.type !== 'ATTENDANCE_UPDATED') return;

    const { instanceId, sessionTitle, status } = event.payload as {
      instanceId: number;
      sessionTitle: string;
      status: string;
      userId: number;
    };

    const statusLabel: Record<string, string> = {
      CONFIRMED: 'confirmó',
      DECLINED: 'declinó',
      PENDING: 'marcó como pendiente',
    };

    const mensaje = `Un participante ${statusLabel[status] ?? 'actualizó'} su asistencia en "${sessionTitle}"`;

    // Fire-and-forget: no bloquear la ejecución del subject
    this.notificationsService
      .enviarNotificacion({
        id_user: event.targetUserId,
        mensaje,
        tipo_evento: 'attendance_updated',
        entidad_relacionada_id: instanceId,
      })
      .catch((err) =>
        this.logger.error(
          `AttendanceNotificationObserver: error al notificar al organizador ${event.targetUserId}: ${err.message}`,
        ),
      );
  }
}
