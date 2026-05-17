import { Injectable, Logger } from '@nestjs/common';
import { IObserver } from '../../../messages/domain/observer/interfaces';
import { EventoUniversidadEvent } from '../../domain/observer/evento-universidad-event.interface';
import { PrismaService } from '../../../prisma/prisma.service';
import { NotificationsService } from '../../../notifications/notifications.service';

/**
 * CA4: Observer concreto que filtra por categoría ANTES de emitir el mensaje
 * WebSocket al usuario.
 *
 * Flujo:
 *  1. EventoUniversidadSubject.notify(NUEVO_EVENTO) llama a este observer.
 *  2. El observer consulta sólo los suscriptores de event.idCategoria.
 *  3. Por cada suscriptor llama a NotificationsService.enviarNotificacion(),
 *     que aplica la estrategia in-app-websocket para emitir en tiempo real.
 */
@Injectable()
export class EventPublishedObserver implements IObserver<EventoUniversidadEvent> {
  private readonly logger = new Logger(EventPublishedObserver.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
  ) {}

  update(event: EventoUniversidadEvent): void {
    if (event.tipo !== 'NUEVO_EVENTO') return;

    // Fire-and-forget: no bloquear el thread del subject
    this.notifySubscribers(event).catch((err) =>
      this.logger.error(
        `EventPublishedObserver: error al notificar suscriptores de "${event.categoria}": ${err.message}`,
      ),
    );
  }

  private async notifySubscribers(event: EventoUniversidadEvent): Promise<void> {
    // CA4: filtrar por categoría antes de emitir
    const subscriptions = await this.prisma.event_category_subscription.findMany({
      where: { id_category: event.idCategoria },
      select: { id_user: true },
    });

    this.logger.log(
      `NUEVO_EVENTO "${event.categoria}" → notificando a ${subscriptions.length} suscriptor(es)`,
    );

    await Promise.all(
      subscriptions.map((sub) =>
        this.notificationsService.enviarNotificacion({
          id_user: sub.id_user,
          mensaje: `Nuevo evento en ${event.categoria}: "${event.evento.title}"`,
          tipo_evento: 'event_published',
          entidad_relacionada_id: event.evento.id_event,
        }),
      ),
    );
  }
}
