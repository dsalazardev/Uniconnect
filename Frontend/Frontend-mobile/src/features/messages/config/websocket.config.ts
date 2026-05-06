import { WEBSOCKET_URL } from '@/src/constants/api';

/**
 * Configuración del sistema de WebSocket
 */

// URL del servidor WebSocket - Importada desde constantes centralizadas
export const WS_CONFIG = {
  // URL dinámica desde constantes (se ajusta según .env)
  SERVER_URL: WEBSOCKET_URL,
  
  // Configuración de reconexión
  RECONNECTION_DELAY: 1000, // 1 segundo
  MAX_RECONNECTION_ATTEMPTS: 5,
  
  // Timeout para el indicador de typing
  TYPING_TIMEOUT: 3000, // 3 segundos
  
  // Configuración de paginación
  DEFAULT_MESSAGE_LIMIT: 50,
  HISTORY_PAGE_SIZE: 20,
} as const;

/**
 * Obtener URL del servidor - Centralizada en constantes de API
 */
export const getServerUrl = (): string => {
  return WS_CONFIG.SERVER_URL;
};

/**
 * Tipos de notificaciones del sistema
 */
export enum NotificationType {
  GROUP_INVITATION = 'group_invitation',
  NEW_MESSAGE = 'new_message',
  INVITATION_ACCEPTED = 'invitation_accepted',
  NEW_MEMBER = 'new_member',
}

/**
 * Estados de conexión WebSocket
 */
export enum ConnectionState {
  CONNECTED = 'connected',
  DISCONNECTED = 'disconnected',
  RECONNECTING = 'reconnecting',
  ERROR = 'error',
}

/**
 * Límites y validaciones de negocio
 */
export const BUSINESS_RULES = {
  MAX_GROUPS_PER_COURSE: 3,
  MAX_MESSAGE_LENGTH: 1000,
  MIN_GROUP_NAME_LENGTH: 3,
  MAX_GROUP_NAME_LENGTH: 50,
  MAX_GROUP_DESCRIPTION_LENGTH: 200,
} as const;
