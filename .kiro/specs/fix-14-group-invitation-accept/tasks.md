# Plan de Implementación - Fix-14 Group Invitation Accept

## Objetivo

Corregir el bug que impide a los usuarios aceptar invitaciones de grupo desde el frontend React Native. La petición HTTP PATCH falla con error 400 (Bad Request) debido a problemas con la extracción y conversión del user ID desde el JWT token.

---

## Tareas

- [x] 1. Escribir test exploratorio de Bug Condition
  - **Property 1: Bug Condition** - Accept Group Invitation HTTP 400 Error
  - **CRÍTICO**: Este test DEBE FALLAR en código sin modificar - el fallo confirma que el bug existe
  - **NO intentar arreglar el test o el código cuando falle**
  - **NOTA**: Este test codifica el comportamiento esperado - validará la corrección cuando pase después de la implementación
  - **OBJETIVO**: Descubrir contraejemplos que demuestren la causa raíz del bug
  - **Enfoque PBT Acotado**: Para este bug determinista, acotar la propiedad al caso concreto que falla: usuario autenticado intenta aceptar invitación válida pendiente
  - Implementar test que simule petición PATCH a `/group-invitations/:id/respond` con payload `{ status: 'accepted' }`
  - El test debe verificar que con userId correcto, invitación pendiente válida, y payload correcto, la respuesta es HTTP 200
  - Ejecutar test en código SIN MODIFICAR
  - **RESULTADO ESPERADO**: Test FALLA con HTTP 400 (esto es correcto - prueba que el bug existe)
  - Documentar contraejemplos encontrados para entender la causa raíz:
    - Verificar tipo de userId extraído del JWT (¿es number, string, o undefined?)
    - Verificar que el decorador @GetClaim('sub') extrae correctamente el ID
    - Verificar que el payload DTO pasa la validación
    - Verificar logs del controller y service para identificar punto exacto de fallo
  - Marcar tarea como completa cuando el test esté escrito, ejecutado, y el fallo esté documentado
  - _Requirements: 1.1, 1.2, 1.3, 1.4_

- [x] 2. Escribir tests de preservación (ANTES de implementar la corrección)
  - **Property 2: Preservation** - Non-Accept Invitation Operations
  - **IMPORTANTE**: Seguir metodología observation-first
  - Observar comportamiento en código SIN MODIFICAR para operaciones que NO son aceptar invitaciones:
    - Rechazar invitaciones (status: 'rejected') retorna HTTP 200
    - GET /group-invitations/pending/:userId retorna lista correctamente
    - GET /group-invitations/sent/:userId retorna lista correctamente
    - DELETE /group-invitations/:id cancela invitación correctamente
    - POST /group-invitations envía invitación correctamente
    - Validaciones de permisos (403 si no es el invitado)
    - Validaciones de estado (400 si invitación ya fue respondida, 404 si no existe)
  - Escribir property-based tests capturando los comportamientos observados de Preservation Requirements
  - Property-based testing genera muchos casos de prueba para garantías más fuertes
  - Ejecutar tests en código SIN MODIFICAR
  - **RESULTADO ESPERADO**: Tests PASAN (esto confirma el comportamiento base a preservar)
  - Marcar tarea como completa cuando los tests estén escritos, ejecutados, y pasando en código sin modificar
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7_

