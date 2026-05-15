# US-W06: Mensajería privada uno a uno desde el dashboard — Tareas Pendientes

---

## FRONTEND

### 1. Título: Integrar botón "Mensaje Privado" en GroupDetail y navegación al chat privado

**Prompt Sugerido:**
En `Frontend-web/src/features/groups/components/MemberList.tsx` el botón "Mensaje Privado" ya existe con el ícono `MessageCircle`, pero espera un callback `onDirectMessage` del componente padre. En el componente contenedor `GroupDetail` (o donde se renderice `MemberList`), conecta ese callback al hook `useDirectMessage` que ya existe en `Frontend-web/src/features/groups/hooks/useDirectMessage.ts`. El hook ya llama a `groupsService.findOrCreateDirectMessage(targetUserId)` y navega a `/chat/{groupId}`. Asegúrate de:
1. Importar `useDirectMessage` en el componente que renderiza `MemberList`.
2. Pasar `onDirectMessage={handleDirectMessage}` donde `handleDirectMessage` invoca el hook con el `userId` del compañero seleccionado.
3. Mostrar el spinner de carga por usuario durante la petición (`isLoading` del hook).
4. Manejar el error 403 (no son amigos/conexión) mostrando un toast o mensaje informativo al usuario.
5. Verificar que la navegación resultante lleva a una ruta `/chat/{groupId}` con `is_direct_message: true` y que la UI del chat no muestra controles de chat grupal (lista de miembros del grupo, acciones de grupo).

**Commit:**
`feat(chat-privado): integrar botón de mensaje privado con hook useDirectMessage en GroupDetail`

**Estimación:**
3 horas

---

### 2. Título: Scroll infinito hacia atrás en MessageList para historial paginado del chat privado

**Prompt Sugerido:**
En `Frontend-web/src/features/messages/components/MessageList.tsx` actualmente solo existe auto-scroll al fondo al recibir nuevos mensajes, pero no hay carga progresiva hacia atrás. El hook `useChat.tsx` ya tiene `oldestMessageIdRef` para cursor y llama a `messagesService.getRecentMessages(groupId, limit, beforeId)`. Implementa:
1. En `MessageList.tsx`, agregar un `IntersectionObserver` o listener de scroll que detecte cuando el usuario llega al tope del contenedor.
2. Al llegar al tope, llamar a la función de carga adicional (ej. `onLoadMore()`) que el padre (`useChat`) expone, pasando `oldestMessageIdRef.current` como cursor `beforeId`.
3. En `useChat.tsx`, agregar el método `loadOlderMessages()` que llame a `messagesService.getRecentMessages(groupId, 50, oldestMessageId)` y prependa los mensajes devueltos al array existente (sin duplicados).
4. Actualizar `oldestMessageIdRef` con el id más antiguo del nuevo batch.
5. Mostrar un spinner o indicador de carga mientras se obtienen mensajes más antiguos.
6. Detener el scroll infinito cuando el servidor devuelva un array vacío (no hay más historial).
7. Este comportamiento aplica tanto para grupos como para chats privados que usan el mismo `groupId` subyacente (campo `is_direct_message: true`).

**Commit:**
`feat(chat): implementar scroll infinito hacia atrás para historial paginado en MessageList`

**Estimación:**
4 horas

---

### 3. Título: Indicador de presencia en línea del destinatario en el chat privado

**Prompt Sugerido:**
El backend ya emite el evento `user:presence` desde `messages.gateway.ts` y el `WebSocketService` en `Frontend-web/src/features/messages/services/websocket.service.ts` ya escucha `user:connected` y `user:presence`. El hook `useChat.tsx` ya tiene el estado `isConnected` actualizado en `handleUserConnected`. Implementa:
1. En `useChat.tsx`, exponer el estado de presencia del destinatario (`isRecipientOnline: boolean`) derivado del evento `user:presence` filtrando por el `userId` del destinatario del chat privado.
2. Crear un componente `PrivateChatHeader.tsx` en `Frontend-web/src/features/messages/components/` que muestre: avatar del destinatario, nombre, y un badge de estado (punto verde "En línea" / punto gris "Desconectado") usando el prop `isRecipientOnline`.
3. Renderizar `PrivateChatHeader` en la vista del chat únicamente cuando `is_direct_message === true`, sustituyendo o complementando el header grupal existente.
4. Asegurarse de que el indicador se actualiza en tiempo real al recibir eventos `user:presence` sin necesidad de recargar.

**Commit:**
`feat(chat-privado): agregar indicador de presencia en línea en el header del chat privado`

**Estimación:**
3 horas

---

## BACKEND

### 4. Título: Handler WebSocket `private:send` y extensión de CreateMessageDto para mensajes privados

