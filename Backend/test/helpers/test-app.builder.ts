import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../../src/app.module';
import { Sprint4PrismaMock, createSprint4PrismaMock } from './prisma-mock.factory';
import { PrismaService } from '../../src/prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import { createConfigServiceMock } from './jwt-test.helper';

export interface TestApp {
  app: INestApplication<App>;
  prisma: Sprint4PrismaMock;
  httpServer: ReturnType<INestApplication['getHttpServer']>;
  close: () => Promise<void>;
}

export async function buildTestApp(): Promise<TestApp> {
  const prismaMock = createSprint4PrismaMock();

  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [AppModule],
  })
    .overrideProvider(PrismaService)
    .useValue(prismaMock as any)
    .overrideProvider(ConfigService)
    .useValue(createConfigServiceMock())
    .compile();

  const app = moduleFixture.createNestApplication();
  app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));
  await app.init();

  return {
    app,
    prisma: prismaMock,
    httpServer: app.getHttpServer(),
    close: async () => { await app.close(); },
  };
}

export { request };
