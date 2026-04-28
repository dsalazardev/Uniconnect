# Proposal: US-D01 - Decorator Pattern para Mensajes del Chat Grupal

## Why

Los mensajes del chat actualmente solo soportan texto plano. Necesitamos agregar capacidades modulares (archivos, menciones, reacciones) sin modificar la clase base del mensaje. El patrón Decorator permite componer estas capacidades dinámicamente, manteniendo el principio Open/Closed y facilitando la extensibilidad futura.

## What Changes

- Crear interfaz `IMensaje` con métodos `getContenido()`, `getMetadata()`, `render()` en `src/messages/domain/decorator/`
- Implementar `MensajeBase` como clase concreta que implementa `IMensaje` con texto plano, userId y timestamp
- Crear clase abstracta `MensajeDecorator` que implementa `IMensaje` y delega al componente envuelto
- Implementar 3 decoradores concretos:
  - `MensajeConArchivo`: agrega url, mimeType, tamaño del archivo
  - `MensajeConMencion`: agrega array de userIds mencionados y modifica render() para resaltarlos
  - `MensajeConReaccion`: agrega mapa de reacciones `{emoji, count, users[]}`
- Extender `MessageDto` con campos opcionales: `mentions`, `files`, `reactions`, `rendered_content`
- Actualizar `MessagesService.applyDecorators()` para instanciar la cadena de decoradores y generar `rendered_content` (JSON estructurado)
- Agregar campo `rendered_content` (TEXT) al modelo `message` en Prisma schema
- Documentar patrón con diagrama UML en `src/messages/domain/decorator/README.md`

## Capabilities

### New Capabilities
- `message-decorator-pattern`: Implementación del patrón Decorator para mensajes del chat con soporte para archivos, menciones y reacciones componibles

### Modified Capabilities
<!-- No existing capabilities are being modified at the requirements level -->

## Impact

**Código afectado**:
- `src/messages/application/messages.service.ts` — método `applyDecorators()` (actualmente placeholder)
- `src/messages/dto/message.dto.ts` — extensión con 4 campos nuevos
- `prisma/schema/message.prisma` — agregar campo `rendered_content`

**Base de datos**:
- Migración Prisma para agregar columna `rendered_content TEXT` a tabla `message`

**Compatibilidad**:
- ✅ Compatible con patrón Observer existente (US-O02)
- ✅ No rompe flujo actual de mensajería
- ✅ Campos opcionales, retrocompatible con mensajes sin decoradores

**Testing**:
- Tests unitarios para cada decorador concreto
- Tests de composición (archivo + menciones simultáneos)
- Tests de integración con `MessagesService.applyDecorators()`
