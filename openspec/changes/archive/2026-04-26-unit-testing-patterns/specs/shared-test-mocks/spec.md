## ADDED Requirements

### Requirement: PrismaService mock factory
El módulo `src/test/mocks/prisma.mock.ts` SHALL exportar una función `createPrismaMock()` que retorne un objeto con todos los modelos de Prisma mockeados con `jest.fn()`, sin usar el tipo `any`.

#### Scenario: Returns object with all model namespaces
- **WHEN** se llama `createPrismaMock()`
- **THEN** el objeto retornado contiene propiedades para cada modelo: `notification`, `group`, `membership`, `user`, `message`, `connection`, `group_invitation`, `group_join_request`, `course`

#### Scenario: Each model has CRUD methods as jest.fn()
- **WHEN** se accede a `mock.notification.create`
- **THEN** es una función `jest.fn()` que puede ser configurada con `mockResolvedValue`

#### Scenario: Mock is reset between tests
- **WHEN** se llama `createPrismaMock()` en cada `beforeEach`
- **THEN** cada test recibe instancias frescas de `jest.fn()` sin estado previo

### Requirement: EventEmitter2 mock factory
El módulo `src/test/mocks/event-emitter.mock.ts` SHALL exportar una función `createEventEmitterMock()` que retorne un objeto con los métodos de EventEmitter2 mockeados.

#### Scenario: Returns object with emit as jest.fn()
- **WHEN** se llama `createEventEmitterMock()`
- **THEN** el objeto retornado tiene `emit` como `jest.fn()`

#### Scenario: Compatible with jest.spyOn
- **WHEN** se usa `jest.spyOn(mock, 'emit')` sobre el objeto retornado
- **THEN** el spy funciona correctamente para verificar llamadas

#### Scenario: Includes on/off methods
- **WHEN** se llama `createEventEmitterMock()`
- **THEN** el objeto incluye `on`, `off`, `once` como `jest.fn()` para compatibilidad con NestJS EventEmitter2

### Requirement: Mocks are strictly typed
Ambas fábricas SHALL usar tipado estricto sin `any`, usando tipos de retorno explícitos compatibles con las interfaces de NestJS.

#### Scenario: PrismaService mock type is compatible
- **WHEN** se usa `createPrismaMock()` como provider en `TestingModule`
- **THEN** TypeScript no reporta errores de tipo al asignar el mock al token `PrismaService`

#### Scenario: EventEmitter2 mock type is compatible
- **WHEN** se usa `createEventEmitterMock()` como provider en `TestingModule`
- **THEN** TypeScript no reporta errores de tipo al asignar el mock al token `EventEmitter2`
