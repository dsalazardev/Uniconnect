import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { GroupStateContext } from '../context/group-state.context';
import { EstadoActivo } from '../states/activo.state';
import { EstadoPendienteTransferencia } from '../states/pendiente-transferencia.state';
import { EstadoTransferenciaAceptada } from '../states/transferencia-aceptada.state';
import { EstadoDisuelto } from '../states/disuelto.state';
import { EstadoBloqueado } from '../states/bloqueado.state';
import { GroupData } from '../interfaces/group-state.interface';

const mockSubject = {
  notify: jest.fn(),
  attach: jest.fn(),
  detach: jest.fn(),
  getObserverCount: jest.fn().mockReturnValue(0),
} as any;

const buildGroupData = (overrides: Partial<GroupData> = {}): GroupData => ({
  id_group: 1,
  name: 'Grupo Test',
  owner_id: 10,
  pending_owner_id: null,
  is_direct_message: false,
  ...overrides,
});

describe('Patrón State — Ciclo de vida de transferencia de grupo', () => {
  beforeEach(() => jest.clearAllMocks());

  // ─── CA #1: Interfaz y cinco estados como clases independientes ───────────
  describe('CA #1: Cinco estados concretos implementan IEstadoGrupo', () => {
    it('EstadoActivo implementa getNombre()', () => {
      expect(new EstadoActivo().getNombre()).toBe('Activo');
    });

    it('EstadoPendienteTransferencia implementa getNombre()', () => {
      expect(new EstadoPendienteTransferencia().getNombre()).toBe('PendienteTransferencia');
    });

    it('EstadoTransferenciaAceptada implementa getNombre()', () => {
      expect(new EstadoTransferenciaAceptada().getNombre()).toBe('TransferenciaAceptada');
    });

    it('EstadoDisuelto implementa getNombre()', () => {
      expect(new EstadoDisuelto().getNombre()).toBe('Disuelto');
    });

    it('EstadoBloqueado implementa getNombre()', () => {
      expect(new EstadoBloqueado().getNombre()).toBe('Bloqueado');
    });
  });

  // ─── CA #2: Activo → PendienteTransferencia ──────────────────────────────
  describe('CA #2: solicitar() transiciona Activo → PendienteTransferencia', () => {
    it('emite ADMIN_TRANSFER_REQUESTED y transiciona al estado PendienteTransferencia', () => {
      const context = new GroupStateContext(
        buildGroupData(),
        new EstadoActivo(),
        mockSubject,
      );

      context.solicitar({ groupId: 1, currentUserId: 10, candidateId: 20, candidateName: 'Ana' });

      expect(context.getNombreEstado()).toBe('PendienteTransferencia');
      expect(mockSubject.notify).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'ADMIN_TRANSFER_REQUESTED' }),
      );
    });

    it('rechaza solicitar() si ya hay transferencia pendiente (pending_owner_id != null)', () => {
      const context = new GroupStateContext(
        buildGroupData({ pending_owner_id: 20 }),
        new EstadoPendienteTransferencia(),
        mockSubject,
      );

      expect(() =>
        context.solicitar({ groupId: 1, currentUserId: 10, candidateId: 30 }),
      ).toThrow(BadRequestException);
    });

    it('rechaza solicitar() si el usuario no es el propietario', () => {
      const context = new GroupStateContext(
        buildGroupData(),
        new EstadoActivo(),
        mockSubject,
      );

      expect(() =>
        context.solicitar({ groupId: 1, currentUserId: 99, candidateId: 20 }),
      ).toThrow(ForbiddenException);
    });

    it('rechaza solicitar() si candidato y propietario son el mismo usuario', () => {
      const context = new GroupStateContext(
        buildGroupData(),
        new EstadoActivo(),
        mockSubject,
      );

      expect(() =>
        context.solicitar({ groupId: 1, currentUserId: 10, candidateId: 10 }),
      ).toThrow(BadRequestException);
    });

    it('rechaza solicitar() en un chat directo', () => {
      const context = new GroupStateContext(
        buildGroupData({ is_direct_message: true }),
        new EstadoActivo(),
        mockSubject,
      );

      expect(() =>
        context.solicitar({ groupId: 1, currentUserId: 10, candidateId: 20 }),
      ).toThrow(BadRequestException);
    });
  });

  // ─── CA #3: PendienteTransferencia → TransferenciaAceptada ───────────────
  describe('CA #3: aceptar() transiciona PendienteTransferencia → TransferenciaAceptada', () => {
    it('emite ADMIN_TRANSFER_ACCEPTED y transiciona al estado TransferenciaAceptada', () => {
      const context = new GroupStateContext(
        buildGroupData({ pending_owner_id: 20 }),
        new EstadoPendienteTransferencia(),
        mockSubject,
      );

      context.aceptar({ groupId: 1, currentUserId: 20 });

      expect(context.getNombreEstado()).toBe('TransferenciaAceptada');
      expect(mockSubject.notify).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'ADMIN_TRANSFER_ACCEPTED' }),
      );
    });

    it('rechaza aceptar() si no hay transferencia pendiente', () => {
      const context = new GroupStateContext(
        buildGroupData({ pending_owner_id: null }),
        new EstadoPendienteTransferencia(),
        mockSubject,
      );

      expect(() => context.aceptar({ groupId: 1, currentUserId: 20 })).toThrow(
        BadRequestException,
      );
    });

    it('rechaza aceptar() si el usuario no es el candidato designado', () => {
      const context = new GroupStateContext(
        buildGroupData({ pending_owner_id: 20 }),
        new EstadoPendienteTransferencia(),
        mockSubject,
      );

      expect(() => context.aceptar({ groupId: 1, currentUserId: 99 })).toThrow(
        ForbiddenException,
      );
    });
  });

  // ─── CA #4: PendienteTransferencia → Activo (rechazo) ────────────────────
  describe('CA #4: rechazar() transiciona PendienteTransferencia → Activo', () => {
    it('emite ADMIN_TRANSFER_DECLINED y el grupo vuelve al estado Activo', () => {
      const context = new GroupStateContext(
        buildGroupData({ pending_owner_id: 20 }),
        new EstadoPendienteTransferencia(),
        mockSubject,
      );

      context.rechazar({ groupId: 1, currentUserId: 20 });

      expect(context.getNombreEstado()).toBe('Activo');
      expect(mockSubject.notify).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'ADMIN_TRANSFER_DECLINED' }),
      );
    });

    it('rechaza rechazar() si no hay transferencia pendiente', () => {
      const context = new GroupStateContext(
        buildGroupData({ pending_owner_id: null }),
        new EstadoPendienteTransferencia(),
        mockSubject,
      );

      expect(() => context.rechazar({ groupId: 1, currentUserId: 20 })).toThrow(
        BadRequestException,
      );
    });

    it('rechaza rechazar() si el usuario no es el candidato', () => {
      const context = new GroupStateContext(
        buildGroupData({ pending_owner_id: 20 }),
        new EstadoPendienteTransferencia(),
        mockSubject,
      );

      expect(() => context.rechazar({ groupId: 1, currentUserId: 99 })).toThrow(
        ForbiddenException,
      );
    });
  });

  // ─── CA #5: Ningún estado referencia a otro sin pasar por la interfaz ─────
  describe('CA #5: Los estados no realizan operaciones inválidas', () => {
    it('EstadoActivo.aceptar() lanza BadRequestException', () => {
      const context = new GroupStateContext(buildGroupData(), new EstadoActivo(), mockSubject);
      expect(() => context.aceptar({ groupId: 1, currentUserId: 10 })).toThrow(BadRequestException);
    });

    it('EstadoActivo.rechazar() lanza BadRequestException', () => {
      const context = new GroupStateContext(buildGroupData(), new EstadoActivo(), mockSubject);
      expect(() => context.rechazar({ groupId: 1, currentUserId: 10 })).toThrow(BadRequestException);
    });

    it('EstadoTransferenciaAceptada bloquea todas las operaciones', () => {
      const context = new GroupStateContext(
        buildGroupData(),
        new EstadoTransferenciaAceptada(),
        mockSubject,
      );
      expect(() => context.solicitar({ groupId: 1, currentUserId: 10, candidateId: 20 })).toThrow(BadRequestException);
      expect(() => context.aceptar({ groupId: 1, currentUserId: 20 })).toThrow(BadRequestException);
      expect(() => context.rechazar({ groupId: 1, currentUserId: 20 })).toThrow(BadRequestException);
      expect(() => context.transferir({ groupId: 1, currentUserId: 10, candidateId: 20 })).toThrow(BadRequestException);
    });

    it('EstadoDisuelto bloquea todas las operaciones', () => {
      const context = new GroupStateContext(
        buildGroupData(),
        new EstadoDisuelto(),
        mockSubject,
      );
      expect(() => context.solicitar({ groupId: 1, currentUserId: 10, candidateId: 20 })).toThrow(BadRequestException);
      expect(() => context.aceptar({ groupId: 1, currentUserId: 20 })).toThrow(BadRequestException);
      expect(() => context.rechazar({ groupId: 1, currentUserId: 20 })).toThrow(BadRequestException);
      expect(() => context.transferir({ groupId: 1, currentUserId: 10, candidateId: 20 })).toThrow(BadRequestException);
    });

    it('EstadoBloqueado bloquea todas las operaciones', () => {
      const context = new GroupStateContext(
        buildGroupData(),
        new EstadoBloqueado(),
        mockSubject,
      );
      expect(() => context.solicitar({ groupId: 1, currentUserId: 10, candidateId: 20 })).toThrow(BadRequestException);
      expect(() => context.aceptar({ groupId: 1, currentUserId: 20 })).toThrow(BadRequestException);
      expect(() => context.rechazar({ groupId: 1, currentUserId: 20 })).toThrow(BadRequestException);
      expect(() => context.transferir({ groupId: 1, currentUserId: 10, candidateId: 20 })).toThrow(BadRequestException);
    });
  });

  // ─── CA #6: Observer recibe evento con nuevo estado como payload ──────────
  describe('CA #6: Subject notifica observers con nuevo estado en el payload', () => {
    it('el payload del evento ADMIN_TRANSFER_REQUESTED contiene nuevo_estado', () => {
      const context = new GroupStateContext(
        buildGroupData(),
        new EstadoActivo(),
        mockSubject,
      );

      context.solicitar({ groupId: 1, currentUserId: 10, candidateId: 20, candidateName: 'Ana' });

      const emittedEvent = mockSubject.notify.mock.calls[0][0];
      expect(emittedEvent.payload.nuevo_estado).toBe('PendienteTransferencia');
    });

    it('el payload del evento ADMIN_TRANSFER_ACCEPTED contiene nuevo_estado', () => {
      const context = new GroupStateContext(
        buildGroupData({ pending_owner_id: 20 }),
        new EstadoPendienteTransferencia(),
        mockSubject,
      );

      context.aceptar({ groupId: 1, currentUserId: 20 });

      const emittedEvent = mockSubject.notify.mock.calls[0][0];
      expect(emittedEvent.payload.nuevo_estado).toBe('TransferenciaAceptada');
    });

    it('el payload del evento ADMIN_TRANSFER_DECLINED contiene nuevo_estado', () => {
      const context = new GroupStateContext(
        buildGroupData({ pending_owner_id: 20 }),
        new EstadoPendienteTransferencia(),
        mockSubject,
      );

      context.rechazar({ groupId: 1, currentUserId: 20 });

      const emittedEvent = mockSubject.notify.mock.calls[0][0];
      expect(emittedEvent.payload.nuevo_estado).toBe('Activo');
    });

    it('todos los observers suscritos reciben el evento', () => {
      const observer1 = { update: jest.fn() };
      const observer2 = { update: jest.fn() };
      const realSubject = {
        notify: jest.fn((event) => {
          observer1.update(event);
          observer2.update(event);
        }),
      } as any;

      const context = new GroupStateContext(buildGroupData(), new EstadoActivo(), realSubject);
      context.solicitar({ groupId: 1, currentUserId: 10, candidateId: 20 });

      expect(observer1.update).toHaveBeenCalledTimes(1);
      expect(observer2.update).toHaveBeenCalledTimes(1);
    });
  });
});