- [x] 3. Corrección para aceptación de invitaciones de grupo

  - [x] 3.1 Implementar corrección en backend controller
    - Agregar conversión defensiva de tipo en `group-invitations.controller.ts` método `respondToInvitation`
    - Convertir userId de string a number si es necesario: `const numericUserId = typeof userId === 'string' ? parseInt(userId, 10) : userId;`
    - Validar que la conversión es exitosa: `if (isNaN(numericUserId) || numericUserId <= 0) throw new BadRequestException('Invalid user ID from JWT token')`
    - Agregar logs de diagnóstico para debugging: `console.log('[GroupInvitations] respondToInvitation called', { invitationId: id, userId, userIdType: typeof userId, respondDto })`
    - Agregar try/catch con logging de errores: `console.error('[GroupInvitations] Error responding to invitation', error)`
    - Pasar `numericUserId` al servicio en lugar de `userId` directamente
    - _Bug_Condition: isBugCondition(input) donde input.response === 'accepted' AND invitationExists(input.invitationId) AND invitationStatus === 'pending' AND userIsInvitee(input.token, input.invitationId)_
    - _Expected_Behavior: HTTP 200, invitation.status === 'accepted', membership creada con is_admin: false, eventos WebSocket emitidos_
    - _Preservation: Operaciones de rechazo, obtención de invitaciones, validaciones de permisos, y otros endpoints deben funcionar idénticamente_
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7_

  - [x] 3.2 Implementar validación defensiva en backend service
    - Agregar validación de tipo en `group-invitations.service.ts` método `respondToInvitation`
    - Validar que userId es number válido: `if (typeof userId !== 'number' || isNaN(userId) || userId <= 0) throw new BadRequestException('Invalid user ID. Must be a positive integer.')`
    - Agregar logs de diagnóstico en cada punto de validación: `console.log('[GroupInvitations Service] Validating invitation', { invitationId, userId, invitation })`
    - Verificar que los mensajes de error son descriptivos y claros
    - _Bug_Condition: isBugCondition(input) from design_
    - _Expected_Behavior: expectedBehavior(result) from design_
    - _Preservation: Preservation Requirements from design_
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 3.1, 3.2, 3.3, 3.4_

  - [x] 3.3 Mejorar manejo de errores en frontend (opcional)
    - Agregar logs de diagnóstico en `groups.service.ts` método `respondToInvitation`
    - Log de petición: `console.log('[GroupsService] Responding to invitation', { invitationId, response, endpoint, payload })`
    - Log de error mejorado: `console.error('[GroupsService] Error responding to invitation', { invitationId, response, error: error.response?.data || error.message, status: error.response?.status })`
    - Esto ayudará a diagnosticar problemas futuros más rápidamente
    - _Requirements: 2.6_

  - [x] 3.4 Verificar que el test de Bug Condition ahora pasa
    - **Property 1: Expected Behavior** - Accept Group Invitation Successfully
    - **IMPORTANTE**: Re-ejecutar el MISMO test del paso 1 - NO escribir un test nuevo
    - El test del paso 1 codifica el comportamiento esperado
    - Cuando este test pase, confirma que el Expected Behavior está satisfecho
    - Ejecutar test de bug condition exploration del paso 1
    - **RESULTADO ESPERADO**: Test PASA (confirma que el bug está corregido)
    - Verificar que la respuesta es HTTP 200
    - Verificar que invitation.status === 'accepted'
    - Verificar que se creó la membresía con is_admin: false
    - Verificar que se emitieron eventos WebSocket apropiados
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

  - [x] 3.5 Verificar que los tests de preservación siguen pasando
    - **Property 2: Preservation** - Non-Accept Invitation Operations
    - **IMPORTANTE**: Re-ejecutar los MISMOS tests del paso 2 - NO escribir tests nuevos
    - Ejecutar property-based tests de preservación del paso 2
    - **RESULTADO ESPERADO**: Tests PASAN (confirma que no hay regresiones)
    - Confirmar que todas las operaciones que NO son aceptar invitaciones funcionan idénticamente:
      - Rechazar invitaciones retorna HTTP 200
      - GET endpoints retornan datos correctamente
      - DELETE cancela invitaciones correctamente
      - POST envía invitaciones correctamente
      - Validaciones de permisos y estado funcionan correctamente
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7_

- [ ] 4. Checkpoint - Asegurar que todos los tests pasan
  - Ejecutar todos los tests del módulo group-invitations
  - Verificar que no hay regresiones en otros módulos
  - Si surgen preguntas o problemas, consultar con el usuario antes de proceder
