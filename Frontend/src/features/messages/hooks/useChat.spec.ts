import { renderHook, act, waitFor } from '@testing-library/react-native';
import { useChat } from './useChat';
import { messagesService } from '../services/messages.service';
import { websocketService } from '../services/websocket.service';

// Mock services
jest.mock('../services/messages.service');
jest.mock('../services/websocket.service');
jest.mock('../services/files.service');
jest.mock('../config/websocket.config', () => ({
  getServerUrl: jest.fn(() => 'ws://localhost:3000'),
}));

describe('useChat Hook - Sender Info Mapping', () => {
  const mockGroupId = 1;
  const mockUserId = 123;
  const mockToken = 'test-token';
  const mockUserFullName = 'Test User';

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock WebSocket service methods
    (websocketService.isConnected as jest.Mock).mockReturnValue(false);
    (websocketService.connect as jest.Mock).mockImplementation(() => {});
    (websocketService.authenticate as jest.Mock).mockImplementation(() => {});
    (websocketService.onUserConnected as jest.Mock).mockImplementation(() => {});
    (websocketService.onNewMessage as jest.Mock).mockImplementation(() => {});
    (websocketService.onMessageEdited as jest.Mock).mockImplementation(() => {});
    (websocketService.onMessageDeleted as jest.Mock).mockImplementation(() => {});
    (websocketService.onUserTyping as jest.Mock).mockImplementation(() => {});
    (websocketService.off as jest.Mock).mockImplementation(() => {});
    (websocketService.sendMessage as jest.Mock).mockImplementation(() => {});
    
    // Mock messages service
    (messagesService.getRecentMessages as jest.Mock).mockResolvedValue([]);
  });

  it('should map sender_name and sender_picture from WebSocket payload to Message object', async () => {
    const { result } = renderHook(() =>
      useChat({
        groupId: mockGroupId,
        userId: mockUserId,
        token: mockToken,
        userFullName: mockUserFullName,
      })
    );

    // Wait for initial load
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Get the handleNewMessage callback that was registered
    const onNewMessageCall = (websocketService.onNewMessage as jest.Mock).mock.calls[0];
    const handleNewMessage = onNewMessageCall[0];

    // Simulate WebSocket message with sender fields
    const mockWebSocketMessage = {
      id_message: 456,
      id_membership: 789,
      text_content: 'Hello from WebSocket',
      send_at: '2026-03-15T10:00:00Z',
      attachments: '',
      is_edited: false,
      edited_at: null,
      files: [],
      sender_name: 'John Doe',
      sender_picture: 'https://example.com/avatar.jpg',
      membership: {
        user: {
          id_user: 999,
          full_name: 'John Doe',
          picture: 'https://example.com/avatar.jpg',
        },
        group: {
          id_group: mockGroupId,
          name: 'Test Group',
        },
      },
    };

    // Trigger the WebSocket message handler
    act(() => {
      handleNewMessage(mockWebSocketMessage);
    });

    // Verify the message was added with sender fields
    await waitFor(() => {
      expect(result.current.messages).toHaveLength(1);
      expect(result.current.messages[0].sender_name).toBe('John Doe');
      expect(result.current.messages[0].sender_picture).toBe('https://example.com/avatar.jpg');
    });
  });

  it('should handle WebSocket messages with null sender_picture', async () => {
    const { result } = renderHook(() =>
      useChat({
        groupId: mockGroupId,
        userId: mockUserId,
        token: mockToken,
        userFullName: mockUserFullName,
      })
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const onNewMessageCall = (websocketService.onNewMessage as jest.Mock).mock.calls[0];
    const handleNewMessage = onNewMessageCall[0];

    const mockWebSocketMessage = {
      id_message: 456,
      id_membership: 789,
      text_content: 'Hello without picture',
      send_at: '2026-03-15T10:00:00Z',
      attachments: '',
      is_edited: false,
      edited_at: null,
      files: [],
      sender_name: 'Jane Smith',
      sender_picture: null,
      membership: {
        user: {
          id_user: 888,
          full_name: 'Jane Smith',
          picture: null,
        },
        group: {
          id_group: mockGroupId,
          name: 'Test Group',
        },
      },
    };

    act(() => {
      handleNewMessage(mockWebSocketMessage);
    });

    await waitFor(() => {
      expect(result.current.messages).toHaveLength(1);
      expect(result.current.messages[0].sender_name).toBe('Jane Smith');
      expect(result.current.messages[0].sender_picture).toBeNull();
    });
  });

  it('should include sender_name in optimistic messages', async () => {
    const { result } = renderHook(() =>
      useChat({
        groupId: mockGroupId,
        userId: mockUserId,
        token: mockToken,
        userFullName: mockUserFullName,
      })
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Send a message
    act(() => {
      result.current.sendMessage('Test optimistic message');
    });

    // Verify optimistic message has sender_name
    await waitFor(() => {
      expect(result.current.messages).toHaveLength(1);
      expect(result.current.messages[0].sender_name).toBe(mockUserFullName);
      expect(result.current.messages[0].text_content).toBe('Test optimistic message');
    });
  });
});
