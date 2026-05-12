import { Module } from '@nestjs/common';
import { PollsService } from './polls.service';
import { PollsController } from './polls.controller';
import { PollSchedulerService } from './poll-scheduler.service';
import { PrismaModule } from '../prisma/prisma.module';
import { MessagesModule } from '../messages/messages.module';

@Module({
  imports: [PrismaModule, MessagesModule],
  controllers: [PollsController],
  providers: [PollsService, PollSchedulerService],
  exports: [PollsService, PollSchedulerService],
})
export class PollsModule {}
