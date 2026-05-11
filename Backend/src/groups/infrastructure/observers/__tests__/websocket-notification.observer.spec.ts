import { WebSocketNotificationObserver } from '../websocket-notification.observer';
import { ChatGateway } from '../../../../messages/infrastructure/gateways/chat.gateway';
import { ChatSessionManager } from '../../../../messages/managers/chat-session.manager';
import { StudyGroupEvent } from '../../../domain/observer/study-group-event.interface';

describe('WebSocketNotificationObserver', () => {
  let observer: WebSocketNotificationObserver;
  let mockChatGateway: jest.Mocked<ChatGateway>;
  let mockSessionManager: jest.Mocked<ChatSessionManager>;

  beforeEach(() => {
    mockChatGateway = {
      server: {
        to: jest.fn().mockReturnThis(),
        emit: jest.fn(),
      },
    } as any;

    mockSessionManager = {
      getUserSockets: jest.fn(),
    } as any;

    observer = new WebSocketNotificationObserver(
      mockChatGateway,
      mockSessionManager,
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should emit notification via ChatGateway', () => {
    const event: StudyGroupEvent = {
      type: 'JOIN_REQUEST',
      payload: { id_group: 100, group_name: 'Test Group' },
      targetUserId: 1,
      timestamp: new Date(),
    };

    mockSessionManager.getUserSockets.mockReturnValue(['socket-1', 'socket-2']);

    observer.update(event);

    expect(mockSessionManager.getUserSockets).toHaveBeenCalledWith(1);
    expect(mockChatGateway.server.to).toHaveBeenCalledWith('socket-1');
    expect(mockChatGateway.server.to).toHaveBeenCalledWith('socket-2');
    expect(mockChatGateway.server.emit).toHaveBeenCalledWith(
      'notification:new',
      expect.objectContaining({ tipo_evento: 'join_request' }),
    );
  });

  it('should handle missing user session gracefully', () => {
    const event: StudyGroupEvent = {
      type: 'MEMBER_ACCEPTED',
      payload: { id_group: 100, group_name: 'Test Group' },
      targetUserId: 1,
      timestamp: new Date(),
    };

    mockSessionManager.getUserSockets.mockReturnValue([]);

    expect(() => observer.update(event)).not.toThrow();
    expect(mockChatGateway.server.to).not.toHaveBeenCalled();
  });

  it('should handle gateway errors gracefully', () => {
    const event: StudyGroupEvent = {
      type: 'MEMBER_REJECTED',
      payload: { id_group: 100, group_name: 'Test Group' },
      targetUserId: 1,
      timestamp: new Date(),
    };

    mockSessionManager.getUserSockets.mockReturnValue(['socket-1']);
    mockChatGateway.server.emit.mockImplementation(() => {
      throw new Error('Gateway error');
    });

    expect(() => observer.update(event)).not.toThrow();
  });

  it('should validate event type filtering', () => {
    const events: StudyGroupEvent[] = [
      {
        type: 'JOIN_REQUEST',
        payload: { id_group: 100, group_name: 'Test Group' },
        targetUserId: 1,
        timestamp: new Date(),
      },
      {
        type: 'MEMBER_ACCEPTED',
        payload: { id_group: 100, group_name: 'Test Group' },
        targetUserId: 1,
        timestamp: new Date(),
      },
      {
        type: 'ADMIN_TRANSFER_REQUESTED',
        payload: { id_group: 100, group_name: 'Test Group' },
        targetUserId: 1,
        timestamp: new Date(),
      },
    ];

    mockSessionManager.getUserSockets.mockReturnValue(['socket-1']);

    events.forEach((event) => {
      observer.update(event);
    });

    expect(mockChatGateway.server.emit).toHaveBeenCalledTimes(3);
  });
});
