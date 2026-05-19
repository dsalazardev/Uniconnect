import { Test, TestingModule } from '@nestjs/testing';
import { EventsService } from './events.service';
import { PrismaService } from '../prisma/prisma.service';
import { EventoUniversidadSubject } from './domain/observer/evento-universidad.subject';
import { MessagesGateway } from '../messages/messages.gateway';

describe('EventsService', () => {
  let service: EventsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EventsService,
        {
          provide: PrismaService,
          useValue: {
            event_category: { findMany: jest.fn(), findUniqueOrThrow: jest.fn() },
            event: { findMany: jest.fn(), findUnique: jest.fn(), create: jest.fn() },
          },
        },
        {
          provide: EventoUniversidadSubject,
          useValue: {
            attach: jest.fn(),
            detach: jest.fn(),
            notify: jest.fn(),
            getObserverCount: jest.fn(),
          },
        },
        {
          provide: MessagesGateway,
          useValue: {
            server: {
              to: jest.fn().mockReturnThis(),
              emit: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<EventsService>(EventsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
