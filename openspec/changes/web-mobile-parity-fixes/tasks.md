## 1. Reactividad de Cursos

- [x] 1.1 Unificar invalidación de caché: Agregar `queryClient.invalidateQueries({ queryKey: ['my-courses'] })` en `onSuccess` de `addCourseMutation`, `updateCourseMutation` y `deleteCourseMutation` en `useStudentCourses.ts`
- [x] 1.2 Unificar invalidación de caché: Agregar `queryClient.invalidateQueries({ queryKey: ['courses'] })` en `onSuccess` de `updateProfileMutation` en `useProfile.ts` (si el perfil modifica cursos indirectamente)
- [x] 1.3 Verificar que `ProfileScreen.tsx` renderice `courses` desde `useStudentCourses` en lugar de derivar `displayCourses` desde `profile?.courses`
- [x] 1.4 Probar flujo manual: agregar un curso desde `ProfileScreen` y confirmar que la lista se actualiza sin recargar la página
- [x] 1.5 Probar flujo manual: eliminar un curso desde `ProfileScreen` y confirmar que desaparece inmediatamente

## 2. Notification Badge (YouTube Style)

- [x] 2.1 Modificar `NotificationBadge.module.css`: cambiar `background-color` de `.badge` de `#d9b97e` a `#DC2626` (rojo), y `.badgeText` a `color: #fff`
- [x] 2.2 Modificar `Layout.tsx`: reemplazar el badge inline por el componente `<NotificationBadge />` existente dentro del botón de notificaciones
- [x] 2.3 Modificar `Layout.tsx`: remover el texto "Notificaciones" del `<button>`, dejando solo el icono `Bell` + badge, manteniendo `aria-label="Notificaciones"`
- [x] 2.4 Ajustar `Layout.module.css`: remover estilos de `.badge` inline obsoletos si quedan sin uso
- [x] 2.5 Probar visualmente: badge rojo aparece sobre campana cuando `unreadCount > 0`, desaparece cuando es 0

## 3. Dualidad de Chats (DM vs Grupo)

- [x] 3.1 Modificar `GroupDetail.tsx`: leer `groupInfo.is_direct_message` y `groupInfo.memberships` para derivar `isDirectMessage` y `otherUserName`
- [x] 3.2 Modificar `GroupDetail.tsx`: condicionar el título del header (`headerTitle`) para mostrar nombre del otro usuario si es DM, o nombre del grupo si no
- [x] 3.3 Modificar `GroupDetail.tsx`: condicionar renderizado de la sección "Miembros" para NO mostrarse cuando `isDirectMessage` es true
- [x] 3.4 Modificar `useDirectMessage.ts`: completar navegación con `const navigate = useNavigate()` y `navigate(\`/groups/${groupId}\`)` tras recibir respuesta exitosa
- [x] 3.5 Verificar que `useChat` y `MessageList` funcionan correctamente tanto en DM como en grupo (no debería requerir cambios, solo validar)

## 4. Transferencia de Propiedad

- [x] 4.1 Modificar `GroupDetail.tsx`: cambiar condición del botón "Salir" de `isMember && !isOwner` a `isMember` (mostrar para owner también)
- [x] 4.2 Crear componente `TransferOwnershipModal.tsx` en `features/groups/components/` con lista de miembros elegibles (radio buttons), info de contexto, y botones Cancelar/Proponer
- [x] 4.3 Crear CSS module `TransferOwnershipModal.module.css` con estilos acordes al diseño oscuro de la app
- [x] 4.4 Modificar `GroupDetail.tsx`: al hacer click en "Salir", si `isOwner && members.length > 1`, abrir `TransferOwnershipModal` en lugar de `ConfirmModal`
- [x] 4.5 Modificar `GroupDetail.tsx`: si `isOwner && members.length <= 1`, ejecutar `leaveGroup` directamente sin modal
- [x] 4.6 Crear componente `PendingTransferOwnerBanner.tsx` en `features/groups/components/` para mostrar mensaje de transferencia pendiente
- [x] 4.7 Modificar `GroupDetail.tsx`: renderizar `PendingTransferOwnerBanner` cuando `groupInfo.pending_owner_id` exista y sea no nulo
- [x] 4.8 Modificar `GroupDetail.tsx`: deshabilitar botón "Salir" cuando `groupInfo.pending_owner_id` esté presente
- [x] 4.9 Integrar con `useTransferOwnership.ts` existente: usar `requestOwnershipTransfer` (si existe en web) o `transferOwnership` como fallback para enviar solicitud
- [x] 4.10 Probar flujo: owner intenta salir → elige miembro → confirma → banner aparece → botón salir bloqueado
