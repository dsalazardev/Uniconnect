# Plan de Implementación

- [x] 1. Escribir test de exploración de condición de bug
  - **Property 1: Fault Condition** - Inconsistencia de Esquema de Eventos
  - **CRÍTICO**: Este test DEBE FALLAR en código sin fix - la falla confirma que el bug existe
  - **NO intentar arreglar el test o el código cuando falle**
  - **NOTA**: Este test codifica el comportamiento esperado - validará el fix cuando pase después de la implementación
  - **OBJETIVO**: Exponer contraejemplos que demuestren que el bug existe
  - **Enfoque PBT Acotado**: Para bugs determinísticos, acotar la propiedad a los casos concretos que fallan para asegurar reproducibilidad
  - Test que valida que la tabla `event` usa `id_event Int @id @default(autoincrement())` siguiendo el patrón estándar del sistema
  - Las aserciones del test deben coincidir con las Propiedades de Comportamiento Esperado del diseño
  - Ejecutar test en código SIN FIX
  - **RESULTADO ESPERADO**: Test FALLA (esto es correcto - prueba que el bug existe)
  - Documentar contraejemplos encontrados para entender la causa raíz
  - Marcar tarea como completa cuando el test esté escrito, ejecutado y la falla documentada
  - _Requirements: 2.1, 2.2, 2.3, 2.4_

- [x] 2. Escribir tests de propiedades de preservación (ANTES de implementar el fix)
  - **Property 2: Preservation** - Funcionalidad CRUD de Eventos
  - **IMPORTANTE**: Seguir metodología de observación primero
  - Observar comportamiento en código SIN FIX para entradas no buggy
  - Escribir tests basados en propiedades capturando patrones de comportamiento observados de los Requisitos de Preservación
  - El testing basado en propiedades genera muchos casos de test para garantías más fuertes
  - Ejecutar tests en código SIN FIX
  - **RESULTADO ESPERADO**: Tests PASAN (esto confirma el comportamiento base a preservar)
  - Marcar tarea como completa cuando los tests estén escritos, ejecutados y pasando en código sin fix
  - _Requirements: 3.1, 3.2, 3.3, 3.4_

- [x] 3. Fix para estandarización de esquema de eventos

  - [x] 3.1 Modificar esquema de Prisma y ejecutar migración destructiva
    - Cambiar `id String @id @default(uuid())` a `id_event Int @id @default(autoincrement())` en `Uniconnect-Backend-Core/prisma/schema/event.prisma`
    - Actualizar relaciones para usar el nuevo campo `id_event`
    - Mantener todos los demás campos y relaciones existentes
    - Ejecutar migración destructiva: `npx prisma migrate dev --name estandarizar_id_eventos`
    - **NOTA**: Pérdida de datos autorizada para tabla `event`
    - _Bug_Condition: isBugCondition(schema) donde schema.event.primaryKey.type == 'String' del diseño_
    - _Expected_Behavior: expectedBehavior(schema) donde schema.event usa id_event Int @id @default(autoincrement()) del diseño_
    - _Preservation: Requisitos de Preservación del diseño_
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 3.1, 3.2, 3.3, 3.4_

  - [x] 3.2 Refactorizar tipados, controladores, servicios y guards del Backend
    - Actualizar `Uniconnect-Backend-Core/src/events/events.controller.ts`:
      - Cambiar `@Param('id') id: string` a `@Param('id') id: string` (convertir a number internamente)
      - Actualizar métodos `findOne`, `update`, `deleteOwn` para manejar conversión de string a number
      - Agregar validación de integer positivo en lugar de UUID
    - Actualizar `Uniconnect-Backend-Core/src/events/events.service.ts`:
      - Cambiar signatures de métodos: `findOne(id: string, ...)` → `findOne(id: number, ...)`
      - Actualizar `update(id: string, ...)` → `update(id: number, ...)`
      - Actualizar `deleteOwn(id: string, ...)` → `deleteOwn(id: number, ...)`
      - Actualizar queries de Prisma para usar integer IDs
    - Actualizar `Uniconnect-Backend-Core/src/events/guards/event-ownership.guard.ts`:
      - Remover validación de formato UUID
      - Agregar validación de integer positivo
      - Actualizar query de Prisma para usar integer ID
    - _Bug_Condition: isBugCondition(backend) donde backend espera/retorna string IDs del diseño_
    - _Expected_Behavior: expectedBehavior(backend) donde backend maneja id_event como number del diseño_
    - _Preservation: Requisitos de Preservación del diseño_
    - _Requirements: 2.3, 3.1, 3.2_

  - [x] 3.3 Refactorizar tipados, servicios y componentes del Frontend
    - Actualizar `Uniconnect-Frontend/src/features/events/types/event.types.ts`:
      - Cambiar `Event.id: string` → `Event.id_event: number`
      - Mantener compatibilidad con APIs durante transición
      - Actualizar todos los tipos relacionados
    - Actualizar servicios de eventos del frontend:
      - Actualizar llamadas a API para enviar/recibir numbers
      - Mantener serialización correcta en requests/responses
    - Actualizar componentes que consumen eventos:
      - Actualizar referencias de `event.id` a `event.id_event`
      - Actualizar validaciones de formularios para integer IDs
    - _Bug_Condition: isBugCondition(frontend) donde frontend define id: string del diseño_
    - _Expected_Behavior: expectedBehavior(frontend) donde frontend usa id_event: number del diseño_
    - _Preservation: Requisitos de Preservación del diseño_
    - _Requirements: 2.4, 3.1, 3.2_

  - [x] 3.4 Verificar que el test de exploración de condición de bug ahora pasa
    - **Property 1: Expected Behavior** - Esquema de Eventos Estandarizado
    - **IMPORTANTE**: Re-ejecutar el MISMO test de la tarea 1 - NO escribir un test nuevo
    - El test de la tarea 1 codifica el comportamiento esperado
    - Cuando este test pase, confirma que el comportamiento esperado se satisface
    - Ejecutar test de exploración de condición de bug del paso 1
    - **RESULTADO ESPERADO**: Test PASA (confirma que el bug está arreglado)
    - _Requirements: Propiedades de Comportamiento Esperado del diseño_

  - [x] 3.5 Verificar que los tests de preservación aún pasan
    - **Property 2: Preservation** - Funcionalidad CRUD de Eventos
    - **IMPORTANTE**: Re-ejecutar los MISMOS tests de la tarea 2 - NO escribir tests nuevos
    - Ejecutar tests de propiedades de preservación del paso 2
    - **RESULTADO ESPERADO**: Tests PASAN (confirma que no hay regresiones)
    - Confirmar que todos los tests aún pasan después del fix (sin regresiones)

- [x] 4. Checkpoint - Asegurar que todos los tests pasan
  - Asegurar que todos los tests pasan, preguntar al usuario si surgen dudas.