# FIX-07: Estandarización de Esquema de Eventos (UUID a Int) - Diseño de Bugfix

## Overview

El sistema presenta una inconsistencia arquitectónica donde la tabla `event` utiliza UUID como clave primaria (`id String @default(uuid())`), mientras que todas las demás tablas utilizan enteros auto-incrementables (como `id_user`, `id_group`, etc.). Esta inconsistencia causa problemas de estandarización, dificulta el mantenimiento y rompe la coherencia del sistema. La estrategia de fix consiste en migrar el esquema de eventos para usar `id_event Int @id @default(autoincrement())` y actualizar todos los archivos dependientes para mantener la funcionalidad.

## Glossary

- **Bug_Condition (C)**: La condición que identifica el uso inconsistente de UUID en la tabla `event` cuando el resto del sistema usa enteros auto-incrementables
- **Property (P)**: El comportamiento deseado donde la tabla `event` utiliza `id_event Int @id @default(autoincrement())` siguiendo el patrón estándar del sistema
- **Preservation**: Funcionalidad existente de CRUD de eventos, relaciones con otras tablas y operaciones de autenticación/autorización que deben mantenerse intactas
- **EventsController**: El controlador en `src/events/events.controller.ts` que maneja las rutas HTTP para operaciones de eventos
- **EventsService**: El servicio en `src/events/events.service.ts` que contiene la lógica de negocio para operaciones de eventos
- **EventOwnershipGuard**: El guard en `src/events/guards/event-ownership.guard.ts` que valida permisos de propiedad de eventos
- **Event Interface**: La interfaz frontend en `types/event.types.ts` que define la estructura de datos de eventos

## Bug Details

### Fault Condition

El bug se manifiesta cuando el sistema utiliza UUID como clave primaria para la tabla `event`, rompiendo la consistencia arquitectónica. El esquema actual utiliza `id String @default(uuid())` mientras que todas las demás tablas siguen el patrón `id_[entidad] Int @id @default(autoincrement())`.

**Formal Specification:**
```
FUNCTION isBugCondition(schema)
  INPUT: schema of type DatabaseSchema
  OUTPUT: boolean
  
  RETURN schema.event.primaryKey.type == 'String'
         AND schema.event.primaryKey.default == 'uuid()'
         AND ALL other_tables IN schema WHERE other_tables != event
             HAVE other_tables.primaryKey.type == 'Int'
             AND other_tables.primaryKey.default == 'autoincrement()'
END FUNCTION
```

### Examples

- **Inconsistencia de Esquema**: `event.id` es `String` mientras que `user.id_user`, `group.id_group`, `program.id_program` son `Int`
- **Inconsistencia de API**: Los endpoints de eventos esperan/retornan `id` como `string` mientras que otros endpoints usan `number`
- **Inconsistencia de Frontend**: Las interfaces de eventos definen `id: string` mientras que otras entidades usan `id_[entidad]: number`
- **Inconsistencia de Guards**: `EventOwnershipGuard` valida UUID format mientras que otros guards esperan enteros

## Expected Behavior

### Preservation Requirements

**Unchanged Behaviors:**
- Todas las operaciones CRUD de eventos (crear, leer, actualizar, eliminar) deben continuar funcionando exactamente igual
- La autenticación y autorización de eventos debe mantenerse intacta
- Las relaciones con tablas `user` y `program` deben preservarse
- Los filtros, paginación y búsqueda de eventos deben funcionar sin cambios
- La validación de datos de eventos debe mantenerse

**Scope:**
Todas las operaciones que NO involucran el campo `id` de eventos deben ser completamente no afectadas por este fix. Esto incluye:
- Operaciones en otras tablas del sistema (user, group, program, etc.)
- Autenticación y autorización general del sistema
- Funcionalidad de frontend no relacionada con eventos

## Hypothesized Root Cause

Basado en el análisis del código, las causas más probables son:

