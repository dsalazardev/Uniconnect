# Bugfix Requirements Document

## Introduction

Este documento describe el bug en el proceso de validación de estado de invitaciones de grupo. Cuando un usuario intenta aceptar una invitación que debería estar en estado 'pending', el sistema rechaza la petición con el error "Esta invitación ya fue respondida anteriormente" (HTTP 400), impidiendo que el usuario se una al grupo.

El error se origina en la validación de estado en `group-invitations.service.ts` línea 201, donde se verifica que `invitation.status !== 'pending'`. Este bug sugiere que el estado de la invitación no refleja correctamente su estado real, posiblemente debido a procesamiento previo fallido, condiciones de carrera, o inconsistencias en la sincronización entre frontend y backend.

## Bug Analysis

### Current Behavior (Defect)

1.1 WHEN un usuario intenta aceptar una invitación de grupo (ID 3) mediante `PATCH /group-invitations/3/respond` con payload `{ status: 'accepted' }` THEN el sistema rechaza la petición con HTTP 400 y mensaje "Esta invitación ya fue respondida anteriormente"

1.2 WHEN la validación `if (invitation.status !== 'pending')` se ejecuta en línea 201 THEN el sistema determina que el estado no es 'pending' y lanza BadRequestException

1.3 WHEN el error 400 ocurre THEN el usuario no puede unirse al grupo y la invitación permanece en su estado actual sin cambios

1.4 WHEN existe una condición de carrera con múltiples peticiones concurrentes al mismo endpoint THEN el sistema puede procesar la invitación múltiples veces causando estados inconsistentes

1.5 WHEN una petición previa falló después de actualizar el estado pero antes de crear la membresía THEN la invitación queda en estado 'accepted' sin membresía correspondiente

### Expected Behavior (Correct)

2.1 WHEN un usuario intenta aceptar una invitación de grupo por primera vez THEN el sistema SHALL verificar que el estado sea 'pending' y procesar la petición exitosamente con HTTP 200

2.2 WHEN la validación de estado se ejecuta THEN el sistema SHALL consultar el estado actual de la invitación en la base de datos y validar que sea exactamente 'pending'

2.3 WHEN la invitación es válida y está en estado 'pending' THEN el sistema SHALL actualizar el estado a 'accepted', establecer `responded_at` a la fecha actual, y crear la membresía correspondiente en una transacción atómica

2.4 WHEN existen múltiples peticiones concurrentes al mismo endpoint THEN el sistema SHALL usar mecanismos de concurrencia (transacciones, locks) para garantizar que solo una petición procese la invitación

2.5 WHEN una operación falla después de actualizar el estado THEN el sistema SHALL revertir todos los cambios mediante rollback transaccional para mantener consistencia

2.6 WHEN el estado de la invitación no es 'pending' debido a procesamiento previo THEN el sistema SHALL retornar un mensaje de error descriptivo indicando el estado actual y la razón del rechazo

### Unchanged Behavior (Regression Prevention)

3.1 WHEN un usuario intenta aceptar una invitación que ya fue aceptada o rechazada previamente THEN el sistema SHALL CONTINUE TO retornar HTTP 400 con mensaje "Esta invitación ya fue respondida anteriormente"

3.2 WHEN un usuario intenta responder a una invitación que no le pertenece THEN el sistema SHALL CONTINUE TO retornar HTTP 403 (Forbidden) con mensaje "No tienes permiso para responder esta invitación"

3.3 WHEN un usuario intenta responder a una invitación inexistente THEN el sistema SHALL CONTINUE TO retornar HTTP 404 (Not Found) con mensaje "Invitación no encontrada"

3.4 WHEN una invitación es aceptada exitosamente THEN el sistema SHALL CONTINUE TO emitir eventos de WebSocket (GROUP_INVITATION_ACCEPTED, USER_JOINED_GROUP) para notificar a otros usuarios

3.5 WHEN se crea una membresía al aceptar una invitación THEN el sistema SHALL CONTINUE TO establecer `is_admin: false` y `joined_at` con la fecha actual

3.6 WHEN un usuario rechaza una invitación (status: 'rejected') THEN el sistema SHALL CONTINUE TO actualizar el estado sin crear membresía

3.7 WHEN el frontend envía otras peticiones a endpoints de invitaciones (GET pending, POST send, DELETE cancel) THEN el sistema SHALL CONTINUE TO funcionar correctamente sin regresiones

3.8 WHEN la conversión defensiva de JWT user ID se ejecuta en el controller THEN el sistema SHALL CONTINUE TO convertir strings a integers y validar correctamente (patrón FIX-14)


## Bug Condition Derivation

### Bug Condition Function