**Prompt Sugerido:**
En `Backend/src/messages/messages.gateway.ts` solo existe el handler `@SubscribeMessage('message:send')` que siempre asume `id_membership`. El DTO `Backend/src/messages/dto/create-message.dto.ts` tampoco acepta `sender_id` ni `recipient_id`. El `MessageDto` (message.dto.ts) ya tiene esos campos. Implementa:
1. Extender `CreateMessageDto` para aceptar discriminación de tipo: añadir `sender_id?: number`, `recipient_id?: number` (ambos opcionales, mutuamente excluyentes con `id_membership`). Agregar validador custom o constraint `@ValidateIf` que exija `id_membership` O (`sender_id` + `recipient_id`).
2. Agregar en `messages.gateway.ts` el handler `@SubscribeMessage('private:send')` que:
   a. Extrae `sender_id`, `recipient_id`, `text_content`, `files`, `mentions` del payload.
   b. Valida que el usuario autenticado en el socket sea el `sender_id`.
   c. Llama al servicio de mensajes pasando `chat_type: 'private'`.
   d. Construye el `room_id` en formato `private-{min(s,r)}-{max(s,r)}` (consistente con `PrivateChatObserver`).
   e. El emisor debe unirse al room `private-{...}` al autenticarse (`user:connected`) si tiene conversaciones privadas activas.
3. En el método `handleUserConnected` del gateway, después de unir al usuario a rooms de grupos, recuperar sus DMs activos y unirlo también a sus rooms privados `private-{...}`.
4. Verificar que `PrivateChatObserver` (`Backend/src/messages/infrastructure/observers/private-chat.observer.ts`) se activa correctamente y emite solo a ese room.

**Commit:**
`feat(mensajes-privados): agregar handler WebSocket private:send y extender CreateMessageDto`

**Estimación:**
5 horas

---

### 5. Título: Endpoint REST de historial paginado para conversaciones privadas

**Prompt Sugerido:**
El endpoint existente `GET /messages/group/:id_group/recent` filtra por `id_group` y funciona para grupos, pero los chats privados creados con `is_direct_message: true` usan el mismo `id_group` subyacente (el campo existe en `group.prisma`). Valida si el endpoint actual puede reutilizarse directamente para DMs pasando el `groupId` del DM, o si necesita ajuste. Implementa:
1. En `Backend/src/messages/message.repository.ts`, verificar que `findRecentByGroup(groupId, limit, beforeId, since)` devuelve mensajes del grupo DM correctamente (los mensajes guardados con `is_direct_message: true` deben tener un `id_group` válido).
2. Si se guarda el mensaje con `id_group` del grupo DM, el endpoint actual ya debe funcionar. En ese caso, ajustar únicamente que el servicio al procesar `private:send` persista el mensaje asociado al `id_group` del DM (obtenido de `findOrCreateDirectMessage`).
3. Si no se usa `id_group` en mensajes privados, crear el endpoint `GET /messages/private/:userId2` que use el usuario autenticado como `userId1`, construya el room `private-{...}`, y llame a un nuevo método `findRecentByRoom(roomId, limit, beforeId)` en el repositorio.
4. En cualquier caso, garantizar paginación por cursor (`beforeId`), orden cronológico ascendente, y límite configurable (default 50).
5. Proteger el endpoint con guard de autenticación y validar que el usuario autenticado sea participante de la conversación.

**Commit:**
`feat(mensajes-privados): habilitar endpoint de historial paginado para conversaciones privadas`

**Estimación:**
4 horas

---

### 6. Título: Integrar cadena de validación US-CH01 y decoradores Sprint 3 en el flujo WebSocket privado

**Prompt Sugerido:**
Existen dos cadenas de validación con tokens distintos: `VALIDACION_CHAIN_REST_TOKEN` usado en `Backend/src/messages/messages.service.ts` (principal, invocado desde WebSocket grupal) y `VALIDACION_CHAIN_TOKEN` en `Backend/src/messages/application/messages.service.ts` (no invocado desde WebSocket). Los decoradores `FileMessageDecorator` y `MentionMessageDecorator` de `Backend/src/messages/domain/decorator/` y la cadena completa (Contenido → Tamaño → Adjunto → Menciones → Permisos) ya existen. Implementa:
1. Unificar los tokens: eliminar la duplicidad usando un único token `VALIDACION_CHAIN_TOKEN` en el módulo de mensajes. Actualizar el proveedor en `messages.module.ts` y los puntos de inyección.
2. En el handler `private:send` del gateway (creado en tarea 4), antes de persistir el mensaje, ejecutar la cadena de validación inyectada pasando el objeto de mensaje con `chat_type: 'private'`.
3. Verificar que `ValidarPermisosHandler` en `validar-permisos.handler.ts` acepta la condición `(sender_id && recipient_id > 0)` para mensajes privados (ya tiene esta lógica parcialmente, confirmar que no lanza error por ausencia de `id_membership`).
4. Aplicar los decoradores en orden: si hay `files` → aplicar `FileMessageDecorator`; si hay `mentions` → aplicar `MentionMessageDecorator`; siempre sobre la base `BaseMessage`. Reutilizar el mismo pipeline que usa el servicio de aplicación.
5. Si la cadena rechaza el mensaje (lanza excepción), emitir al socket del remitente un evento de error (`message:error`) con el mensaje de validación, sin persistir nada.

**Commit:**
`feat(mensajes-privados): integrar cadena de validación US-CH01 y decoradores Sprint 3 en flujo WebSocket privado`

**Estimación:**
4 horas

---
