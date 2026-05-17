import type { INotificacionStrategy, ResultadoEnvio } from '../domain/strategy/interfaces';

// ─── Prisma ──────────────────────────────────────────────────────────────────

export function createPrismaMock(overrides: Record<string, unknown> = {}) {
  return {
    notification: {
      create: jest.fn().mockResolvedValue({}),
      findMany: jest.fn().mockResolvedValue([]),
      count: jest.fn().mockResolvedValue(0),
      updateMany: jest.fn().mockResolvedValue({ count: 1 }),
    },

    user_push_token: {
      findMany: jest.fn().mockResolvedValue([]),
      upsert: jest.fn().mockResolvedValue({}),
      deleteMany: jest.fn().mockResolvedValue({ count: 1 }),
    },

    daily_digest_queue: {
      create: jest.fn().mockResolvedValue({}),
    },

    user_notification_preference: {
      findMany: jest.fn().mockResolvedValue([]),
      upsert: jest.fn().mockResolvedValue({}),
    },

    $queryRaw: jest.fn().mockResolvedValue([]),
    $executeRaw: jest.fn().mockResolvedValue(1),
    $executeRawUnsafe: jest.fn().mockResolvedValue(undefined),

    ...overrides,
  } as any;
}

// ─── ChatGateway ─────────────────────────────────────────────────────────────

export function createChatGatewayMock() {
  return {
    server: {
      to: jest.fn().mockReturnValue({ emit: jest.fn() }),
    },
  } as any;
}

// ─── ChatSessionManager ──────────────────────────────────────────────────────

export function createSessionManagerMock(sockets: string[] = ['socket-1']) {
  return {
    getUserSockets: jest.fn().mockReturnValue(sockets),
  } as any;
}

// ─── Nodemailer ──────────────────────────────────────────────────────────────

export function createNodemailerMock() {
  return {
    createTransport: jest.fn().mockReturnValue({
      sendMail: jest.fn().mockResolvedValue({ messageId: 'mock-id' }),
    }),
  } as any;
}

// ─── Estrategias mock para tests del contexto ────────────────────────────────

export function createMockStrategy(
  canal: string,
  exitoso = true,
): INotificacionStrategy {
  return {
    canal,
    enviar: jest.fn().mockResolvedValue({
      canal,
      exitoso,
      error: exitoso ? undefined : `Error simulado en ${canal}`,
      timestamp: new Date(),
    } as ResultadoEnvio),
  } as INotificacionStrategy;
}

export function createFailingMockStrategy(canal: string): INotificacionStrategy {
  return {
    canal,
    enviar: jest.fn().mockRejectedValue(new Error(`Error interno en ${canal}`)),
  } as INotificacionStrategy;
}