```pascal
FUNCTION isBugCondition(X)
  INPUT: X of type InvitationRespondInput
  OUTPUT: boolean
  
  // Returns true when the bug condition is met
  // X = { invitationId: number, userId: number, status: 'accepted' | 'rejected' }
  
  invitation ← database.findInvitation(X.invitationId)
  
  RETURN (
    invitation EXISTS AND
    invitation.invitee_id = X.userId AND
    invitation.status ≠ 'pending' AND
    X.status = 'accepted' AND
    // La invitación debería estar en 'pending' pero no lo está
    NOT EXISTS membership WHERE membership.id_user = X.userId AND membership.id_group = invitation.id_group
  )
END FUNCTION
```

**Explicación**: La condición de bug se cumple cuando:
1. La invitación existe y pertenece al usuario
2. El estado NO es 'pending' (causando el error HTTP 400)
3. El usuario intenta aceptar (no rechazar)
4. NO existe una membresía correspondiente (indicando que el procesamiento previo falló)

### Property Specification - Fix Checking

```pascal
// Property 1: Fix Checking - Invitaciones con Estado Inconsistente
FOR ALL X WHERE isBugCondition(X) DO
  result ← respondToInvitation'(X.invitationId, X.userId, X.status)
  
  ASSERT (
    // El sistema debe detectar y corregir el estado inconsistente
    (result.statusCode = 200 OR result.statusCode = 409) AND
    
    // Si se corrige, debe crear la membresía
    (result.statusCode = 200 IMPLIES 
      EXISTS membership WHERE 
        membership.id_user = X.userId AND 
        membership.id_group = result.data.id_group AND
        membership.is_admin = false
    ) AND
    
    // Si hay conflicto real, debe retornar mensaje descriptivo
    (result.statusCode = 409 IMPLIES 
      result.message CONTAINS "estado actual" OR
      result.message CONTAINS "ya es miembro"
    )
  )
END FOR
```

### Property Specification - Preservation Checking

```pascal
// Property 2: Preservation Checking - Operaciones No-Buggy
FOR ALL X WHERE NOT isBugCondition(X) DO
  ASSERT respondToInvitation(X) = respondToInvitation'(X)
END FOR
```

**Casos de Preservación**:
- Invitaciones en estado 'pending' legítimo → Deben procesarse normalmente
- Invitaciones ya respondidas con membresía existente → Deben rechazarse con HTTP 400
- Invitaciones que no pertenecen al usuario → Deben rechazarse con HTTP 403
- Invitaciones inexistentes → Deben rechazarse con HTTP 404
- Operaciones de rechazo (status: 'rejected') → Deben funcionar idénticamente

### Counterexample (Concrete Bug Instance)

```typescript
// Ejemplo concreto del bug reportado
const buggyInput = {
  invitationId: 3,
  userId: 1,
  status: 'accepted'
};

// Estado actual en BD (inconsistente)
const invitationInDB = {
  id_invitation: 3,
  id_group: 5,
  inviter_id: 2,
  invitee_id: 1,
  status: 'accepted',  // ❌ Ya está en 'accepted'
  invited_at: '2025-01-15T10:00:00Z',
  responded_at: '2025-01-15T10:05:00Z'  // ❌ Ya tiene responded_at
};

// Membresía NO existe (inconsistencia)
const membershipExists = false;  // ❌ Debería existir si status = 'accepted'

// Comportamiento actual (defecto)
const currentBehavior = {
  statusCode: 400,
  message: 'Esta invitación ya fue respondida anteriormente'
};

// Comportamiento esperado (correcto)
const expectedBehavior = {
  statusCode: 200,  // O 409 con mensaje descriptivo
  message: 'Invitación aceptada. Ahora eres miembro del grupo.',
  data: {
    membership: {
      id_user: 1,
      id_group: 5,
      is_admin: false,
      joined_at: '2025-01-15T10:10:00Z'
    }
  }
};
```

### Key Definitions

- **F**: Original (unfixed) function - `respondToInvitation()` actual que rechaza con HTTP 400
- **F'**: Fixed function - `respondToInvitation()` mejorado que detecta y corrige estados inconsistentes
- **C(X)**: Bug Condition - Invitación con estado no-'pending' pero sin membresía correspondiente
- **¬C(X)**: Non-buggy inputs - Invitaciones en estado consistente o con membresía existente
- **P(result)**: Property - Debe procesar exitosamente o retornar error descriptivo (no genérico HTTP 400)

### Root Cause Hypothesis

**Posibles causas del estado inconsistente**:

1. **Fallo Transaccional**: La operación actualizó `invitation.status` pero falló antes de crear `membership`
2. **Condición de Carrera**: Múltiples peticiones concurrentes procesaron la misma invitación
3. **Rollback Incompleto**: Un error causó rollback de `membership` pero no de `invitation.status`
4. **Operación Manual**: Alguien modificó el estado en BD sin crear la membresía correspondiente

**Estrategia de Fix**:
- Implementar transacciones atómicas con Prisma (`$transaction`)
- Agregar validación de membresía existente antes de rechazar
- Implementar idempotencia: si ya es miembro, retornar éxito
- Agregar logging detallado para debugging de estados inconsistentes
