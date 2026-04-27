# Fix-14 Group Invitation Accept Bugfix Design

## Overview

Este documento formaliza el análisis y la estrategia de corrección para el bug que impide a los usuarios aceptar invitaciones de grupo desde el frontend React Native. La petición HTTP PATCH falla con error 400 (Bad Request), a pesar de que el payload enviado parece ser correcto según la especificación del DTO backend.

El análisis revela múltiples hipótesis de causa raíz que deben ser exploradas sistemáticamente mediante tests exploratorios antes de implementar la corrección. La estrategia sigue el enfoque de bug condition methodology, donde primero confirmamos o refutamos cada hipótesis mediante tests en código sin modificar, y luego implementamos la corrección mínima necesaria.

## Glossary

- **Bug_Condition (C)**: La condición que desencadena el bug - cuando un usuario autenticado intenta aceptar una invitación de grupo válida desde el frontend React Native
- **Property (P)**: El comportamiento deseado cuando se acepta una invitación - la petición debe completarse con HTTP 200, actualizar el estado a "accepted", y crear la membresía
- **Preservation**: Comportamientos existentes que deben permanecer sin cambios - rechazo de invitaciones, validaciones de permisos, manejo de invitaciones ya respondidas
- **respondToInvitation**: El método en `group-invitations.service.ts` que procesa la respuesta a una invitación
- **RespondGroupInvitationDto**: El DTO que valida el payload de la petición, esperando `{ status: 'accepted' | 'rejected' }`
- **JwtAuthGuard**: Guard que valida el JWT y extrae el payload del usuario
- **@GetClaim('sub')**: Decorador que extrae el user ID del JWT payload
- **ValidationPipe**: Pipe global de NestJS que valida DTOs con configuración `whitelist: true, forbidNonWhitelisted: true, transform: true`

## Bug Details

### Bug Condition

El bug se manifiesta cuando un usuario autenticado intenta aceptar una invitación de grupo válida desde el frontend React Native. La petición HTTP PATCH a `/group-invitations/:id/respond` falla con error 400 (Bad Request), impidiendo que el usuario se una al grupo.

**Formal Specification:**
```
FUNCTION isBugCondition(input)
  INPUT: input of type { invitationId: number, response: 'accepted' | 'rejected', token: string }
  OUTPUT: boolean
  
  RETURN input.response === 'accepted'
         AND invitationExists(input.invitationId)
         AND invitationStatus === 'pending'
         AND userIsInvitee(input.token, input.invitationId)
         AND httpResponseCode === 400
END FUNCTION
```

### Examples

- **Ejemplo 1**: Usuario con ID 5 intenta aceptar invitación ID 10 que le pertenece y está pendiente
  - **Esperado**: HTTP 200, invitación actualizada a "accepted", membresía creada
  - **Actual**: HTTP 400, error "Request failed with status code 400"

- **Ejemplo 2**: Usuario con ID 3 intenta rechazar invitación ID 8 que le pertenece
  - **Esperado**: HTTP 200, invitación actualizada a "rejected"
  - **Actual**: Funciona correctamente (comportamiento inconsistente)

- **Ejemplo 3**: Usuario intenta aceptar invitación con payload `{ status: 'accepted' }`
  - **Esperado**: Validación exitosa del DTO
  - **Actual**: HTTP 400, posible rechazo por ValidationPipe

- **Edge Case**: Usuario intenta aceptar invitación con token expirado
  - **Esperado**: HTTP 401 Unauthorized
  - **Actual**: Podría estar retornando HTTP 400 si el token refresh falla

## Expected Behavior

### Preservation Requirements

**Unchanged Behaviors:**
- Rechazar invitaciones debe continuar funcionando correctamente con HTTP 200
- Validación de permisos debe seguir retornando HTTP 403 si el usuario no es el invitado
- Validación de estado debe seguir retornando HTTP 400 si la invitación ya fue respondida
- Validación de existencia debe seguir retornando HTTP 404 si la invitación no existe
- Emisión de eventos WebSocket debe continuar funcionando para notificaciones
- Otros endpoints de invitaciones (GET pending, POST send, DELETE cancel) deben seguir funcionando sin regresiones

