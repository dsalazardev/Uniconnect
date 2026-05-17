import { Module } from '@nestjs/common';
import { ResourcesService } from './resources.service';
import { BibliotecaController } from './biblioteca.controller';
import { OpenGraphService } from './services/open-graph.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [ResourcesService, OpenGraphService],
  controllers: [BibliotecaController],
  exports: [ResourcesService],
})
export class ResourcesModule {}
