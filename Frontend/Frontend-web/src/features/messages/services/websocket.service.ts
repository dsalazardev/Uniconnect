import { io, Socket } from 'socket.io-client';
import type { 
  Message, 
  MessageSendData, 
  MessageEditData, 
  MessageDeleteData,
  TypingData,
  MessagesHistoryData,
  MessageHistoryResponse,
  SearchMessagesData,
  MessageSearchResponse,
  SessionStatsResponse,
  AuthenticateData
} from '@uniconnect/shared';

// Web-specific WebSocket configuration
const getServerUrl = (): string => {
  return import.meta.env.VITE_WEBSOCKET_URL || 'http://localhost:8007';
};

class WebSocketService {
  private socket: Socket | null = null;
  private currentUserId: number | null = null;
  private currentMembershipId: number | null = null;
  private currentGroupId: number | null = null;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;
  private pendingAuthData: AuthenticateData | null = null;
  private visibilityChangeHandler: (() => void) | null = null;

  connect(serverUrl?: string) {
    if (this.socket?.connected) {
      if (this.pendingAuthData) {
        this.authenticate(this.pendingAuthData);
        this.pendingAuthData = null;
      }
      return;
    }

    const url = serverUrl || getServerUrl();

    this.socket = io(url, {
      transports: ['websocket'],
      autoConnect: true,
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: this.maxReconnectAttempts,
    });

    this.setupEventListeners();
    this.setupVisibilityListener();
  }

  private setupEventListeners() {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      this.reconnectAttempts = 0;
      
      if (this.pendingAuthData) {
        this.authenticate(this.pendingAuthData);
        this.pendingAuthData = null;
      } else if (this.currentUserId && this.currentGroupId) {
        this.authenticate({
          id_user: this.currentUserId,
          id_membership: this.currentMembershipId ?? undefined,
          id_group: this.currentGroupId,
        });
      }
    });

    this.socket.on('disconnect', (reason) => {
      this.reconnectAttempts++;
    });

    this.socket.on('connect_error', (error) => {
      console.error('Error de conexión:', error.message);
      this.reconnectAttempts++;
      
      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        console.error('Máximo de intentos de reconexión alcanzado');
        this.disconnect();
      }
    });

    this.socket.on('reconnect', (attemptNumber) => {
      this.reconnectAttempts = 0;
    });
  }

  private setupVisibilityListener() {
    if (this.visibilityChangeHandler) {
      document.removeEventListener('visibilitychange', this.visibilityChangeHandler);
    }

    this.visibilityChangeHandler = () => {
      if (document.hidden) {
        // Page hidden - disconnect WebSocket
        if (this.socket?.connected) {
          this.disconnect();
        }
      } else {
        // Page visible - reconnect if needed
        if (this.pendingAuthData && !this.socket?.connected) {
          this.connect();
        }
      }
    };

    document.addEventListener('visibilitychange', this.visibilityChangeHandler);
  }

  authenticate(data: AuthenticateData) {
    this.currentUserId = data.id_user;
    this.currentMembershipId = data.id_membership ?? null;
    this.currentGroupId = data.id_group;

    if (!this.socket?.connected) {
      this.pendingAuthData = data;
      return;
    }

    this.socket.emit('authenticate', data);
    
    this.socket.once('authenticate', (response: { success: boolean; id_membership?: number; error?: string }) => {
      if (response.success && response.id_membership) {
        this.currentMembershipId = response.id_membership;
      } else {
        console.error('Error de autenticación:', response.error || 'No eres miembro de este grupo');
      }
    });
    
    this.pendingAuthData = null;
  }

  sendMessage(data: MessageSendData) {
    if (!this.socket?.connected) {
      console.error('Socket no conectado');
      return;
    }
    this.socket.emit('message:send', data);
  }

  editMessage(data: MessageEditData) {
    if (!this.socket?.connected) {
      console.error('Socket no conectado');
      return;
    }
    this.socket.emit('message:edit', data);
  }

  deleteMessage(data: MessageDeleteData) {
    if (!this.socket?.connected) {
      console.error('Socket no conectado');
      return;
    }
    this.socket.emit('message:delete', data);
  }

  emitTyping(data: TypingData) {
    if (!this.socket?.connected) {
      console.error('Socket no conectado');
      return;
    }
    this.socket.emit('user:typing', data);
  }

  loadHistory(data: MessagesHistoryData) {
    if (!this.socket?.connected) {
      console.error('Socket no conectado');
      return;
    }
    this.socket.emit('messages:history', data);
  }

  searchMessages(data: SearchMessagesData) {
    if (!this.socket?.connected) {
      console.error('Socket no conectado');
      return;
    }
    this.socket.emit('messages:search', data);
  }

  leaveRoom() {
    if (!this.socket?.connected) {
      console.error('Socket no conectado');
      return;
    }
    this.socket.emit('room:leave');
    this.currentGroupId = null;
    this.currentMembershipId = null;
  }

  getSessionStats() {
    if (!this.socket?.connected) {
      console.error('Socket no conectado');
      return;
    }
    this.socket.emit('session:stats');
  }

  onUserConnected(callback: (data: any) => void) {
    this.socket?.on('user:connected', callback);
  }

  onNewMessage(callback: (message: Message) => void) {
    this.socket?.on('message:new', callback);
  }

  onMessageEdited(callback: (data: { id_message: number; text_content: string; is_edited: boolean; edited_at: string }) => void) {
    this.socket?.on('message:edited', callback);
  }

  onMessageDeleted(callback: (data: { id_message: number }) => void) {
    this.socket?.on('message:deleted', callback);
  }

  onUserTyping(callback: (data: TypingData) => void) {
    this.socket?.on('user:typing', callback);
  }

  onHistoryReceived(callback: (data: MessageHistoryResponse) => void) {
    this.socket?.on('messages:history', callback);
  }

  onSearchResults(callback: (data: MessageSearchResponse) => void) {
    this.socket?.on('messages:search', callback);
  }

  onRoomLeft(callback: () => void) {
    this.socket?.on('room:left', callback);
  }

  onSessionStats(callback: (stats: SessionStatsResponse) => void) {
    this.socket?.on('session:stats', callback);
  }

  onNotificationReceived(callback: (data: any) => void) {
    this.socket?.on('notification:new', callback);
  }

  on(event: string, callback: (...args: any[]) => void) {
    this.socket?.on(event, callback);
  }

  off(event: string, callback?: (...args: any[]) => void) {
    if (callback) {
      this.socket?.off(event, callback);
    } else {
      this.socket?.off(event);
    }
  }

  disconnect() {
    if (this.visibilityChangeHandler) {
      document.removeEventListener('visibilitychange', this.visibilityChangeHandler);
      this.visibilityChangeHandler = null;
    }

    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.currentUserId = null;
      this.currentMembershipId = null;
      this.currentGroupId = null;
      this.pendingAuthData = null;
    }
  }

  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  getCurrentGroupId(): number | null {
    return this.currentGroupId;
  }

  getCurrentUserId(): number | null {
    return this.currentUserId;
  }
}

export const websocketService = new WebSocketService();
export default WebSocketService;
