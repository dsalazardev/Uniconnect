## Why

El sistema de chat grupal actual carece de moderación automática de contenido, permitiendo que mensajes con groserías o contenido inapropiado lleguen directamente a todos los miembros del grupo. Esto puede crear un ambiente tóxico y afectar la experiencia de usuario en la plataforma educativa Uniconnect.

## What Changes

- Implementar un Custom Method Decorator `@ContentModeration()` en TypeScript para interceptar mensajes antes del procesamiento
- Crear sistema de filtrado de palabras prohibidas configurable
- Integrar el decorator con los métodos de envío de mensajes en `MessagesGateway` y `MessagesService`
- Mantener logs de moderación para auditoría y mejora del sistema
- Preservar la arquitectura existente sin modificar la lógica de negocio principal

## Capabilities

### New Capabilities
- `chat-content-moderation`: Sistema de moderación automática de contenido para mensajes de chat grupal que filtra palabras prohibidas, valida longitud de mensajes y registra actividad de moderación

### Modified Capabilities
<!-- No se modifican capabilities existentes, solo se agrega funcionalidad nueva -->

## Impact

**Código Afectado:**
- `src/messages/messages.gateway.ts` - Aplicar decorator a método `handleMessage()`
- `src/messages/messages.service.ts` - Aplicar decorator a método `create()`
- Nueva carpeta `src/messages/decorators/` con implementación del decorator

**APIs:**
- Sin cambios en endpoints REST o WebSocket existentes
- Comportamiento transparente para el frontend

**Dependencias:**
- Sin nuevas dependencias externas
- Utiliza reflection metadata de TypeScript existente

**Sistemas:**
- Logging con `UniconnectLogger` existente
- Base de datos sin cambios (opcional: tabla de logs de moderación)