1. **Decisión de Diseño Inicial Inconsistente**: La tabla `event` fue creada usando UUID sin seguir el patrón establecido del sistema
   - Todas las demás tablas usan `id_[entidad] Int @id @default(autoincrement())`
   - La tabla `event` usa `id String @default(uuid())`

2. **Falta de Estandarización en el Desarrollo**: Los desarrolladores no siguieron las convenciones establecidas
   - El patrón estándar es claro en 15+ tablas del sistema
   - La tabla `event` es la única excepción

3. **Propagación del Error**: Una vez establecido el UUID, se propagó a través de toda la stack
   - Backend controllers/services esperan `string`
   - Frontend interfaces definen `id: string`
   - Guards validan formato UUID

4. **Falta de Revisión Arquitectónica**: No se detectó la inconsistencia durante el desarrollo o revisiones de código

## Correctness Properties

Property 1: Fault Condition - Event Schema Standardization

_For any_ database schema where the event table exists, the fixed schema SHALL use `id_event Int @id @default(autoincrement())` as the primary key, following the same pattern as all other tables in the system (user.id_user, group.id_group, program.id_program, etc.).

**Validates: Requirements 2.1, 2.2, 2.3, 2.4**

Property 2: Preservation - Event CRUD Functionality

_For any_ event CRUD operation (create, read, update, delete) that worked correctly with UUID, the fixed system SHALL produce exactly the same functional behavior using integer IDs, preserving all business logic, validation, authentication, and authorization.

**Validates: Requirements 3.1, 3.2, 3.3, 3.4**

## Fix Implementation

### Changes Required

Asumiendo que nuestro análisis de causa raíz es correcto:

**File**: `Uniconnect-Backend-Core/prisma/schema/event.prisma`

**Function**: Schema definition

**Specific Changes**:
1. **Primary Key Migration**: Cambiar de `id String @id @default(uuid())` a `id_event Int @id @default(autoincrement())`
   - Actualizar el campo primario para seguir el patrón estándar
   - Mantener todos los demás campos y relaciones

2. **Relationship Updates**: Actualizar referencias en relaciones
   - Mantener las relaciones con `user` y `program`
   - Actualizar índices para usar el nuevo campo

**File**: `Uniconnect-Backend-Core/src/events/events.controller.ts`

**Function**: All controller methods

**Specific Changes**:
3. **Parameter Type Updates**: Cambiar `@Param('id') id: string` a `@Param('id') id: string` (convertir a number internamente)
   - Actualizar `findOne`, `update`, `deleteOwn` methods
   - Agregar validación y conversión de string a number

**File**: `Uniconnect-Backend-Core/src/events/events.service.ts`

**Function**: All service methods

**Specific Changes**:
4. **Service Method Updates**: Actualizar métodos para manejar integer IDs
   - `findOne(id: string, userId?: number)` → `findOne(id: number, userId?: number)`
   - `update(id: string, ...)` → `update(id: number, ...)`
   - `deleteOwn(id: string, ...)` → `deleteOwn(id: number, ...)`
   - Actualizar queries de Prisma para usar integer

**File**: `Uniconnect-Backend-Core/src/events/guards/event-ownership.guard.ts`

**Function**: `canActivate` method

**Specific Changes**:
5. **Guard Validation Updates**: Cambiar validación de UUID a integer
   - Remover validación de formato UUID
   - Agregar validación de integer positivo
   - Actualizar query de Prisma para usar integer

**File**: `Uniconnect-Frontend/src/features/events/types/event.types.ts`

**Function**: Interface definitions

**Specific Changes**:
6. **Frontend Interface Updates**: Actualizar interfaces para usar integer IDs
   - `Event.id: string` → `Event.id_event: number`
   - Mantener compatibilidad con APIs durante transición
   - Actualizar todos los tipos relacionados

**File**: `Uniconnect-Frontend/src/features/events/services/events.service.ts`

