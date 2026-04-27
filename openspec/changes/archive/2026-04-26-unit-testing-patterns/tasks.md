## 1. Infraestructura de Mocks Compartidos

- [x] 1.1 Crear directorio `src/test/mocks/`
- [x] 1.2 Crear `src/test/mocks/prisma.mock.ts` con función `createPrismaMock()` tipada (sin `any`)
- [x] 1.3 Crear `src/test/mocks/event-emitter.mock.ts` con función `createEventEmitterMock()` tipada
- [x] 1.4 Verificar que ambas fábricas compilan sin errores TypeScript

## 2. US-T01: Tests de Decoradores de Auth

- [x] 2.1 Crear directorio `src/auth/decorators/__tests__/`
- [x] 2.2 Crear `permissions.decorator.spec.ts` con DummyController interna
- [x] 2.3 Implementar test: `RequireAll` establece metadata `{ type: 'all', permissions: [...] }`
- [x] 2.4 Implementar test: `RequireAll` con array vacío
- [x] 2.5 Implementar test: `RequireAny` establece metadata `{ type: 'any', permissions: [...] }`
- [x] 2.6 Implementar test: `RequireAny` vs `RequireAll` difieren en campo `type`
- [x] 2.7 Crear `admin-only.decorator.spec.ts` con DummyController interna
- [x] 2.8 Implementar test: `AdminOnly` establece `ADMIN_ONLY_KEY = true`
- [x] 2.9 Implementar test: `AdminOnly` no afecta otros métodos de la clase
- [x] 2.10 Crear `get-token-claim.decorator.spec.ts`
- [x] 2.11 Implementar test: `GetClaim('sub')` extrae claim del request.user
- [x] 2.12 Implementar test: `GetClaim` retorna `undefined` para claim inexistente
- [x] 2.13 Implementar test: `GetClaim` retorna `undefined` cuando `user` no está en request
- [x] 2.14 Ejecutar `npm test -- auth/decorators` y verificar todos en verde

## 3. US-T02: Tests de Emisión — GroupInvitationsService

- [x] 3.1 Crear directorio `src/group-invitations/__tests__/`
- [x] 3.2 Crear `group-invitations.service.observer.spec.ts`
- [x] 3.3 Configurar TestingModule con `createPrismaMock()` y `createEventEmitterMock()`
- [x] 3.4 Implementar test: `sendInvitation()` emite `GROUP_INVITATION_SENT` con payload correcto
- [x] 3.5 Implementar test: `sendInvitation()` NO emite si BD falla
- [x] 3.6 Implementar test: `respondToInvitation('accepted')` emite `GROUP_INVITATION_ACCEPTED` y `USER_JOINED_GROUP`
- [x] 3.7 Implementar test: `respondToInvitation('rejected')` emite `GROUP_INVITATION_REJECTED` y NO emite `USER_JOINED_GROUP`
- [x] 3.8 Ejecutar `npm test -- group-invitations.service.observer` y verificar todos en verde

## 4. US-T02: Tests de Emisión — ConnectionsService

- [x] 4.1 Crear directorio `src/connections/__tests__/`
- [x] 4.2 Crear `connections.service.observer.spec.ts`
- [x] 4.3 Configurar TestingModule con `createPrismaMock()` y `createEventEmitterMock()`
- [x] 4.4 Implementar test: `requestConnection()` emite `CONNECTION_REQUEST_SENT` con payload correcto
- [x] 4.5 Implementar test: `requestConnection()` NO emite si BD falla
- [x] 4.6 Ejecutar `npm test -- connections.service.observer` y verificar todos en verde

## 5. US-T02: Tests de Emisión — MessagesService (completar cobertura)

- [x] 5.1 Abrir `src/messages/messages.service.spec.ts`
- [x] 5.2 Agregar `describe('Observer Pattern - Event Emissions')` al final del archivo
- [x] 5.3 Implementar test: `create()` emite `MESSAGE_SENT` con payload correcto
- [x] 5.4 Implementar test: `create()` NO emite si BD falla
- [x] 5.5 Implementar test: `update()` emite `MESSAGE_EDITED`
- [x] 5.6 Implementar test: `remove()` emite `MESSAGE_DELETED`
- [x] 5.7 Ejecutar `npm test -- messages.service` y verificar todos en verde

## 6. US-T02: Tests de Reacción — NotificationEventListener

- [x] 6.1 Crear directorio `src/notifications/listeners/__tests__/`
- [x] 6.2 Crear `notification-event.listener.spec.ts`
- [x] 6.3 Configurar TestingModule con `createPrismaMock()`
- [x] 6.4 Implementar test: `handleMessageSent()` llama `prisma.notification.create` con `notification_type: 'message_sent'`
- [x] 6.5 Implementar test: `handleMessageSent()` no propaga excepción si BD falla
- [x] 6.6 Implementar test: `handleGroupInvitationSent()` crea notificación para `invitee_id`
- [x] 6.7 Implementar test: `handleGroupInvitationSent()` no propaga excepción si BD falla
- [x] 6.8 Implementar test: `handleGroupInvitationAccepted()` crea notificación para `inviter_id`
- [x] 6.9 Implementar test: `handleGroupInvitationAccepted()` no propaga excepción si BD falla
- [x] 6.10 Implementar test: `handleUserJoinedGroup()` llama `prisma.notification.createMany`
- [x] 6.11 Implementar test: `handleUserJoinedGroup()` no propaga excepción si BD falla
- [x] 6.12 Implementar test: `handleConnectionRequestSent()` crea notificación para `adressee_id`
- [x] 6.13 Implementar test: `handleConnectionRequestSent()` no propaga excepción si BD falla
- [x] 6.14 Implementar test: `handleGroupJoinRequestSent()` crea notificación para `owner_id`
- [x] 6.15 Implementar test: `handleGroupJoinRequestSent()` no propaga excepción si BD falla
- [x] 6.16 Implementar test: `handleGroupJoinRequestAccepted()` crea notificación para `requester_id`
- [x] 6.17 Implementar test: `handleGroupJoinRequestAccepted()` no propaga excepción si BD falla
- [x] 6.18 Implementar test: `handleGroupJoinRequestRejected()` crea notificación para `requester_id`
- [x] 6.19 Implementar test: `handleGroupJoinRequestRejected()` no propaga excepción si BD falla
- [x] 6.20 Ejecutar `npm test -- notification-event.listener` y verificar todos en verde

## 7. Validación Final

- [x] 7.1 Ejecutar `npm test` completo y verificar cero regresiones
- [x] 7.2 Verificar que los nuevos specs usan `createPrismaMock()` y `createEventEmitterMock()` donde aplica
- [x] 7.3 Verificar tipado estricto: `npm run build` sin errores
- [x] 7.4 Confirmar cobertura: todos los handlers de `NotificationEventListener` tienen al menos 2 tests (happy path + error handling)
- [x] 7.5 Actualizar `AGENTS.md` con estado de US-T01 y US-T02 como COMPLETADOS
