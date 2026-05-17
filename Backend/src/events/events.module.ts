import { Module, OnModuleInit } from '@nestjs/common';
import { EventsService } from './events.service';
import { EventsController } from './events.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { EventoUniversidadSubject } from './domain/observer/evento-universidad.subject';
import { EventPublishedObserver } from './infrastructure/observers/event-published.observer';

@Module({
  imports: [PrismaModule, NotificationsModule],
  providers: [EventsService, EventoUniversidadSubject, EventPublishedObserver],
  controllers: [EventsController],
  exports: [EventsService, EventoUniversidadSubject],
})
export class EventsModule implements OnModuleInit {
  constructor(
    private readonly subject: EventoUniversidadSubject,
    private readonly eventPublishedObserver: EventPublishedObserver,
  ) {}

  onModuleInit() {
    // CA4: adjuntar el observer al subject para que filtre por categoría antes de emitir WebSocket
    this.subject.attach(this.eventPublishedObserver);
  }
}
