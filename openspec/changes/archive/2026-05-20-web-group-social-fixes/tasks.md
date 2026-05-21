## 1. Fix Horizontal Scrollbar en Chat

- [x] 1.1 Agregar `overflow-x: hidden` a `.messagesContainer` en `MessageList.module.css`

## 2. Fix ConnectionRequest: window.alert → showToast

- [x] 2.1 Reemplazar `window.alert()` por `showToast.success/error` en `ConnectionRequest.tsx`
- [x] 2.2 Verificar que `showToast` esté importado correctamente

## 3. Hacer Admin a Miembro

- [x] 3.1 Importar y usar `useMakeMemberAdmin` en `GroupAdminPanel.tsx`
- [x] 3.2 Agregar botón "Hacer admin" por cada miembro no-admin no-owner
- [x] 3.3 Agregar `ConfirmModal` antes de ejecutar la promoción

## 4. Invitar Miembros a Grupo (Envío)

- [x] 4.1 Agregar botón "Invitar" en `GroupDetail.tsx` (visible para owner/admin)
- [x] 4.2 Agregar botón "Invitar" en `GroupAdminPanel.tsx`
- [x] 4.3 Conectar ambos botones para abrir `InviteMemberModal` con el hook de invitación
- [x] 4.4 Verificar que al enviar invitación se muestre toast de éxito

## 5. Invitaciones Recibidas (Aceptar/Rechazar)

- [x] 5.1 Agregar tercera pestaña "Invitaciones" en `GroupsPage.tsx`
- [x] 5.2 Crear componente `InvitationCard.tsx` o inline list con datos de grupo + invitador
- [x] 5.3 Implementar botones Aceptar/Rechazar conectados a `useGroupInvitations().respondToInvitation`
- [x] 5.4 Agregar `ConfirmModal` antes de rechazar
- [x] 5.5 Mostrar contador de invitaciones pendientes en la pestaña

## 6. Transferencia de Propiedad (Candidato)

- [x] 6.1 Crear componente `TransferInvitationBanner.tsx` para candidatos
- [x] 6.2 Renderizar banner en `GroupDetail.tsx` cuando `pending_owner_id === currentUserId`
- [x] 6.3 Implementar botón "Aceptar" → `acceptOwnershipTransfer(groupId)`
- [x] 6.4 Implementar botón "Rechazar" → `declineOwnershipTransfer(groupId)`

## 7. Cancelar Transferencia de Propiedad (Owner)

- [x] 7.1 Agregar botón "Cancelar transferencia" en `PendingTransferOwnerBanner.tsx`
- [x] 7.2 Conectar a `groupsService.cancelOwnershipTransfer(groupId)`

## 8. DM desde Lista de Miembros

- [x] 8.1 Agregar prop/evento `onDirectMessage` en `MemberList.tsx`
- [x] 8.2 Renderizar botón MessageCircle por cada miembro (excepto usuario actual)
- [x] 8.3 Implementar handler en `GroupDetail.tsx` usando `useDirectMessage`

## 9. Confirmaciones Faltantes

- [x] 9.1 Agregar `ConfirmModal` antes de enviar solicitud de unión en `GroupsPage.tsx`
- [x] 9.2 Agregar `ConfirmModal` antes de rechazar solicitud de unión en `GroupAdminPanel.tsx`
