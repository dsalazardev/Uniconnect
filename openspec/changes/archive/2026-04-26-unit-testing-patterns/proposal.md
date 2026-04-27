## Why

La auditoría de cobertura detectó brechas críticas en los patrones Observer y Decorator: `NotificationEventListener` (8 handlers sin tests), `GroupInvitationsService` y `ConnectionsService` (emisiones sin validar), y los decoradores de auth (`RequireAll`, `RequireAny`, `AdminOnly`, `GetClaim`) sin tests unitarios directos. Además, existe deuda técnica de mocks duplicados en cada spec. Cubrir estas brechas garantiza que los contratos de los patrones de diseño sean verificables y que regresiones futuras sean detectadas automáticamente.

## What Changes

- **Nuevo**: `src/test/mocks/prisma.mock.ts` — fábrica reutilizable de mock de PrismaService
- **Nuevo**: `src/test/mocks/event-emitter.mock.ts` — fábrica reutilizable de mock de EventEmitter2
- **Nuevo**: `src/auth/decorators/__tests__/permissions.decorator.spec.ts` — tests para `RequireAll` y `RequireAny`
- **Nuevo**: `src/auth/decorators/__tests__/admin-only.decorator.spec.ts` — tests para `AdminOnly`
- **Nuevo**: `src/auth/decorators/__tests__/get-token-claim.decorator.spec.ts` — tests para `GetClaim`
- **Nuevo**: `src/notifications/listeners/__tests__/notification-event.listener.spec.ts` — tests para los 8 handlers de `NotificationEventListener`
- **Nuevo**: `src/group-invitations/__tests__/group-invitations.service.observer.spec.ts` — tests de emisión para `GroupInvitationsService`
- **Nuevo**: `src/connections/__tests__/connections.service.observer.spec.ts` — tests de emisión para `ConnectionsService`
- **Modificado**: `src/messages/messages.service.spec.ts` — agregar cobertura explícita de las 3 emisiones (`MESSAGE_SENT`, `MESSAGE_EDITED`, `MESSAGE_DELETED`)

## Capabilities

### New Capabilities

- `decorator-unit-tests`: Tests unitarios aislados para los 4 decoradores de auth y el decorador `ContentModeration`, usando clases ficticias internas (DummyClass) sin dependencia de controladores reales
- `observer-emission-tests`: Tests de emisión de eventos con `jest.spyOn(eventEmitter, 'emit')` para los 3 sujetos con brechas: `GroupInvitationsService`, `ConnectionsService`, y `MessagesService`
- `observer-reaction-tests`: Tests de reacción para los 8 handlers de `NotificationEventListener`, validando creación de registros en Prisma por cada evento
- `shared-test-mocks`: Infraestructura de mocks reutilizables en `src/test/mocks/` para eliminar duplicación entre specs

### Modified Capabilities

- `study-group-lifecycle-events`: Agregar referencia a la infraestructura de mocks compartidos en los specs existentes de `GroupActivityListener`

## Impact

- **Archivos nuevos**: 8 archivos `.spec.ts` + 2 archivos de mocks
- **Archivos modificados**: `messages.service.spec.ts`
- **Sin cambios en código de producción**: Solo infraestructura de testing
- **Cobertura objetivo**: 100% de la lógica de patrones Observer y Decorator
- **Dependencias de testing**: Jest 30.x (ya instalado), sin nuevas dependencias
