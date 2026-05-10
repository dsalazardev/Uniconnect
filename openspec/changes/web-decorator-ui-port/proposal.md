## Why

Frontend-web tiene una brecha de UX significativa vs Frontend-mobile en el chat en tiempo real: los mensajes con menciones `@usuario` se renderizan como texto plano, los archivos adjuntos usan un icono genérico, y no existe un componente MessageBubble extraíble con decorators. Además, cuando alguien menciona a un usuario con `@`, no recibe notificación que lo lleve al chat. Esto reduce la capacidad de colaboración del producto.

## What Changes

- **Portar BaseMessage.tsx** con `parseMentions()` desde mobile a web: resalta texto `@usuario` en color `#38BDF8` y fontWeight 700
- **Portar WithMentions.tsx**: agrega borde de acento azul + icono `@` a la burbuja cuando el usuario actual es mencionado
- **Portar WithFileAttachment.tsx**: renderiza archivos con íconos específicos por tipo MIME (PDF, Word, Excel, ZIP, video, imagen) en lugar del `FileText` genérico actual
- **Crear MessageBubble.tsx** en web: extraer la burbuja del MessageList.tsx inline a un componente propio que orqueste los 3 decoradores
- **Implementar notificación de mención navegable**: cuando un usuario es mencionado con `@`, el backend ya emite `message:mention` vía WebSocket (US-O02). El frontend web debe interceptarlo, crear una notificación local, y al hacer clic navegar al grupo específico donde ocurrió la mención
- **Agregar emoji picker** al chat web (mobile ya lo tiene en ChatScreen.tsx)
- **Mejorar FilePickerModal** web para soportar previsualización de imágenes (equivalente a mobile)
- **No se porta**: eventos `user:presence`, `group:activity`, `message:read` (baja prioridad, ningún frontend los consume)
- **No se porta**: `rendered_content` del backend (ningún frontend lo usa, la implementación cliente-side es suficiente)

## Capabilities

### New Capabilities
- `mention-highlight`: Parseo y resaltado visual de menciones `@usuario` en el texto del mensaje
- `mention-notification`: Notificaciones push/locales cuando un usuario es mencionado, con navegación directa al chat del grupo
- `file-attachment-ui`: Renderizado de archivos adjuntos con íconos por tipo MIME, vista previa de imágenes y descarga
- `message-bubble-component`: Componente MessageBubble extraíble que orquesta los decoradores (BaseMessage + WithMentions + WithFileAttachment)
- `emoji-picker`: Selector de emojis integrado en el input de mensajes del chat web

### Modified Capabilities
- `<ninguno>`: No hay cambios en requisitos de capacidades existentes

## Impact

- **Frontend-web/src/features/messages/components/**: Nuevos archivos `BaseMessage.tsx`, `WithMentions.tsx`, `WithFileAttachment.tsx`, `MessageBubble.tsx`, `MessageBubble.module.css`
- **Frontend-web/src/features/messages/components/MessageList.tsx**: Refactor para usar MessageBubble en lugar de renderizado inline
- **Frontend-web/src/features/messages/components/MessageInput.tsx**: Integración de emoji picker
- **Frontend-web/src/features/messages/components/FilePickerModal.tsx**: Mejora de previsualización de imágenes
- **Frontend-web/src/features/messages/hooks/useChat.ts**: Manejo de evento `message:mention` con notificación navegable
- **Frontend-web/src/features/messages/types/index.ts**: Si es necesario, extender tipos
- **Frontend/shared/src/types/messages.ts**: Sin cambios (no se porta rendered_content)
- Sin cambios en backend, ni en mobile, ni en shared package
