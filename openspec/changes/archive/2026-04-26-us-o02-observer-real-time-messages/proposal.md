# Proposal: US-O02 - Observer para Mensajes del Chat en Tiempo Real

## Why

El sistema de chat en tiempo real de Uniconnect ya implementa el patrón Observer mediante WebSockets con `@nestjs/websockets` y Socket.IO, pero carece de documentación formal, tests específicos del patrón, y handlers especializados para eventos de observación avanzados (presencia de usuarios, estado de lectura, notificaciones de actividad). Esta historia de usuario busca formalizar, documentar y extender la implementación existente del patrón Observer para cumplir con los requisitos académicos del proyecto y mejorar la experiencia de usuario en tiempo real.

## What Changes

- **Documentación del Patrón Observer**: Crear documentación técnica que explique cómo el `MessagesGateway` implementa el patrón Observer usando `@SubscribeMessage()` como mecanismo de suscripción
- **Nuevos Handlers WebSocket**: Agregar handlers especializados para eventos de observación avanzados:
  - `message:read` - Notificar cuando un mensaje es leído
  - `user:presence` - Broadcast de estado de presencia (online/offline/away)
  - `group:activity` - Notificaciones de actividad del grupo (nuevos miembros, cambios)
- **Tests del Patrón Observer**: Implementar tests unitarios que validen el comportamiento del patrón Observer usando `jest.spyOn()` para rastrear emisiones de eventos
- **Integración con ChatSessionManager**: Extender el singleton `ChatSessionManager` para rastrear estados de presencia y actividad
- **Diagramas Arquitectónicos**: Crear diagramas que visualicen el flujo Observer: Sujeto (MessagesGateway) → Observadores (Clientes WebSocket conectados)

## Capabilities

### New Capabilities
- `real-time-message-observation`: Handlers WebSocket especializados para observación avanzada de mensajes (lectura, presencia, actividad)
- `observer-pattern-documentation`: Documentación técnica del patrón Observer implementado en el sistema de chat

### Modified Capabilities
- `websocket-chat-messaging`: Extensión de handlers existentes con nuevos eventos de observación sin romper funcionalidad actual

## Impact

**Código Afectado**:
- `Uniconnect-Backend-Core/src/messages/messages.gateway.ts` - Agregar nuevos handlers `@SubscribeMessage()`
- `Uniconnect-Backend-Core/src/messages/managers/chat-session.manager.ts` - Extender con rastreo de presencia
- `Uniconnect-Backend-Core/src/messages/dto/websocket-message.dto.ts` - Nuevos DTOs para eventos de observación

**Tests Nuevos**:
- `Uniconnect-Backend-Core/src/messages/__tests__/messages.gateway.observer.spec.ts` - Tests del patrón Observer

**Documentación Nueva**:
- `openspec/changes/us-o02-observer-real-time-messages/docs/observer-pattern.md` - Explicación del patrón
- `openspec/changes/us-o02-observer-real-time-messages/docs/architecture-diagrams.md` - Diagramas de flujo

**Sin Cambios de Schema**: No se requieren cambios en Prisma schema ni migraciones de base de datos

**Compatibilidad**: Todos los cambios son aditivos, no hay breaking changes. Los clientes existentes continúan funcionando sin modificaciones.
