## Context

El Frontend-web tiene la capa de servicios y hooks completa para grupos, invitaciones, y conexiones, pero la UI está desconectada:

- `InviteMemberModal` es código muerto — nunca se renderiza
- `useGroupInvitations`, `useMakeMemberAdmin`, `useTransferOwnership` existen pero ningún componente los llama
- `ConnectionRequest` usa `window.alert()` en vez del sistema de toasts
- El contenedor de mensajes del chat muestra barra horizontal no deseada

No hay cambios de backend, shared package, ni base de datos. Todo es UI web.

## Goals / Non-Goals

**Goals:**
- Habilitar flujo completo de invitaciones a grupo (enviar, recibir, aceptar/rechazar)
- Habilitar promoción de miembros a admin
- Habilitar aceptación/rechazo y cancelación de transferencia de propiedad
- Agregar botón DM en MemberList
- Agregar confirmaciones faltantes (join request, make admin, reject)
- Reemplazar `window.alert()` por toasts en ConnectionRequest
- Eliminar barra horizontal del chat

**Non-Goals:**
- No se implementan patrones Decorator/Observer del lado web (para otra spec)
- No se modifican backend, shared, ni mobile
- No se agregan nuevas entidades o endpoints

## Decisions

### 1. Invitaciones recibidas: ¿dónde mostrar la UI?
**Opción A**: Nueva pestaña "Invitaciones" en GroupsPage junto a "Mis Grupos" / "Descubrir"
**Opción B**: Sección dentro de GroupDetail
**Opción C**: Página separada

**Decisión: Opción A**. GroupsPage ya tiene tabs; agregar una tercera tab "Invitaciones" es mínimo esfuerzo y consistente con el patrón existente. Usa el hook `useGroupInvitations` ya cableado.

### 2. Botón "Invitar": ¿en GroupDetail o GroupAdminPanel?
**Decisión: Ambos**. GroupDetail muestra un botón "Invitar" en el header del grupo (visible para owner/admin). GroupAdminPanel también tiene un botón "Invitar miembros". Ambos abren `InviteMemberModal`.

### 3. Transferencia de propiedad (candidato): ¿modal o banner?
**Decisión: Banner + Modal** (como mobile). Se crea `TransferInvitationBanner.tsx` que aparece cuando el usuario logueado es el `pending_owner_id` del grupo. El banner tiene botones "Aceptar" y "Rechazar" que abren un ConfirmModal.

### 4. Cancelar transferencia: botón en PendingTransferOwnerBanner
El componente ya existe (`PendingTransferOwnerBanner.tsx`) pero es read-only. Se agrega un botón "Cancelar transferencia" que llama al hook de cancelación.

### 5. Confirmaciones: ¿ConfirmModal o window.confirm?
**Decisión: ConfirmModal** (componente existente en `src/components/ConfirmModal.tsx`). Se usa en lugar de `window.confirm` para consistencia con el diseño.

### 6. DM en MemberList: flujo
MemberList recibe una nueva prop `onDirectMessage(userId)` o usa el hook directamente. Al hacer clic, llama a `useDirectMessage` que navega a `/chat/${groupId}`.

## Risks / Trade-offs

- [Invitaciones UI duplicada] Las invitaciones se muestran en GroupsPage tab, pero también podría haber notificaciones push — asegurar que ambos caminos convergen (al aceptar desde notificación, navegar al grupo)
- [Race condition en aceptar invitación] El hook `respondToInvitation` ya maneja esto vía el shared service con transacciones atómicas (FIX-15)
- [Cambios mínimos en hooks] Los hooks existentes usan React Query — las mutaciones ya invalidan cachés correctamente
- [overflow-x: hidden en chat] Puede cortar contenido que realmente necesita desbordar horizontalmente (poco probable dado `word-wrap: break-word` y `max-width: 70%` en mensajes)
