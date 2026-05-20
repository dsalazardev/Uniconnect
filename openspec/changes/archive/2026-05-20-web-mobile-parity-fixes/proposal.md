## Why

Frontend-web tiene 4 brechas críticas de paridad con Frontend-mobile que degradan la experiencia de usuario: la lista de cursos no se actualiza tras mutaciones, los chats privados se renderizan como grupos sin distinción de UI, los dueños de grupos no pueden salir por falta de flujo de transferencia, y el badge de notificaciones usa estilo incorrecto. Estos problemas fueron identificados durante un análisis comparativo profundo del código y deben cerrarse para alcanzar paridad funcional.

## What Changes

- **Reactivdad de Cursos**: Unificar las `queryKey` de React Query entre `useProfile` (`['my-courses']`) y `useStudentCourses` (`['courses']`) para que las mutaciones (agregar/eliminar/actualizar curso) invaliden la caché correcta y `ProfileScreen` reaccione sin recarga manual.
- **Dualidad de Chats (DM vs Grupo)**: En `GroupDetail.tsx`, detectar `is_direct_message` para adaptar la UI: título con nombre del otro usuario, ocultar lista de miembros y panel admin, y navegar correctamente desde `useDirectMessage.ts` usando React Router.
- **Transferencia de Propiedad**: Permitir que el dueño vea el botón "Salir". Al hacer click, abrir un modal para elegir nuevo dueño antes de salir. Implementar `PendingTransferOwnerBanner` que bloquee la salida mientras `pending_owner_id` esté activo, replicando el flujo de Mobile (`TransferOwnershipModal`).
- **Notification Badge (YouTube Style)**: Reemplazar el badge inline dorado del navbar por el componente `NotificationBadge.tsx` existente, cambiar color a rojo (`#DC2626`), posicionarlo como círculo pequeño en esquina superior derecha del icono de campana, y remover el texto "Notificaciones" del navbar para un diseño compacto tipo YouTube.

## Capabilities

### New Capabilities
- `web-course-reactivity`: Sincronización de invalidación de caché React Query para operaciones de cursos en el frontend web.
- `web-chat-duality`: Detección y renderizado condicional de chats directos (`is_direct_message`) vs grupos en la vista de detalle.
- `web-ownership-transfer`: Flujo completo de transferencia de propiedad de grupo en web, incluyendo modal de selección de candidato y banner de estado pendiente.
- `web-notification-badge`: Badge de notificaciones no leídas con estilo visual tipo YouTube (rojo, compacto, sobre icono).

### Modified Capabilities
- (none)

## Impact

- **Frontend-web**: `ProfileScreen.tsx`, `useStudentCourses.ts`, `useProfile.ts`, `GroupDetail.tsx`, `useDirectMessage.ts`, `GroupAdminPanel.tsx`, `Layout.tsx`, `NotificationBadge.tsx`, y nuevos componentes CSS modules.
- **Sin impacto en Backend**: Todos los cambios son frontend puro.
- **Sin impacto en Frontend-mobile**: Los cambios replican la lógica existente de Mobile en Web sin modificar Mobile.
