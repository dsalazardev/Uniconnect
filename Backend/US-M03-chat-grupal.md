## BACKEND

### 1. Título: Propagar codigoError en el Gateway WebSocket al rechazar mensajes

**Prompt Sugerido:**
En `Backend/src/messages/messages.gateway.ts`, el bloque catch del handler `handleMessage` (y handlers similares de edición) captura los errores de la cadena de validación pero sólo retorna el campo `error` con el mensaje legible. El campo `codigoError` (ej. `MSG_ADJUNTO_TAMANO_EXCEDIDO`, `MSG_CONTENIDO_INAPROPIADO`) que genera cada handler de la Chain of Responsibility se pierde en ese punto, por lo que el cliente móvil no puede distinguir el tipo de error.

Implementa lo siguiente:

1. En el bloque catch de `handleMessage` (y de cualquier handler que llame a `messagesService.create()`), extrae el `codigoError` de la respuesta de la excepción. Si es una `BadRequestException` de NestJS, la respuesta está en `error.getResponse()`.
2. Retorna desde el handler WebSocket un objeto con la forma:
   ```typescript
   { error: error.message, codigoError: resultado.codigoError ?? 'ERROR_DESCONOCIDO' }
   ```
3. Actualiza la interface de respuesta de error del gateway si existe, o agrega el campo `codigoError?: string` a la estructura de retorno.
4. No modificar la cadena de validación ni los handlers individuales, solo el punto de captura en el gateway.
5. No tocar el chat ni el frontend.

**Commit:**
`fix(messages-gateway): propagar codigoError al cliente WebSocket en errores de validación`

**Estimación:**
1 hora

---

### 2. Título: Agregar parámetro `since` al endpoint de historial para sincronización post-reconexión

**Prompt Sugerido:**
En `Backend/src/messages/messages.controller.ts`, el endpoint `GET /messages/group/:id_group/recent` acepta `limit` y `beforeId` (cursor hacia atrás) pero no tiene forma de pedir mensajes **posteriores** a un timestamp dado. Esto impide sincronizar los mensajes perdidos durante una desconexión WebSocket.

Implementa lo siguiente:

1. En el controller, agrega el query param opcional `since` de tipo número (Unix timestamp en ms) al endpoint existente, usando `@Query('since', new ParseIntPipe({ optional: true })) since?: number`.
2. En `Backend/src/messages/message.repository.ts`, en el método `findRecentByGroup()`, agrega la condición:
   ```typescript
   if (since) {
     where.send_at = { gt: new Date(since) };
   }
   ```
   cuando se reciba `since`. En este caso, el orden debe ser `ASC` (no DESC) y no se necesita revertir el array, ya que se quieren los mensajes nuevos en orden cronológico.
3. El campo `hasMore` en la respuesta debe seguir funcionando correctamente.
4. No modificar el comportamiento existente cuando `since` no se envía (paginación hacia atrás con `beforeId` sigue igual).
5. No tocar frontend ni el sistema de WebSocket.

**Commit:**
`feat(messages): agregar parámetro since al endpoint de historial para descarga de mensajes perdidos`

**Estimación:**
2 horas

---

## FRONTEND

### 3. Título: Mostrar codigoError específico en la UI cuando el backend rechaza un mensaje

**Prompt Sugerido:**
En `Frontend/Frontend-mobile/src/features/messages/hooks/useChat.ts`, la función `sendMessage()` envía el mensaje vía WebSocket pero no maneja la respuesta de error del gateway. Después de los cambios del backend (tarea 1), el gateway retornará `{ error: string, codigoError: string }` cuando un mensaje viola una regla.

Implementa lo siguiente:

1. En `useChat.ts`, en la lógica de envío de mensaje vía `websocketService.sendMessage()`, agrega un listener o maneja la respuesta/acknowledgement del evento WebSocket que puede traer `{ error, codigoError }`.
2. Mapea los códigos de error a mensajes en español comprensibles para el usuario:
   - `MSG_TAMANO_EXCEDIDO` → "El mensaje es demasiado largo."
   - `MSG_CONTENIDO_VACIO` → "El mensaje no puede estar vacío."
   - `MSG_CONTENIDO_INAPROPIADO` → "El mensaje contiene contenido inapropiado."
   - `MSG_MENCIONES_EXCEDIDAS` → "No puedes mencionar a más de 10 personas."
   - `MSG_MENCIONES_INVALIDAS` → "Una o más menciones no son válidas."
   - `MSG_PERMISOS_INSUFICIENTES` → "No tienes permiso para enviar mensajes en este grupo."
   - `MSG_ADJUNTO_TAMANO_EXCEDIDO` → "El archivo supera el límite de 10 MB."
   - `MSG_ADJUNTO_TIPO_NO_PERMITIDO` → "Tipo de archivo no permitido."
   - Cualquier otro código → Mostrar el mensaje genérico del backend.
3. Muestra el mensaje al usuario usando el Toast/Alert que ya usa el resto de la app (patrón existente en `ChatScreen.tsx`).
4. No modificar `websocket.service.ts` ni ningún otro componente fuera de `useChat.ts` y opcionalmente `ChatScreen.tsx` si necesita un estado de error visible.

**Commit:**
`feat(chat-mobile): mostrar mensaje de error específico por codigoError al fallar validación de mensaje`

**Estimación:**
2 horas

---

### 4. Título: Registrar callback de reconexión en useChat para descargar mensajes perdidos

**Prompt Sugerido:**
En `Frontend/Frontend-mobile/src/features/messages/hooks/useChat.ts`, la infraestructura de reconexión WebSocket en `websocket.service.ts` ya tiene el método `setOnReconnectCallback(callback)` y lo invoca en el evento `connect` (post-reconexión). Sin embargo, `useChat` nunca registra ese callback, por lo que al recuperar conectividad no se descargan los mensajes enviados durante la desconexión.

Implementa lo siguiente:

1. Agrega un `ref` llamado `lastMessageTimestampRef` en `useChat.ts` que guarde el `send_at` (como Unix timestamp en ms) del mensaje más reciente en el estado. Actualízalo cada vez que lleguen nuevos mensajes (tanto del historial inicial como de los eventos WebSocket `message:new`).
2. Crea una función `loadMissedMessages()` dentro del hook que llame a `messagesService.getRecentMessages(groupId, 50, { since: lastMessageTimestampRef.current })` cuando `lastMessageTimestampRef.current` tenga valor. Los mensajes recibidos deben agregarse al estado evitando duplicados (filtrar por `id_message`).
3. En el `useEffect` que inicializa el WebSocket, después de autenticar, registra el callback:
   ```typescript
   websocketService.setOnReconnectCallback(() => {
     loadMissedMessages();
   });
   ```
4. Limpia el callback en el cleanup del `useEffect` (pasar `null` o función vacía).
5. El endpoint backend necesita el parámetro `since` (tarea 2 de backend). Asegúrate de que el servicio `messagesService.getRecentMessages()` pueda recibir y pasar ese parámetro.
6. No modificar `websocket.service.ts` ni `ChatScreen.tsx`.

**Commit:**
`feat(chat-mobile): sincronizar mensajes perdidos durante desconexión al reconectar WebSocket`

**Estimación:**
2 horas

---

## FRONTEND WEB

### 5. Título: Mostrar codigoError específico y reemplazar alert() en el chat web

**Prompt Sugerido:**
En `Frontend/Frontend-web/src/features/messages/`, el envío de mensajes vía WebSocket no maneja la respuesta de error del gateway, y los errores de archivos usan `alert()` del navegador en lugar del sistema de Toast. Después de los cambios del backend (tarea 1), el gateway retorna `{ error: string, codigoError: string }` cuando un mensaje viola una regla.

Implementa lo siguiente:

1. En `Frontend/Frontend-web/src/features/messages/hooks/useChat.tsx`, en la función `sendMessage()`, captura la respuesta/acknowledgement del evento `message:send` de WebSocket. Si la respuesta contiene `error` o `codigoError`, muestra el mensaje correspondiente al usuario usando `showToast.error()` (de `src/lib/toast.ts`).
2. En el mismo hook o en un archivo de constantes dedicado (`src/features/messages/constants/errorCodes.ts`), crea un mapa de códigos de error a mensajes en español:
   - `MSG_TAMANO_EXCEDIDO` → "El mensaje es demasiado largo."
   - `MSG_CONTENIDO_VACIO` → "El mensaje no puede estar vacío."
   - `MSG_CONTENIDO_INAPROPIADO` → "El mensaje contiene contenido inapropiado."
   - `MSG_MENCIONES_EXCEDIDAS` → "No puedes mencionar a más de 10 personas."
   - `MSG_MENCIONES_INVALIDAS` → "Una o más menciones no son válidas."
   - `MSG_PERMISOS_INSUFICIENTES` → "No tienes permiso para enviar mensajes en este grupo."
   - `MSG_ADJUNTO_TAMANO_EXCEDIDO` → "El archivo supera el límite de 10 MB."
   - `MSG_ADJUNTO_TIPO_NO_PERMITIDO` → "Tipo de archivo no permitido."
   - Cualquier otro código → Mostrar el mensaje genérico del backend.
3. En `Frontend/Frontend-web/src/features/messages/components/MessageInput.tsx`, línea 79 aproximadamente, reemplaza el `alert('Error al subir el archivo...')` por `showToast.error('Error', 'No se pudo subir el archivo. Inténtalo de nuevo.')`.
4. No modificar `websocket.service.ts`, el gateway de backend, ni ningún otro componente ajeno al chat web.

**Commit:**
`feat(chat-web): mostrar codigoError específico y reemplazar alert() por Toast en errores del chat`

**Estimación:**
2 horas

---

### 6. Título: Sincronizar mensajes perdidos al reconectar WebSocket en el chat web

**Prompt Sugerido:**
En `Frontend/Frontend-web/src/features/messages/hooks/useChat.tsx`, el callback de reconexión ya está registrado (`setOnReconnectCallback(() => loadMessages())`), pero `loadMessages()` descarga los últimos 50 mensajes desde el inicio sin filtrar por timestamp. Esto no sincroniza eficientemente los mensajes perdidos durante la desconexión. Además, el endpoint del shared (`Frontend/shared/src/api/endpoints/messages.ts`) no incluye el parámetro `since` que el backend ya soporta.

Implementa lo siguiente:

1. En `Frontend/shared/src/api/endpoints/messages.ts`, en la función que construye la URL de `GET_RECENT_MESSAGES`, agrega soporte para el parámetro opcional `since`:
   ```typescript
   GET_RECENT_MESSAGES: (groupId: number, limit = 50, beforeId?: number, since?: number) => {
     const base = `/messages/group/${groupId}/recent?limit=${limit}`;
     if (since) return `${base}&since=${since}`;
     return beforeId ? `${base}&beforeId=${beforeId}` : base;
   }
   ```
2. En `useChat.tsx`, agrega un `ref` llamado `lastMessageTimestampRef` que guarde el `send_at` (como Unix timestamp en ms) del mensaje más reciente recibido. Actualízalo al cargar el historial inicial y cada vez que llegue un `message:new` por WebSocket.
3. Reemplaza el callback de reconexión existente para que use el timestamp guardado:
   ```typescript
   websocketService.setOnReconnectCallback(() => {
     if (lastMessageTimestampRef.current) {
       loadMissedMessages(lastMessageTimestampRef.current);
     } else {
       loadMessages();
     }
   });
   ```
4. Crea la función `loadMissedMessages(since: number)` que llame al servicio con el parámetro `since`, y agregue los mensajes recibidos al estado filtrando duplicados por `id_message`.
5. No modificar `websocket.service.ts` ni ningún componente de UI del chat web.

**Commit:**
`feat(chat-web): sincronizar mensajes perdidos durante desconexión usando parámetro since`

**Estimación:**
2 horas