**Scope:**
Todas las peticiones que NO involucran aceptar invitaciones de grupo deben ser completamente no afectadas por esta corrección. Esto incluye:
- Peticiones de rechazo de invitaciones
- Peticiones de otros endpoints de grupos
- Peticiones de otros módulos (eventos, mensajes, conexiones)

## Hypothesized Root Cause

Basado en el análisis del código, las causas más probables son:

### 1. **JWT User ID Extraction Issue** (Probabilidad: ALTA)
El decorador `@GetClaim('sub')` podría estar extrayendo un userId `undefined` o en formato incorrecto del JWT payload.

**Evidencia**:
- Según AGENTS.md (FIX-08, FIX-09), hubo problemas previos con extracción de user IDs del JWT
- El JWT payload tiene estructura: `{ "sub": 1, "permissions": [...], "roleName": "student" }`
- Si `userId` es `undefined`, la validación `invitation.invitee_id !== userId` siempre será true
- Esto causaría un ForbiddenException (403), pero podría ser capturado como 400 por algún interceptor

**Validación**:
- Agregar logs en el controller para verificar el valor de `userId` extraído
- Verificar que el token JWT contiene el claim 'sub' correctamente
- Confirmar que el tipo de `userId` es `number` y no `string` o `undefined`

### 2. **DTO Validation Failure** (Probabilidad: MEDIA)
El ValidationPipe global con `forbidNonWhitelisted: true` podría estar rechazando el payload por propiedades adicionales o formato incorrecto.

**Evidencia**:
- El frontend envía `{ status: 'accepted' }` según `groups.service.ts` línea 207
- El DTO espera exactamente `{ status: 'accepted' | 'rejected' }` con decoradores `@IsString()`, `@IsNotEmpty()`, `@IsIn(['accepted', 'rejected'])`
- El ValidationPipe tiene `transform: true`, lo que podría causar transformaciones inesperadas
- El interceptor de Axios podría estar agregando propiedades adicionales al body

**Validación**:
- Verificar el payload exacto que llega al controller mediante logs
- Confirmar que no hay propiedades adicionales en el body
- Verificar que el Content-Type header es 'application/json'

### 3. **Axios Interceptor Interference** (Probabilidad: BAJA)
El interceptor de Axios en `api.ts` podría estar modificando el body de la petición o causando problemas con el token refresh.

**Evidencia**:
- El interceptor tiene lógica compleja de token refresh con mutex y queue (FIX-10)
- Si el token está expirado, el interceptor intenta refrescarlo antes de enviar la petición
- Si el refresh falla, podría estar enviando la petición con un token inválido
- El interceptor agrega el header `Authorization: Bearer ${token}` automáticamente

**Validación**:
- Verificar logs del interceptor para confirmar que el token es válido
- Confirmar que el token no está expirado al momento de la petición
- Verificar que el interceptor no está modificando el body de la petición

### 4. **Service Layer Validation Issue** (Probabilidad: BAJA)
La lógica de validación en `group-invitations.service.ts` podría estar lanzando una excepción antes de procesar la petición.

**Evidencia**:
- El servicio valida que la invitación existe (línea 177-179)
- El servicio valida que el usuario es el invitado (línea 182-186)
- El servicio valida que la invitación está pendiente (línea 189-193)
- Cualquiera de estas validaciones podría estar fallando y lanzando una excepción

**Validación**:
- Agregar logs en cada punto de validación del servicio
- Confirmar que la invitación existe y está en estado 'pending'
- Confirmar que el userId coincide con invitation.invitee_id

## Correctness Properties

Property 1: Bug Condition - Accept Group Invitation Successfully

_For any_ HTTP PATCH request to `/group-invitations/:id/respond` where the user is authenticated, the invitation exists, the invitation status is 'pending', the user is the invitee, and the payload is `{ status: 'accepted' }`, the fixed endpoint SHALL return HTTP 200, update the invitation status to 'accepted', create a membership with `is_admin: false`, and emit appropriate WebSocket events.

**Validates: Requirements 2.1, 2.2, 2.3, 2.4, 2.5**

