## Context

El proyecto tiene implementados los patrones Observer (EventEmitter2 + @OnEvent) y Decorator (Method Decorators) pero con cobertura de tests fragmentada. La auditoría identificó 3 sujetos sin tests de emisión, 1 listener sin tests de reacción, 4 decoradores sin tests unitarios directos, y mocks duplicados en cada spec. Este diseño establece la estrategia técnica para cubrir todas las brechas sin modificar código de producción.

**Estado actual de tests relevantes:**
- `GroupActivityListener`: 5 tests ✅
- `GroupsService` (emisiones): 6 tests ✅
- `MessagesGateway` (Observer): 12 tests ✅
- `ContentModeration` decorator: cubierto ✅
- `NotificationEventListener`: 0 tests ❌
- `GroupInvitationsService` (emisiones): 0 tests ❌
- `ConnectionsService` (emisiones): 0 tests ❌
- Decoradores de auth: 0 tests unitarios directos ❌

## Goals / Non-Goals

**Goals:**
- Cubrir 100% de handlers de `NotificationEventListener` (8 handlers)
- Cubrir emisiones de `GroupInvitationsService` (4 eventos), `ConnectionsService` (1 evento), `MessagesService` (3 eventos)
- Cubrir los 4 decoradores de auth con tests unitarios usando DummyClass
- Crear infraestructura de mocks reutilizables en `src/test/mocks/`
- Cero cambios en código de producción

**Non-Goals:**
- Tests de integración o e2e
- Cobertura de guards (ya cubiertos indirectamente)
- Refactorizar specs existentes para usar los nuevos mocks (opcional, no bloqueante)

## Decisions

### D1: Estrategia para tests de decoradores — DummyClass interna

**Decisión**: Cada spec de decorador define una clase ficticia interna (`class DummyController`) con métodos decorados, en lugar de importar controladores reales.

**Rationale**: Aísla el test del decorador de la lógica del controlador. Sigue el patrón mandatado en AGENTS.md para US-T01. Evita dependencias transitivas de módulos NestJS completos.

**Alternativa descartada**: Testear decoradores a través de controladores reales → acopla el test a la implementación del controlador, no al decorador.

### D2: Estrategia para tests de emisión — jest.spyOn obligatorio

**Decisión**: Todos los tests de emisión usan `jest.spyOn(eventEmitter, 'emit')` en lugar de `expect(mockEmit).toHaveBeenCalledWith(...)` con mock manual.

**Rationale**: `jest.spyOn` preserva el comportamiento real del objeto mientras intercepta llamadas. Mandatado explícitamente en AGENTS.md para US-T02. Permite verificar que la emisión ocurre DESPUÉS de la operación de BD exitosa.

**Alternativa descartada**: Mock completo de EventEmitter2 → no verifica que el objeto inyectado sea el mismo que emite.

### D3: Infraestructura de mocks — fábricas con jest.fn() tipadas

**Decisión**: `src/test/mocks/prisma.mock.ts` exporta `createPrismaMock()` que retorna un objeto con todos los modelos mockeados. `src/test/mocks/event-emitter.mock.ts` exporta `createEventEmitterMock()`.

**Rationale**: Elimina ~40 líneas de boilerplate repetido en cada spec. Tipado estricto con `DeepMockProxy<PrismaService>` pattern (sin `any`). Fácil de extender cuando se agregan nuevos modelos.

**Alternativa descartada**: `jest-mock-extended` como dependencia externa → introduce dependencia nueva, el patrón manual es suficiente y más transparente.

### D4: Tests de NotificationEventListener — validar createMany/create de Prisma

**Decisión**: Cada handler se testea verificando que `prisma.notification.create` o `prisma.notification.createMany` sea llamado con el payload correcto, y que errores de BD no propaguen excepciones (programación defensiva).

**Rationale**: El contrato del listener es "crear notificaciones en BD". Verificar la llamada a Prisma es la única forma de validar el comportamiento observable sin efectos secundarios reales.

### D5: Cobertura de MessagesService — agregar describe block, no reescribir

**Decisión**: Agregar un nuevo `describe('Observer Pattern - Event Emissions')` al spec existente de MessagesService en lugar de crear un archivo separado.

**Rationale**: El spec ya existe y tiene contexto del servicio. Mantener un solo archivo por servicio es más mantenible. Evita duplicar el setup del módulo de testing.

## Risks / Trade-offs

- **[Riesgo] Mocks desincronizados con schema Prisma** → Mitigación: Los mocks usan `jest.fn()` sin tipos de retorno forzados; TypeScript detectará desajustes en tiempo de compilación.
- **[Riesgo] Tests de decoradores de auth frágiles si NestJS cambia la API de metadata** → Mitigación: Testear el comportamiento observable (metadata key/value) no la implementación interna de `SetMetadata`.
- **[Trade-off] No refactorizar specs existentes** → Acepta deuda técnica menor a cambio de no romper tests que ya pasan.
