import { Module } from '@nestjs/common';
import { ResourcesService } from './resources.service';
import { ResourcesController } from './resources.controller';
import { OpenGraphService } from './services/open-graph.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [ResourcesService, OpenGraphService],
  controllers: [ResourcesController],
  exports: [ResourcesService],
})
export class ResourcesModule {}
