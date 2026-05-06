import { io, Socket } from 'socket.io-client';
import { AppState, AppStateStatus } from 'react-native';
import { 
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
} from '../types';
import { getServerUrl } from '../config/websocket.config';

class WebSocketService {
  private socket: Socket | null = null;
  private currentUserId: number | null = null;
  private currentMembershipId: number | null = null;
  private currentGroupId: number | null = null;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;
  private pendingAuthData: AuthenticateData | null = null;
  private appStateSubscription: ReturnType<typeof AppState.addEventListener> | null = null;

  /**
   * Conectar al servidor WebSocket
   */
  connect(serverUrl?: string) {
    if (this.socket?.connected) {
      
      // Si hay autenticación pendiente, ejecutarla ahora
      if (this.pendingAuthData) {
        this.authenticate(this.pendingAuthData);
        this.pendingAuthData = null;
      }
      return;
    }

    // Usar serverUrl si se proporciona, sino usar la configuración centralizada
    const url = serverUrl || getServerUrl();
    

    this.socket = io(url, {
      transports: ['websocket'],
      autoConnect: true,
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: this.maxReconnectAttempts,
    });

    this.setupEventListeners();
    this.setupAppStateListener();
  }

  /**
   * Configurar listeners de eventos del WebSocket
   */
  private setupEventListeners() {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      
      this.reconnectAttempts = 0;
      
      // Autenticar con datos pendientes o con sesión previa
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

  /**
   * Configurar listener de AppState para manejar ciclo de vida de la app
   */
  private setupAppStateListener() {
    // Remover listener previo si existe
    if (this.appStateSubscription) {
      this.appStateSubscription.remove();
    }

    this.appStateSubscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      if (nextAppState === 'background' || nextAppState === 'inactive') {
        // App va a background - desconectar WebSocket
        if (this.socket?.connected) {
          this.disconnect();
        }
      } else if (nextAppState === 'active') {
        // App vuelve a foreground - reconectar si hay datos pendientes
        if (this.pendingAuthData && !this.socket?.connected) {
          this.connect();
        }
      }
    });
  }

  /**
   * Autenticar usuario en el WebSocket
   */
  authenticate(data: AuthenticateData) {
    // Guardar los datos para uso futuro
    this.currentUserId = data.id_user;
    this.currentMembershipId = data.id_membership ?? null;
    this.currentGroupId = data.id_group;

    if (!this.socket?.connected) {
      
      this.pendingAuthData = data;
      return;
    }

    
    this.socket.emit('authenticate', data);
    
    // Escuchar respuesta de autenticación una sola vez
    this.socket.once('authenticate', (response: { success: boolean; id_membership?: number; error?: string }) => {
      if (response.success && response.id_membership) {
        
        this.currentMembershipId = response.id_membership;
      } else {
        console.error('Error de autenticación:', response.error || 'No eres miembro de este grupo');
      }
    });
    
    this.pendingAuthData = null;
  }

  /**
   * Enviar mensaje al grupo
   */
  sendMessage(data: MessageSendData) {
    if (!this.socket?.connected) {
      console.error('Socket no conectado');
      return;
    }

    this.socket.emit('message:send', data);
  }

  /**
   * Editar mensaje existente
   */
  editMessage(data: MessageEditData) {
    if (!this.socket?.connected) {
      console.error('Socket no conectado');
      return;
    }

    this.socket.emit('message:edit', data);
  }

  /**
   * Eliminar mensaje
   */
  deleteMessage(data: MessageDeleteData) {
    if (!this.socket?.connected) {
      console.error('Socket no conectado');
      return;
    }

    this.socket.emit('message:delete', data);
  }

  /**
   * Emitir evento de "usuario escribiendo"
   */
  emitTyping(data: TypingData) {
    if (!this.socket?.connected) {
      console.error('Socket no conectado');
      return;
    }

    this.socket.emit('user:typing', data);
  }

  /**
   * Cargar historial de mensajes con paginación
   */
  loadHistory(data: MessagesHistoryData) {
    if (!this.socket?.connected) {
      console.error('Socket no conectado');
      return;
    }

    this.socket.emit('messages:history', data);
  }

  /**
   * Buscar mensajes en el grupo
   */
  searchMessages(data: SearchMessagesData) {
    if (!this.socket?.connected) {
      console.error('Socket no conectado');
      return;
    }

    this.socket.emit('messages:search', data);
  }

  /**
   * Salir del grupo actual
   */
  leaveRoom() {
    if (!this.socket?.connected) {
      console.error('Socket no conectado');
      return;
    }

    this.socket.emit('room:leave');
    this.currentGroupId = null;
    this.currentMembershipId = null;
  }

  /**
   * Obtener estadísticas de la sesión
   */
  getSessionStats() {
    if (!this.socket?.connected) {
      console.error('Socket no conectado');
      return;
    }

    this.socket.emit('session:stats');
  }

  /**
   * Escuchar conexión del usuario
   */
  onUserConnected(callback: (data: any) => void) {
    this.socket?.on('user:connected', callback);
  }

  /**
   * Escuchar nuevo mensaje
   */
  onNewMessage(callback: (message: Message) => void) {
    this.socket?.on('message:new', callback);
  }

  /**
   * Escuchar edición de mensaje
   */
  onMessageEdited(callback: (data: { id_message: number; text_content: string; is_edited: boolean; edited_at: string }) => void) {
    this.socket?.on('message:edited', callback);
  }

  /**
   * Escuchar eliminación de mensaje
   */
  onMessageDeleted(callback: (data: { id_message: number }) => void) {
    this.socket?.on('message:deleted', callback);
  }

  /**
   * Escuchar cuando un usuario está escribiendo
   */
  onUserTyping(callback: (data: TypingData) => void) {
    this.socket?.on('user:typing', callback);
  }

  /**
   * Escuchar respuesta de historial
   */
  onHistoryReceived(callback: (data: MessageHistoryResponse) => void) {
    this.socket?.on('messages:history', callback);
  }

  /**
   * Escuchar resultados de búsqueda
   */
  onSearchResults(callback: (data: MessageSearchResponse) => void) {
    this.socket?.on('messages:search', callback);
  }

  /**
   * Escuchar confirmación de salida de sala
   */
  onRoomLeft(callback: () => void) {
    this.socket?.on('room:left', callback);
  }

  /**
   * Escuchar estadísticas de sesión
   */
  onSessionStats(callback: (stats: SessionStatsResponse) => void) {
    this.socket?.on('session:stats', callback);
  }

  /**
   * Escuchar nueva notificación (para badge en tiempo real)
   */
  onNotificationReceived(callback: (data: any) => void) {
    this.socket?.on('notification:new', callback);
  }

  /**
   * Suscribirse a cualquier evento del socket (genérico)
   */
  on(event: string, callback: (...args: any[]) => void) {
    this.socket?.on(event, callback);
  }

  /**
   * Remover listener de evento específico
   */
  off(event: string, callback?: (...args: any[]) => void) {
    if (callback) {
      this.socket?.off(event, callback);
    } else {
      this.socket?.off(event);
    }
  }

  /**
   * Desconectar del WebSocket
   */
  disconnect() {
    // Remover listener de AppState
    if (this.appStateSubscription) {
      this.appStateSubscription.remove();
      this.appStateSubscription = null;
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

  /**
   * Verificar si está conectado
   */
  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  /**
   * Obtener ID de grupo actual
   */
  getCurrentGroupId(): number | null {
    return this.currentGroupId;
  }

  /**
   * Obtener ID de usuario actual
   */
  getCurrentUserId(): number | null {
    return this.currentUserId;
  }
}

// Exportar instancia singleton
export const websocketService = new WebSocketService();
export default WebSocketService;
