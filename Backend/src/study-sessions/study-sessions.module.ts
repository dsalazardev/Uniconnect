import { Module } from '@nestjs/common';
import { StudySessionsService } from './study-sessions.service';
import { StudySessionsController } from './study-sessions.controller';
import { StudySessionSchedulerService } from './study-session-scheduler.service';
import { PrismaModule } from '../prisma/prisma.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { GroupsModule } from '../groups/groups.module';

@Module({
  imports: [PrismaModule, NotificationsModule, GroupsModule],
  controllers: [StudySessionsController],
  providers: [StudySessionsService, StudySessionSchedulerService],
  exports: [StudySessionsService],
})
export class StudySessionsModule {}
