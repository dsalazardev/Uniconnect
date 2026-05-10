## Why

El Frontend-web tiene funcionalidades de grupos y conexiones que están incompletas o rotas en la capa de UI. Los hooks y servicios del shared package existen, pero los componentes web nunca los llaman o nunca se renderizan. Esto deja al usuario sin poder: invitar miembros a grupos, aceptar/rechazar invitaciones, promover miembros a admin, aceptar/rechazar transferencias de propiedad, ni recibir feedback visual correcto en conexiones.

## What Changes

- **Invitar miembros a grupo**: Reactivar `InviteMemberModal` (código muerto) agregando botón "Invitar" en GroupDetail/GroupAdminPanel
- **Recibir/Responder invitaciones**: Nueva sección de invitaciones pendientes con botones Aceptar/Rechazar
- **Hacer admin a miembro**: Agregar botón "Hacer admin" en GroupAdminPanel conectado al hook `useMakeMemberAdmin` existente
- **Transferencia de propiedad (candidato)**: UI para que el candidato acepte o rechace la transferencia, y cancelación por parte del owner
- **DM desde lista de miembros**: Botón de mensaje directo en cada fila de MemberList
- **Confirmaciones faltantes**: Diálogos de confirmación antes de: enviar solicitud de unión, hacer admin, rechazar solicitud de unión
- **Fix ConnectionRequest**: Reemplazar `window.alert()` por `showToast` del sistema de notificaciones
- **Fix barra horizontal en chat**: Agregar `overflow-x: hidden` al contenedor de mensajes

## Capabilities

### New Capabilities
- `group-member-admin`: Promoción de miembros a admin, transferencia de propiedad (aceptar/rechazar/cancelar)
- `group-invitations-ui`: Envío, recepción y respuesta a invitaciones de grupo
- `group-member-actions`: DM desde lista de miembros, confirmaciones faltantes
- `chat-ui-fix`: Corrección de scroll horizontal en el contenedor de mensajes
- `connections-ui-fix`: Reemplazo de `window.alert()` por sistema de toasts

### Modified Capabilities
- *(none — no existing specs have requirement changes)*

## Impact

- **Frontend-web/src/features/groups/components/**: Modificaciones en GroupAdminPanel, GroupDetail, MemberList, InviteMemberModal. Posibles nuevos componentes para invitaciones recibidas y transferencia (candidato)
- **Frontend-web/src/features/groups/hooks/**: Los hooks existentes (`useGroupInvitations`, `useMakeMemberAdmin`, `useTransferOwnership`) ya están cableados — solo conectar en UI
- **Frontend-web/src/features/messages/components/MessageList.module.css**: 1 línea CSS
- **Frontend-web/src/features/connections/components/ConnectionRequest.tsx**: Reemplazar alertas por toasts
- No requiere cambios en backend, shared package, ni base de datos
