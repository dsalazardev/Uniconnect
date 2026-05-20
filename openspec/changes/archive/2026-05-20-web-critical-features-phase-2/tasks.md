## 1. Onboarding Routing (P0)

- [x] 1.1 Registrar ruta `/onboarding` en `router.tsx` que renderice `OnboardingScreen`
- [x] 1.2 Agregar guard condicional: si `needsOnboarding === false`, redirigir a `/events`
- [x] 1.3 Verificar que `OnboardingScreen` no use componentes nativos de Expo incompatibles con web
- [ ] 1.4 Probar flujo: login → onboarding → completar → redirección a `/events`

## 2. Group Admin Panel Integration (P0)

- [x] 2.1 Agregar export de `GroupAdminPanel` en `features/groups/components/index.ts`
- [x] 2.2 Importar y renderizar `GroupAdminPanel` en `GroupDetail.tsx` cuando `isOwner && !isDirectMessage`
- [x] 2.3 Pasar `groupId`, `memberships`, `ownerId` y `canManage` como props
- [x] 2.4 Verificar que `GroupAdminPanel` recarga datos tras aceptar/rechazar solicitudes
- [ ] 2.5 Probar: owner ve panel con solicitudes y miembros; miembro normal no ve panel

## 3. Group Edit Modal (P0)

- [x] 3.1 Reemplazar `console.log` stub en `GroupsPage.tsx` por apertura de `EditGroupModal`
- [x] 3.2 Importar `EditGroupModal` y agregar estado `editingGroup`
- [x] 3.3 Implementar `handleSaveEdit` que llame a `updateGroup` con los datos del modal
- [ ] 3.4 Probar flujo: click editar → modal abierto → guardar → grupo actualizado en lista

## 4. Notification Navigation (P1)

- [x] 4.1 Implementar `handleNotificationPress` en `NotificationCenter.tsx` o `useUserNotifications.ts`
- [x] 4.2 Mapear `notification_type` a rutas: `GROUP_INVITATION` → `/groups/:id`, `EVENT_REMINDER` → `/events/:id`, `MESSAGE` → `/chat/:id`
- [x] 4.3 Usar `useNavigate()` para redirigir al usuario
- [x] 4.4 Marcar notificación como leída al navegar
- [ ] 4.5 Probar: tocar notificación → navegación correcta + marca como leída

## 5. Connections Accepted List (P1)

- [x] 5.1 Descomentar y activar endpoint de `myConnections` en `useConnections.ts`
- [x] 5.2 Verificar endpoint backend (posiblemente `GET /connections/accepted`)
- [x] 5.3 Agregar sección "Mis Amigos" en `ConnectionList.tsx` usando los datos de conexiones aceptadas
- [x] 5.4 Probar: usuario con amigos aceptados ve lista; usuario sin amigos ve empty state

## 6. Message Edit/Delete (P1)

- [x] 6.1 Agregar botón de "more actions" (tres puntos) en mensajes propios dentro de `MessageList` o `MessageBubble`
- [x] 6.2 Implementar menú dropdown con opciones "Editar" y "Eliminar"
- [x] 6.3 Implementar modo edición inline: input reemplaza el texto del mensaje, botón guardar
- [x] 6.4 Implementar confirmación antes de eliminar (usar `ConfirmModal` existente)
- [ ] 6.5 Probar: editar mensaje → texto cambia; eliminar mensaje → desaparece de la lista

## 7. Chat File Upload (P1)

- [x] 7.1 Integrar `FileUpload` component en `MessageInput.tsx` (botón de paperclip)
- [x] 7.2 Abrir `FilePickerModal` al hacer click en paperclip
- [x] 7.3 Implementar flujo: seleccionar archivo → upload vía `filesService` → enviar mensaje con `attachments`
- [ ] 7.4 Probar: adjuntar imagen → aparece en chat → descargar funciona

## 8. Event Date Filters (P2)

- [x] 8.1 Agregar `<input type="date">` para `startDate` y `endDate` en `EventFilters.tsx`
- [x] 8.2 Conectar inputs al estado de filtros del `EventsStore`
- [x] 8.3 Asegurar que `loadEvents` envíe las fechas como parámetros al backend
- [ ] 8.4 Probar: seleccionar fecha → lista se filtra → limpiar → lista vuelve a mostrar todos