Property 2: Preservation - Non-Accept Invitation Operations

_For any_ HTTP request to group invitation endpoints that is NOT an accept invitation request (reject invitations, get pending invitations, send invitations, cancel invitations), the fixed code SHALL produce exactly the same behavior as the original code, preserving all existing functionality for non-accept operations.

**Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7**

## Fix Implementation

### Changes Required

Asumiendo que nuestra hipótesis de causa raíz es correcta (JWT User ID Extraction Issue):

**File**: `Uniconnect-Backend-Core/src/group-invitations/group-invitations.controller.ts`

**Function**: `respondToInvitation`

**Specific Changes**:
1. **Add Defensive Type Conversion**: Convertir explícitamente el userId de string a number si es necesario
   ```typescript
   const numericUserId = typeof userId === 'string' ? parseInt(userId, 10) : userId;
   
   if (isNaN(numericUserId) || numericUserId <= 0) {
     throw new BadRequestException('Invalid user ID from JWT token');
   }
   ```

2. **Add Diagnostic Logging**: Agregar logs para debugging en el controller
   ```typescript
   console.log('[GroupInvitations] respondToInvitation called', {
     invitationId: id,
     userId,
     userIdType: typeof userId,
     respondDto,
   });
   ```

3. **Validate DTO Before Service Call**: Asegurar que el DTO está correctamente validado
   - El ValidationPipe ya maneja esto, pero agregar log para confirmar

4. **Add Error Handling**: Mejorar el manejo de errores para retornar mensajes descriptivos
   ```typescript
   try {
     return await this.groupInvitationsService.respondToInvitation(
       id,
       numericUserId,
       respondDto,
     );
   } catch (error) {
     console.error('[GroupInvitations] Error responding to invitation', error);
     throw error;
   }
   ```

**File**: `Uniconnect-Backend-Core/src/group-invitations/group-invitations.service.ts`

**Function**: `respondToInvitation`

**Specific Changes**:
1. **Add Defensive Validation**: Validar que userId es un número válido
   ```typescript
   if (typeof userId !== 'number' || isNaN(userId) || userId <= 0) {
     throw new BadRequestException('Invalid user ID. Must be a positive integer.');
   }
   ```

2. **Add Diagnostic Logging**: Agregar logs en cada punto de validación
   ```typescript
   console.log('[GroupInvitations Service] Validating invitation', {
     invitationId,
     userId,
     invitation: invitation ? { id: invitation.id_invitation, invitee_id: invitation.invitee_id, status: invitation.status } : null,
   });
   ```

3. **Improve Error Messages**: Retornar mensajes de error más descriptivos
   - Ya implementado, pero verificar que los mensajes son claros

**File**: `Uniconnect-Frontend/src/features/groups/services/groups.service.ts`

**Function**: `respondToInvitation`

**Specific Changes** (si es necesario):
1. **Add Request Logging**: Agregar logs para debugging
   ```typescript
   console.log('[GroupsService] Responding to invitation', {
     invitationId,
     response,
     endpoint: groupInvitationsEndpoints.respondToInvitation(invitationId),
     payload: { status: response },
   });
   ```

2. **Improve Error Handling**: Capturar y loggear el error completo
   ```typescript
   catch (error) {
     console.error('[GroupsService] Error responding to invitation', {
       invitationId,
       response,
       error: error.response?.data || error.message,
       status: error.response?.status,
     });
     throw error;
   }
   ```

## Testing Strategy

### Validation Approach

La estrategia de testing sigue un enfoque de dos fases: primero, ejecutar tests exploratorios en el código SIN MODIFICAR para confirmar o refutar las hipótesis de causa raíz. Segundo, implementar la corrección y verificar que el bug está resuelto y que no hay regresiones.

### Exploratory Bug Condition Checking

**Goal**: Confirmar o refutar las hipótesis de causa raíz ANTES de implementar la corrección. Si refutamos todas las hipótesis, necesitaremos re-analizar el problema.

**Test Plan**: Escribir tests que simulen la petición de aceptar invitación con diferentes escenarios de entrada. Ejecutar estos tests en el código UNFIXED para observar fallos y entender la causa raíz exacta.

