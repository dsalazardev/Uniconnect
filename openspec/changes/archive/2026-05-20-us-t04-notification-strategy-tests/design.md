## Context

El backend de Uniconnect implementa el patrón Strategy para el envío de notificaciones multicanal. `NotificationsService` (contexto) inyecta un array de `INotificacionStrategy` (4 estrategias concretas) y las ejecuta según las preferencias del usuario.

**Estado actual:**
- 4 estrategias implementadas: `InAppWebSocketStrategy`, `EmailInstitucionalStrategy`, `PushMovilStrategy`, `ResumenDiarioStrategy`
- `strategy.spec.ts` tiene 12 tests, 4 fallando por mocks desactualizados
- No existe `notifications.service.spec.ts` (el contexto no tiene tests unitarios)
- El filtrado por preferencias (`filtrarEstrategiasActivas()`) no tiene cobertura
- El principio Open/Closed no está validado

## Goals / Non-Goals

**Goals:**
- Crear una fábrica de mocks reutilizable para todas las suites de test del módulo de notificaciones
- Reparar los 4 tests rotos en `strategy.spec.ts` actualizando los mocks de Prisma
- Testear `NotificationsService.enviarNotificacion()` con estrategias inyectadas mockeadas
- Validar aislamiento de fallos: 1 estrategia falla → las otras 2 se ejecutan
- Validar filtrado por preferencias: push desactivado → `PushMovilStrategy` no se ejecuta
- Validar Open/Closed: estrategia ficticia se consume sin modificar código existente
- Todos los tests deben usar mocks (0 dependencias de transporte real)

**Non-Goals:**
- No se modifica código de producción
- No se crean tests de integración (los existentes en `QA-tests/` se mantienen)
- No se modifica el listener (`notification-event.listener.spec.ts`)
- No se agregan nuevas estrategias al sistema

## Decisions

### D1: Fábrica de mocks centralizada vs. mocks inline
- **Decisión**: Archivo `test/dobles-de-prueba.ts` con funciones factory.
- **Rationale**: Elimina duplicación entre `strategy.spec.ts` y `notifications.service.spec.ts`. Los mocks de Prisma tienen 8+ métodos; replicarlos inline en cada suite es propenso a errores.
- **Alternativa**: Mocks inline en cada `describe`. Rechazado por violar DRY.

### D2: Prisma mocking — objeto plano con `jest.fn()`
- **Decisión**: Mockear PrismaService como objeto plano con métodos `jest.fn()`.
- **Rationale**: Las estrategias usan `prisma.notification.create()`, `prisma.user_push_token.findMany()`, `prisma.daily_digest_queue.create()`, etc. El objeto plano permite control granular por test.
- **Alternativa**: `nestjs/testing` con `PrismaModule` real. Rechazado porque crea dependencia con BD real.

### D3: Estrategias mock — objeto plano con `enviar()` mockeado
- **Decisión**: `createMockStrategy(canal, exitoso)` y `createFailingMockStrategy(canal)`.
- **Rationale**: Los tests del contexto no necesitan instancias reales de las estrategias. Un objeto con `{ canal, enviar: jest.fn() }` es suficiente y más aislado.
- **Alternativa**: Instanciar estrategias reales con dependencias mockeadas. Rechazado porque introduce complejidad innecesaria; el Criterio 3 especifica explícitamente "dobles de prueba".

### D4: Ubicación del nuevo test
- **Decisión**: `src/notifications/__tests__/notifications.service.spec.ts`
- **Rationale**: Convención NestJS estándar. El archivo está junto al módulo que prueba.
- **Alternativa**: `src/notifications/notifications.service.spec.ts` (Junto al service). Rechazado porque `strategy.spec.ts` ya está en `domain/strategy/` y el service test cruza múltiples directorios.

## Risks / Trade-offs

- **[Riesgo] Los mocks pueden desincronizarse si la API de Prisma cambia en el futuro.**
  → **Mitigación**: Los mocks tipados como `any` permiten cambios sin romper tests, pero se recomienda agregar un test de humo al build que verifique que los nombres de método existen.

- **[Riesgo] El test de Open/Closed (Criterio 5) podría ser frágil si la inyección de estrategias cambia.**
  → **Mitigación**: El test usa `new NotificationsService(prismaMock, [estrategias])` directamente, sin pasar por el módulo de NestJS. Esto lo aísla de cambios en el DI container.

- **[Trade-off] Los tests de `strategy.spec.ts` seguirán usando `jest.fn()` inline para algunos casos.**
  → Aceptado: `InAppWebSocketStrategy` y `EmailInstitucionalStrategy` tienen tests existentes que funcionan y no requieren cambios.
