/**
 * Configuración del sistema de WebSocket
 * 
 * IMPORTANTE: Este archivo es agnóstico de plataforma.
 * No importa variables de entorno ni servicios específicos.
 * La URL del servidor debe ser proporcionada por la aplicación cliente.
 */

/**
 * Configuración de WebSocket
 * 
 * @param serverUrl - URL del servidor WebSocket (debe ser proporcionada por el cliente)
 */
export const createWSConfig = (serverUrl: string) => ({
  // URL del servidor WebSocket
  SERVER_URL: serverUrl,
  
  // Configuración de reconexión
  RECONNECTION_DELAY: 1000, // 1 segundo
  MAX_RECONNECTION_ATTEMPTS: 5,
  
  // Timeout para el indicador de typing
  TYPING_TIMEOUT: 3000, // 3 segundos
  
  // Configuración de paginación
  DEFAULT_MESSAGE_LIMIT: 50,
  HISTORY_PAGE_SIZE: 20,
} as const);

/**
 * Configuración por defecto (sin URL)
 * La aplicación cliente debe proporcionar la URL del servidor
 */
export const DEFAULT_WS_CONFIG = {
  RECONNECTION_DELAY: 1000,
  MAX_RECONNECTION_ATTEMPTS: 5,
  TYPING_TIMEOUT: 3000,
  DEFAULT_MESSAGE_LIMIT: 50,
  HISTORY_PAGE_SIZE: 20,
} as const;

/**
 * Tipos de notificaciones del sistema WebSocket
 * 
 * NOTA: Renombrado a WSNotificationType para evitar conflicto con NotificationType de types/notifications.ts
 */
export enum WSNotificationType {
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

/**
 * Type exports
 */
export type WSConfig = ReturnType<typeof createWSConfig>;
