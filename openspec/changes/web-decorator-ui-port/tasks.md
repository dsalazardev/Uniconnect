## 1. BaseMessage — Parseo y resaltado de @menciones

- [x] 1.1 Crear `Frontend-web/src/features/messages/components/BaseMessage.tsx` portando `parseMentions()` y lógica de resaltado desde mobile
- [x] 1.2 Crear `Frontend-web/src/features/messages/components/BaseMessage.module.css` con estilos para texto normal, texto propio, texto ajeno, y mención resaltada (`#38BDF8`, fontWeight 700)

## 2. WithMentions — Borde de acento en burbuja mencionada

- [x] 2.1 Crear `Frontend-web/src/features/messages/components/WithMentions.tsx` portando `containsMention()` y lógica de borde + icono `@` desde mobile
- [x] 2.2 Crear `Frontend-web/src/features/messages/components/WithMentions.module.css` con estilos para wrapper, acento lateral, y layout flex

## 3. WithFileAttachment — Iconos por tipo MIME

- [x] 3.1 Crear `Frontend-web/src/features/messages/components/WithFileAttachment.tsx` portando `getFileIcon()` y lógica de renderizado por MIME desde mobile, adaptando `Ionicons` a `lucide-react`
- [x] 3.2 Crear `Frontend-web/src/features/messages/components/WithFileAttachment.module.css` con estilos para imagen (thumbnail con overlay), documento (row con icono + nombre + tamaño), y colores por tipo

## 4. MessageBubble — Componente orquestador

- [x] 4.1 Crear `Frontend-web/src/features/messages/components/MessageBubble.tsx` portando la lógica de orquestación de decoradores desde mobile (WithMentions > WithFileAttachment > BaseMessage)
- [x] 4.2 Crear `Frontend-web/src/features/messages/components/MessageBubble.module.css` con estilos de burbuja (colores propio/ajeno, bordes redondeados, padding)
- [x] 4.3 Agregar sender info (avatar, nombre) cuando `showSenderInfo` es true
- [x] 4.4 Agregar footer (timestamp + badge "editado")

## 5. Refactor MessageList — Usar MessageBubble

- [x] 5.1 Reemplazar renderizado inline de burbuja en `MessageList.tsx` por el nuevo componente `MessageBubble`
- [x] 5.2 Mapear props de Message (currentUserId, isOwnMessage, showSenderInfo, etc.) a MessageBubble
- [x] 5.3 Preservar el menú de acciones (editar/eliminar) como props `onEdit`/`onDelete`
- [x] 5.4 Verificar que `flex-direction: column-reverse` y scroll automático sigan funcionando

## 6. Mention Notification — Notificación navegable

- [x] 6.1 En `useChat.ts`, extender el handler `handleMention` para crear notificación en `notificationsStore.setUnreadCount()` + toast con botón "Ir al chat"
- [x] 6.2 Crear notificación persistente vía `notificationsStore` con tipo `mention` y `related_entity_id` = groupId
- [x] 6.3 Agregar navegación a `/messages/groups/{id_group}` al hacer clic en el toast
- [x] 6.4 Verificar que el evento `message:mention` del backend tiene el formato correcto (id_message, mentioned_user_id, sender_name, text_content, id_group)

## 7. Emoji Picker — Selector de emojis en el input

- [ ] 7.1 Agregar botón de emoji (smiley) al lado del input en `MessageInput.tsx`
- [ ] 7.2 Crear emoji picker inline con grid de 56 emojis populares (portar `POPULAR_EMOJIS` de mobile)
- [ ] 7.3 Implementar lógica de inserción de emoji en el cursor position del textarea
- [ ] 7.4 Crear estilos CSS para el grid de emojis (5 columnas, hover effect)

## 8. FilePickerModal — Mejora de previsualización

- [ ] 8.1 Agregar vista previa de imágenes usando `URL.createObjectURL()` en el `FilePickerModal` web
- [ ] 8.2 Mostrar thumbnail de imagen seleccionada antes de subir (igual que mobile)
- [ ] 8.3 Mejorar lista de archivos seleccionados con icono por tipo (imagen vs documento genérico)

## 9. Testing

- [ ] 9.1 Escribir tests para `BaseMessage.tsx`: parseo de menciones, render condicional, múltiples menciones
- [ ] 9.2 Escribir tests para `MessageBubble.tsx`: orquestación de decoradores, estilos propio/ajeno, sender info
- [ ] 9.3 Escribir tests para `mention-notification` handler: creación de notificación, navegación, ignorar otros usuarios
- [ ] 9.4 Ejecutar `npm run test:web` y verificar que no hay regresiones
- [ ] 9.5 Ejecutar `npx tsc --noEmit` en Frontend-web y shared para verificar tipos
