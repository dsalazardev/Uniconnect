/**
 * Utils Module
 * 
 * Exporta utilidades compartidas para el paquete @uniconnect/shared.
 * Todas las utilidades son agnósticas de plataforma y usan dependency injection.
 */

// WebSocket Configuration
export {
  createWSConfig,
  DEFAULT_WS_CONFIG,
  WSNotificationType,
  ConnectionState,
  BUSINESS_RULES,
  type WSConfig,
} from './websocket.config';

// Debug Utilities
export {
  runMessagingDiagnostics,
  testMessageSend,
  testRecentMessagesEndpoint,
  type DiagnosticResult,
  type WebSocketServiceInterface,
  type DiagnosticConfig,
  type MessageTestConfig,
  type EndpointTestConfig,
} from './debug';
