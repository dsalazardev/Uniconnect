import { Module, OnModuleInit } from '@nestjs/common';
import { GroupsService } from './groups.service';
import { GroupsController } from './groups.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { MessagesModule } from '../messages/messages.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { GroupBusinessValidator } from './validators/group-business.validator';
import { GroupOwnershipGuard } from './guards/group-ownership.guard';
import { AdminOnlyGuard } from './guards/admin-only.guard';
import { GroupRepository } from './repositories/group.repository';
import { GroupActivityListener } from './listeners/group-activity.listener';
import { StudyGroupSubject } from './domain/observer/study-group-subject';
import { WebSocketNotificationObserver } from './infrastructure/observers/websocket-notification.observer';
import { PersistenceNotificationObserver } from './infrastructure/observers/persistence-notification.observer';
import { AttendanceNotificationObserver } from './infrastructure/observers/attendance-notification.observer';

@Module({
  imports: [PrismaModule, MessagesModule, NotificationsModule],
  controllers: [GroupsController],
  providers: [
    GroupsService,
    GroupBusinessValidator,
    GroupOwnershipGuard,
    AdminOnlyGuard,
    GroupRepository,
    GroupActivityListener,
    StudyGroupSubject,
    WebSocketNotificationObserver,
    PersistenceNotificationObserver,
    AttendanceNotificationObserver,
  ],
  exports: [GroupsService, GroupBusinessValidator, GroupRepository, StudyGroupSubject],
})
export class GroupsModule implements OnModuleInit {
  constructor(
    private readonly subject: StudyGroupSubject,
    private readonly webSocketObserver: WebSocketNotificationObserver,
    private readonly persistenceObserver: PersistenceNotificationObserver,
    private readonly attendanceObserver: AttendanceNotificationObserver,
  ) {}

  onModuleInit() {
    // WebSocket: notificaciones en tiempo real para eventos de grupo
    this.subject.attach(this.webSocketObserver);
    // CA7: notifica al organizador (WS + DB + push) cuando un participante
    // actualiza su asistencia en una sesión de estudio
    this.subject.attach(this.attendanceObserver);
  }
}