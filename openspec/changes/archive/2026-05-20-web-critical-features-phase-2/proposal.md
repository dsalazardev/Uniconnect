## Why

Tras completar la paridad de UI entre Mobile y Web (Phase 1), una auditoría exhaustiva identificó 11 brechas funcionales críticas (P0/P1) donde Web tiene componentes huérfanos, stubs, o features completamente ausentes. Usuarios en Web están bloqueados: no pueden completar onboarding, administrar sus grupos como owner, ni navegar desde notificaciones. Este change cierra las brechas de funcionalidad esencial para alcanzar paridad real.

## What Changes

- **Onboarding Router**: Registrar `OnboardingScreen` en `router.tsx` con guard de autenticación para que usuarios nuevos puedan completar registro.
- **Group Admin Panel Integración**: Exportar e integrar `GroupAdminPanel` en `GroupDetail.tsx` para owners (pending requests, member removal, admin promotion).
- **Group Edit Modal**: Reemplazar `console.log` stub en `GroupsPage.tsx` por apertura real de `EditGroupModal`.
- **Notification Navigation**: Implementar `handlePress` en `NotificationCenter` para navegar a `/groups/:id`, `/events/:id`, `/chat/:id` según `notification_type`.
- **Connections Accepted List**: Descomentar y activar el endpoint de `myConnections` en `useConnections.ts`; crear pestaña o sección de "Mis Amigos" en `ConnectionList`.
- **Message Edit/Delete UI**: Agregar botones de editar/eliminar en `MessageList`/`MessageBubble` usando hooks `editMessage`/`deleteMessage` ya existentes.
- **Chat File Upload Wiring**: Conectar `FileUpload` y `FilePickerModal` a `MessageInput` para adjuntar archivos.
- **Event Date Filter Controls**: Agregar `<input type="date">` a `EventFilters` para que los filtros de fecha sean funcionales.

## Capabilities

### New Capabilities
- `web-onboarding-routing`: Enrutamiento condicional de onboarding post-login.
- `web-group-admin-integration`: Integración del panel de administración de grupos en la vista de detalle.
- `web-notification-navigation`: Navegación contextual desde notificaciones push/popover a rutas internas.
- `web-connections-accepted-list`: Listado de conexiones aceptadas (mis amigos) en la web.
- `web-message-edit-delete`: UI para editar y eliminar mensajes en el chat.
- `web-chat-file-upload`: Adjuntar archivos desde el input de mensajes.
- `web-event-date-filters`: Controles de fecha funcionales en filtros de eventos.

### Modified Capabilities
- (none)

## Impact

- **Frontend-web**: `router.tsx`, `GroupDetail.tsx`, `GroupsPage.tsx`, `NotificationCenter.tsx`, `useConnections.ts`, `ConnectionList.tsx`, `MessageList.tsx`, `MessageInput.tsx`, `EventFilters.tsx`, `useUserNotifications.ts`, y múltiples CSS modules.
- **Sin impacto en Backend**: Solo se consumen endpoints existentes.
- **Sin impacto en Frontend-mobile**: Cambios exclusivos de Web.