**Test Cases**:
1. **Valid Accept Request Test**: Simular petición válida con userId correcto, invitación pendiente, y payload correcto (fallará en código unfixed con 400)
2. **JWT User ID Type Test**: Verificar que el userId extraído del JWT es de tipo number y no string o undefined (podría fallar en código unfixed)
3. **DTO Validation Test**: Verificar que el payload `{ status: 'accepted' }` pasa la validación del DTO (debería pasar incluso en código unfixed)
4. **Service Validation Test**: Verificar que todas las validaciones del servicio pasan con datos válidos (podría fallar si userId es undefined)

**Expected Counterexamples**:
- El userId extraído del JWT es `undefined` o de tipo `string` en lugar de `number`
- La validación `invitation.invitee_id !== userId` falla porque userId es undefined
- El ValidationPipe rechaza el payload por alguna razón no obvia
- Posibles causas: decorador @GetClaim incorrecto, JWT payload mal formado, interceptor modificando la petición

### Fix Checking

**Goal**: Verificar que para todas las peticiones donde la bug condition se cumple, el endpoint corregido produce el comportamiento esperado.

**Pseudocode:**
```
FOR ALL input WHERE isBugCondition(input) DO
  result := respondToInvitation_fixed(input.invitationId, input.response, input.token)
  ASSERT result.statusCode === 200
  ASSERT result.invitation.status === 'accepted'
  ASSERT membershipCreated(input.userId, input.groupId)
  ASSERT eventsEmitted(['GROUP_INVITATION_ACCEPTED', 'USER_JOINED_GROUP'])
END FOR
```

### Preservation Checking

**Goal**: Verificar que para todas las peticiones donde la bug condition NO se cumple, el endpoint corregido produce el mismo resultado que el endpoint original.

**Pseudocode:**
```
FOR ALL input WHERE NOT isBugCondition(input) DO
  ASSERT respondToInvitation_original(input) = respondToInvitation_fixed(input)
END FOR
```

**Testing Approach**: Property-based testing es recomendado para preservation checking porque:
- Genera muchos casos de prueba automáticamente a través del dominio de entrada
- Captura edge cases que los unit tests manuales podrían perder
- Proporciona garantías fuertes de que el comportamiento no cambia para todas las entradas no-buggy

**Test Plan**: Observar comportamiento en código UNFIXED primero para operaciones de rechazo, obtención de invitaciones, y otras operaciones, luego escribir property-based tests capturando ese comportamiento.

**Test Cases**:
1. **Reject Invitation Preservation**: Observar que rechazar invitaciones funciona correctamente en código unfixed, luego verificar que continúa funcionando después de la corrección
2. **Get Pending Invitations Preservation**: Verificar que obtener invitaciones pendientes funciona correctamente antes y después de la corrección
3. **Permission Validation Preservation**: Verificar que las validaciones de permisos (403, 404, 400 para invitaciones ya respondidas) funcionan correctamente antes y después
4. **Other Endpoints Preservation**: Verificar que otros endpoints de grupos y módulos no son afectados por la corrección

### Unit Tests

- Test de extracción de userId del JWT con diferentes formatos de token
- Test de validación del DTO con diferentes payloads (válidos e inválidos)
- Test de validaciones del servicio con diferentes estados de invitación
- Test de creación de membresía cuando la invitación es aceptada
- Test de emisión de eventos WebSocket

### Property-Based Tests

- Generar invitaciones aleatorias y verificar que aceptar invitaciones válidas siempre funciona
- Generar usuarios aleatorios y verificar que solo el invitado puede responder
- Generar estados aleatorios de invitación y verificar que solo invitaciones pendientes pueden ser respondidas
- Generar payloads aleatorios y verificar que solo payloads válidos son aceptados

### Integration Tests

- Test de flujo completo: crear invitación → aceptar invitación → verificar membresía creada
- Test de flujo completo: crear invitación → rechazar invitación → verificar que no se crea membresía
- Test de notificaciones WebSocket cuando una invitación es aceptada
- Test de actualización de UI en el frontend cuando una invitación es aceptada
