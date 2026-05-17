import { Logger } from '@nestjs/common';
import { NotificationsService } from '../notifications.service';
import { NotificacionDTO } from '../domain/strategy/interfaces';
import {
  createPrismaMock,
  createMockStrategy,
  createFailingMockStrategy,
} from '../test/dobles-de-prueba';

jest.spyOn(Logger.prototype, 'error').mockImplementation(() => {});

const notificacion: NotificacionDTO = {
  id_user: 1,
  mensaje: 'Prueba de notificación',
  tipo_evento: 'message',
  entidad_relacionada_id: 42,
};

// ─── Task 3: Inyección de estrategias (Criterio 3) ──────────────────────────

describe('NotificationsService — Inyección de estrategias', () => {
  let service: NotificationsService;
  let prismaMock: ReturnType<typeof createPrismaMock>;

  beforeEach(() => {
    prismaMock = createPrismaMock();
  });

  it('debe ejecutar las 3 estrategias cuando se envía una notificación', async () => {
    const inApp = createMockStrategy('in_app_websocket');
    const email = createMockStrategy('email_institucional');
    const push = createMockStrategy('push_movil');

    service = new NotificationsService(prismaMock, [inApp, email, push]);

    const resultados = await service.enviarNotificacion(notificacion);

    expect(inApp.enviar).toHaveBeenCalledTimes(1);
    expect(email.enviar).toHaveBeenCalledTimes(1);
    expect(push.enviar).toHaveBeenCalledTimes(1);
    expect(resultados).toHaveLength(3);
    resultados.forEach((r) => {
      expect(r.exitoso).toBe(true);
    });
  });

  it('debe aislar el fallo de la estrategia push — las otras 2 retornan exitoso=true', async () => {
    const inApp = createMockStrategy('in_app_websocket');
    const email = createMockStrategy('email_institucional');
    const pushFails = createFailingMockStrategy('push_movil');

    service = new NotificationsService(prismaMock, [inApp, email, pushFails]);

    const resultados = await service.enviarNotificacion(notificacion);

    expect(resultados).toHaveLength(3);

    const pushResult = resultados.find((r) => r.canal === 'push_movil');
    expect(pushResult).toBeDefined();
    expect(pushResult!.exitoso).toBe(false);

    const okResults = resultados.filter((r) => r.canal !== 'push_movil');
    okResults.forEach((r) => {
      expect(r.exitoso).toBe(true);
    });
  });
});

// ─── Task 4: Preferencias (Criterio 4) ──────────────────────────────────────

describe('NotificationsService — Filtrado por preferencias', () => {
  let service: NotificationsService;
  let prismaMock: ReturnType<typeof createPrismaMock>;
  let inApp: ReturnType<typeof createMockStrategy>;
  let email: ReturnType<typeof createMockStrategy>;
  let push: ReturnType<typeof createMockStrategy>;

  beforeEach(() => {
    prismaMock = createPrismaMock();
    inApp = createMockStrategy('in_app_websocket');
    email = createMockStrategy('email_institucional');
    push = createMockStrategy('push_movil');
  });

  it('push desactivado → PushMovilStrategy NO debe ejecutarse', async () => {
    prismaMock.user_notification_preference.findMany.mockResolvedValue([
      { canal: 'in_app_websocket', activo: true },
      { canal: 'email_institucional', activo: true },
      { canal: 'push_movil', activo: false },
    ]);

    service = new NotificationsService(prismaMock, [inApp, email, push]);

    const resultados = await service.enviarNotificacion(notificacion);

    expect(inApp.enviar).toHaveBeenCalledTimes(1);
    expect(email.enviar).toHaveBeenCalledTimes(1);
    expect(push.enviar).not.toHaveBeenCalled();
    expect(resultados).toHaveLength(2);
    resultados.forEach((r) => {
      expect(r.exitoso).toBe(true);
    });
  });

  it('sin preferencias registradas → todas las estrategias se ejecutan (default-on)', async () => {
    prismaMock.user_notification_preference.findMany.mockResolvedValue([]);

    service = new NotificationsService(prismaMock, [inApp, email, push]);

    const resultados = await service.enviarNotificacion(notificacion);

    expect(inApp.enviar).toHaveBeenCalledTimes(1);
    expect(email.enviar).toHaveBeenCalledTimes(1);
    expect(push.enviar).toHaveBeenCalledTimes(1);
    expect(resultados).toHaveLength(3);
  });
});

// ─── Task 4: Open/Closed (Criterio 5) ───────────────────────────────────────

describe('NotificationsService — Principio Open/Closed', () => {
  let service: NotificationsService;
  let prismaMock: ReturnType<typeof createPrismaMock>;

  beforeEach(() => {
    prismaMock = createPrismaMock();
  });

  it('estrategia ficticia "slack" con canal nuevo se ejecuta sin modificar NotificationsService', async () => {
    const inApp = createMockStrategy('in_app_websocket');
    const email = createMockStrategy('email_institucional');
    const slack = createMockStrategy('slack');

    service = new NotificationsService(prismaMock, [inApp, email, slack]);

    const resultados = await service.enviarNotificacion(notificacion);

    expect(inApp.enviar).toHaveBeenCalledTimes(1);
    expect(email.enviar).toHaveBeenCalledTimes(1);
    expect(slack.enviar).toHaveBeenCalledTimes(1);

    expect(resultados).toHaveLength(3);

    const slackResult = resultados.find((r) => r.canal === 'slack');
    expect(slackResult).toBeDefined();
    expect(slackResult!.exitoso).toBe(true);
    expect(slackResult!.canal).toBe('slack');
  });
});
