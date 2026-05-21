## Why

El patrón Strategy para notificaciones multicanal fue implementado en el backend (4 estrategias concretas + `NotificationsService` como contexto + DI), pero carece de tests unitarios que validen el comportamiento del contexto. Los tests existentes en `strategy.spec.ts` tienen 4 fallos por mocks desactualizados tras refactorizaciones de Prisma, y no existe cobertura para el filtrado por preferencias de usuario ni para el principio Open/Closed.

## What Changes

1. Crear fábrica de mocks reutilizables (`dobles-de-prueba.ts`) para PrismaService, ChatGateway, ChatSessionManager y nodemailer.
2. Reparar `strategy.spec.ts`: actualizar mocks de `PushMovilStrategy` y `ResumenDiarioStrategy` al API actual de Prisma.
3. Crear `notifications.service.spec.ts` con tests del contexto: inyección de estrategias, aislamiento de fallos (`Promise.allSettled`), filtrado por preferencias y Open/Closed.

## Capabilities

### New Capabilities
- `notification-strategy-tests`: Tests unitarios para el patrón Strategy de notificaciones multicanal.

### Modified Capabilities

- *Ninguna — solo se agregan tests, no se modifican requisitos de comportamiento existentes.*

## Impact

- **Archivos nuevos**:
  - `src/notifications/test/dobles-de-prueba.ts`
  - `src/notifications/__tests__/notifications.service.spec.ts`
- **Archivos modificados**:
  - `src/notifications/domain/strategy/strategy.spec.ts` (reparar 4 tests)
- **Código de producción**: Sin cambios.
- **Dependencias**: Sin nuevas.