**Function**: All API methods

**Specific Changes**:
7. **Frontend Service Updates**: Actualizar llamadas a API para usar integer IDs
   - Actualizar endpoints para enviar/recibir numbers
   - Mantener serialización correcta en requests/responses

## Testing Strategy

### Validation Approach

La estrategia de testing sigue un enfoque de dos fases: primero, demostrar el bug en el código sin fix ejecutando tests que fallen debido a la inconsistencia de esquema, luego verificar que el fix funciona correctamente y preserva el comportamiento existente.

### Exploratory Fault Condition Checking

**Goal**: Demostrar la inconsistencia de esquema ANTES de implementar el fix. Confirmar o refutar el análisis de causa raíz. Si refutamos, necesitaremos re-hipotetizar.

**Test Plan**: Escribir tests que validen la consistencia de esquema y tipos a través de todo el stack. Ejecutar estos tests en el código SIN FIX para observar fallas y entender la causa raíz.

**Test Cases**:
1. **Schema Consistency Test**: Validar que todas las tablas usan el mismo patrón de ID (fallará en código sin fix)
2. **API Type Consistency Test**: Validar que todos los endpoints usan el mismo tipo para IDs (fallará en código sin fix)
3. **Frontend Interface Consistency Test**: Validar que todas las interfaces usan el mismo patrón de ID (fallará en código sin fix)
4. **Guard Validation Consistency Test**: Validar que todos los guards usan el mismo tipo de validación (fallará en código sin fix)

**Expected Counterexamples**:
- La tabla `event` usa `String` mientras otras usan `Int`
- Posibles causas: decisión de diseño inicial, falta de estandarización, propagación del error

### Fix Checking

**Goal**: Verificar que para todos los esquemas donde la condición de bug se cumple, el esquema fijo produce el comportamiento esperado.

**Pseudocode:**
```
FOR ALL schema WHERE isBugCondition(schema) DO
  fixed_schema := applyEventSchemaMigration(schema)
  ASSERT isStandardizedSchema(fixed_schema)
END FOR
```

### Preservation Checking

**Goal**: Verificar que para todas las operaciones que NO involucran el cambio de ID, el sistema fijo produce el mismo resultado que el sistema original.

**Pseudocode:**
```
FOR ALL operation WHERE NOT involvesEventIdChange(operation) DO
  ASSERT originalSystem(operation) = fixedSystem(operation)
END FOR
```

**Testing Approach**: Property-based testing es recomendado para preservation checking porque:
- Genera muchos casos de test automáticamente a través del dominio de entrada
- Detecta casos edge que tests manuales podrían perder
- Proporciona garantías fuertes de que el comportamiento no cambia para operaciones no afectadas

**Test Plan**: Observar comportamiento en código SIN FIX primero para operaciones CRUD de eventos, luego escribir property-based tests capturando ese comportamiento.

**Test Cases**:
1. **Event CRUD Preservation**: Verificar que crear, leer, actualizar y eliminar eventos continúa funcionando
2. **Authentication Preservation**: Verificar que autenticación y autorización de eventos continúa funcionando
3. **Relationship Preservation**: Verificar que relaciones con user y program continúan funcionando
4. **API Response Preservation**: Verificar que estructura de respuestas de API se mantiene

### Unit Tests

- Test migration script para verificar transformación correcta de esquema
- Test controller methods con nuevos tipos de parámetros
- Test service methods con integer IDs
- Test guard validation con integer format

### Property-Based Tests

- Generar eventos aleatorios y verificar que operaciones CRUD funcionan correctamente
- Generar configuraciones aleatorias de base de datos y verificar consistencia de esquema
- Test que todas las operaciones no relacionadas con eventos continúan funcionando

### Integration Tests

- Test flujo completo de eventos con integer IDs en cada contexto
- Test que migración de base de datos se ejecuta correctamente
- Test que frontend y backend se comunican correctamente con nuevos tipos