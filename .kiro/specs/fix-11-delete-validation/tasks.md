# FIX-11: Plan de Implementación - Task Breakdown

**Fecha**: 23 de Marzo, 2026  
**Estado**: Desglose de Tareas  
**Versión**: 1.0.0  
**Épica**: FIX-11: FEN Validation on Delete  

---

## 🎯 Resumen Ejecutivo

Plan de ejecución estructurado en **2 Tareas Principales** para resolver el falso positivo al eliminar eventos. El cambio es quirúrgico: modificar la validación FEN para operaciones DELETE sin afectar GET/POST/PUT.

---

## 📋 Matriz de Tareas

| ID | Tarea | Prioridad | Estimado | Estado | Bloqueantes |
|---|---|---|---|---|---|
| T-1 | Modificar `deleteEvent()` en events.service.ts | 🔴 CRÍTICA | 1h | ⏳ Not Started | - |
| T-2 | Ejecutar test e actualizar AGENTS.md | 🟠 ALTA | 0.5h | ⏳ Not Started | T-1 |

**Estimado Total**: 1.5 horas de desarrollo + testing

---

## 🔧 TAREA 1: Modificar `deleteEvent()` - Validación Relajada

### Objetivo

Permitir que `deleteEvent()` acepte respuestas sin campos estrictos de Event.

### Subtareas

#### 1.1 - Inspeccionar Método Actual `deleteEvent()`

**Archivo**: `src/features/events/services/events.service.ts` (línea ~215)

**Estado Actual**:
```typescript
async deleteEvent(id_event: number): Promise<boolean> {
  try {
    const response = await api.delete<FENResponse<{ deleted: boolean }>>(
      EVENTS_ENDPOINTS.DELETE_EVENT(id_event)
    );

    // ❌ PROBLEMA: Valida campos estrictos para DELETE
    const validatedResponse = this.validateFENResponse<{ deleted: boolean }>(response.data);

    if (!validatedResponse.success || !validatedResponse.data?.deleted) {
      throw new Error(
        validatedResponse.error?.message || 'Error al eliminar evento'
      );
    }

    return true;
  } catch (error: unknown) {
    // Error handling...
  }
}
```

**Problema**:
- Llama `validateFENResponse` sin indicar que es DELETE
- El validador asume que `data` debe tener campos de Event
- Falla porque DELETE devuelve `data: null` o `{ deleted: true }`

---

#### 1.2 - Definir Tipo para Respuesta DELETE

**Archivo**: `src/features/events/types/event.types.ts` (o crear si no existe)

**Código a Agregar**:

```typescript
/**
 * FIX-11: Response type for DELETE operations
 * Different from Event because DELETE doesn't return entity fields
 */
export interface DeleteResponse {
  deleted: boolean;
}

/**
 * FIX-11: Flexible FEN response for DELETE operations
 * Allows data to be null, empty object, or minimal deletion confirmation
 */
export interface DeleteFENResponse extends FENResponse<DeleteResponse | null> {
  // Inherits FEN structure but allows null or { deleted: boolean }
}
```

**Criterio de Aceptación**:
- ✓ Tipos compilados sin errores
- ✓ Diferenciados de Event para claridad semántica
- ✓ Documentados con comentarios FIX-11

---

#### 1.3 - Modificar `validateFENResponse()` para Soportar Bypass

**Archivo**: `src/features/events/services/events.service.ts` (línea ~352)

**Cambios Esperados**:

```typescript
/**
 * Validate FEN response format with context-aware validation
 * 
 * FIX-11: Support relaxed validation for DELETE operations
 * DELETE operations don't require Event fields since they only confirm deletion,
 * not return the entity.
 * 
 * @param response - Raw response from backend
 * @param skipStrictFieldValidation - If true, skip Field validation (for DELETE)
 * @returns Validated FEN response
 * @throws Error if validation fails
 */
private validateFENResponse<T>(
  response: any,
  skipStrictFieldValidation: boolean = false // ← NEW PARAMETER
): FENResponse<T> {
  try {
    // 1. Check if response has FEN structure
    if (!this.isFENFormat(response)) {
      throw new Error('Respuesta del servidor en formato inválido');
    }

    // 2. Validate success field (required for all operations)
    if (typeof response.success !== 'boolean') {
      throw new Error('Respuesta del servidor en formato inválido: campo success inválido');
    }

    // 3. Validate metadata (required for all operations)
    if (!response.metadata || typeof response.metadata !== 'object') {
      throw new Error('Respuesta del servidor en formato inválido: metadata faltante');
    }

    const metadata = response.metadata;
    if (
      typeof metadata.total !== 'number' ||
      typeof metadata.page !== 'number' ||
      typeof metadata.pageSize !== 'number' ||
      typeof metadata.hasNextPage !== 'boolean' ||
      typeof metadata.hasPreviousPage !== 'boolean'
    ) {
      throw new Error('Respuesta del servidor en formato inválido: metadata incompleta');
    }

    // 4. Validate success/error coherence (required for all operations)
    if (response.success && response.error !== null) {
      throw new Error('Respuesta del servidor en formato inválido: error debe ser null cuando success es true');
    }
    
    if (!response.success && !response.error) {
      throw new Error('Respuesta del servidor en formato inválido: error requerido cuando success es false');
    }

    // 5. FIX-11: CONDITIONALLY validate data fields based on operation
    // For GET/POST/PUT: Validate strict fields
    // For DELETE: Skip field validation (data: null or minimal confirmation)
    if (response.success && !skipStrictFieldValidation) {
      // For array responses (GET /events)
      if (Array.isArray(response.data)) {
        response.data.forEach((event: any, index: number) => {
          const requiredFields = ['id_event', 'title', 'description', 'date', 'time', 'location', 'type', 'createdAt', 'updatedAt'];
          for (const field of requiredFields) {
            if (!(field in event)) {
              throw new Error(
                `Respuesta del servidor en formato inválido: evento ${index} falta campo ${field}`
              );
            }
          }
        });
      }
      // For single object responses (POST /events, PUT /events/:id)
      else if (response.data && typeof response.data === 'object') {
        const requiredFields = ['id_event', 'title', 'description', 'date', 'time', 'location', 'type', 'createdAt', 'updatedAt'];
        for (const field of requiredFields) {
          if (!(field in response.data)) {
            throw new Error(
              `Respuesta del servidor en formato inválido: falta campo ${field}`
            );
          }
        }
      }
    }
    // FIX-11: For DELETE operations (skipStrictFieldValidation=true)
    // Only validate that data is null or an object, not specific fields
    else if (response.success && skipStrictFieldValidation) {
      if (response.data !== null && typeof response.data !== 'object') {
        throw new Error('Respuesta del servidor en formato inválido: data debe ser null u objeto para DELETE');
      }
    }

    return response as FENResponse<T>;
  } catch (error: any) {
    // Log validation errors
    this.logError(error, 'validateFENResponse', { response });
    throw error;
  }
}
```

**Criterio de Aceptación**:
- ✓ Nuevo parámetro `skipStrictFieldValidation` documentado
- ✓ DELETE puede pasar `true` para saltar validación de campos
- ✓ GET/POST/PUT siguen pasando `false` (default)
- ✓ Validación FEN base (success, error, metadata) SIEMPRE aplicada
- ✓ Cero `any` en tipos

---

#### 1.4 - Actualizar `deleteEvent()` para Usar Bypass

**Archivo**: `src/features/events/services/events.service.ts` (línea ~215)

**Cambios Esperados**:

```typescript
/**
 * ⭐ Delete an event (only owner or superadmin)
 * FIX-11: Uses relaxed FEN validation because DELETE doesn't return Event entity
 * 
 * @param id_event - Event ID to delete
 * @returns Promise<boolean> - true if deleted successfully
 */
async deleteEvent(id_event: number): Promise<boolean> {
  try {
    console.log(`[EventsService] Deleting event ${id_event} with relaxed FEN validation`);

    // Make HTTP DELETE request
    const response = await api.delete<DeleteFENResponse>(
      EVENTS_ENDPOINTS.DELETE_EVENT(id_event)
    );

    // FIX-11: Pass skipStrictFieldValidation=true for DELETE operations
    // DELETE responses don't need to contain Event fields (like id_event, title, etc)
    // Only need to confirm success: true and error: null
    const validatedResponse = this.validateFENResponse<DeleteResponse | null>(
      response.data,
      true // ← Skip field validation for DELETE
    );

    // Check if deletion was successful
    if (!validatedResponse.success) {
      throw new Error(
        validatedResponse.error?.message || 'Error al eliminar evento'
      );
    }

    console.log(`[EventsService] Event ${id_event} deleted successfully`);
    return true;

  } catch (error: unknown) {
    // Log error with context
    this.logError(error, 'deleteEvent', { id_event });

    // Handle network errors
    if (error && typeof error === 'object' && 'code' in error) {
      const axiosError = error as { code?: string; message?: string };
      if (axiosError.code === 'ECONNABORTED' || axiosError.message?.includes('timeout')) {
        return false; // Network timeout
      }
    }

    // Handle other errors
    console.error(`[EventsService] Failed to delete event ${id_event}:`, error);
    return false;
  }
}
```

**Criterio de Aceptación**:
- ✓ Llama `validateFENResponse(..., true)` para skip fields
- ✓ Logging claro indicando "relaxed FEN validation"
- ✓ Solo verifica `success: true`
- ✓ Retorna `false` en caso de error (sin throw)
- ✓ Logging de éxito/fallo detallado

---

#### 1.5 - Verificar Otros Métodos NO Usan Bypass

**Archivos a Inspeccionar**:
- `getEvents()` - Debe pasar `false` (default)
- `getEventById()` - Debe pasar `false` (default)
- `createEvent()` - Debe pasar `false` (default)
- `updateEvent()` - Debe pasar `false` (default)

**Cambio Mínimo**:
```typescript
// Todos estos OMITEN el segundo parámetro (default = false, validación estricta)
const validatedResponse = this.validateFENResponse<Event>(response.data);
// No agregar ", false" porque es el default
```

**Criterio de Aceptación**:
- ✓ GET/POST/PUT siguen con validación estricta
- ✓ Solo DELETE usa `skipStrictFieldValidation = true`

---

### Validación de Tarea 1

```bash
# Tests esperados:
- ✓ deleteEvent() con respuesta { success: true, data: null } → Éxito
- ✓ deleteEvent() con respuesta { success: true, data: {deleted: true}} → Éxito
- ✓ deleteEvent() con respuesta { success: false, ... } → Error
- ✓ getEvents() sigue validando campos estrictos
- ✓ createEvent() sigue validando campos estrictos
- ✓ updateEvent() sigue validando campos estrictos
```

---

## ✅ TAREA 2: Test Conceptual y Documentación

### Objetivo

Validar que el fix funciona en el emulador y documentar en AGENTS.md.

### Subtareas

#### 2.1 - Prueba Manual en Emulador

**Pasos**:
1. Compilar frontend: `npm run start` o `expo start`
2. Navegar a pantalla de eventos
3. Crear un evento de prueba
4. Intentar eliminar el evento
5. Verificar que:
   - ✅ No hay error `"falta campo id_event"`
   - ✅ Evento desaparece de la lista
   - ✅ EventsStore se actualiza correctamente
   - ✅ UI se refresca sin crashes

**Evidencia Esperada en Logs**:
```
[EventsService] Deleting event 1 with relaxed FEN validation
[EventsService] Event 1 deleted successfully
🔄 EventsScreen re-rendered
```

---

#### 2.2 - Actualizar AGENTS.md

**Ubicación**: Sección "Frontend / Configuración HTTP"

**Párrafo a Agregar**:

```markdown
### FIX-11: Context-Aware FEN Validation for DELETE Operations

**Problema Original**: Cuando se eliminaba un evento, el validador FEN (`validateFENResponse`) exigía que la respuesta DELETE contuviera los campos completos del modelo Event (id_event, title, description, etc). Sin embargo, DELETE típicamente devuelve solo un mensaje de confirmación o null, causando error "falta campo id_event".

**Solución Implementada**:
- **Validación Context-Aware**: El método `validateFENResponse()` ahora acepta parámetro `skipStrictFieldValidation`
- **Para GET/POST/PUT**: Validación estricta - requiere todos los campos de Event
- **Para DELETE**: Validación relajada - solo verifica `success: true` y `error: null`, no campos específicos
- **Lógica**: DELETE confirma borrado, no devuelve entidad. GET/POST/PUT devuelven entidades completas.
- **Ubicación**: `src/features/events/services/events.service.ts` (deleteEvent, validateFENResponse)
- **Documentación**: `.kiro/specs/fix-11-delete-validation/` (requirements.md, design.md, tasks.md)

**Patrón**:
```typescript
// DELETE: Validación relajada (sin campos estrictos)
const validated = this.validateFENResponse(response.data, true);

// GET/POST/PUT: Validación estricta (con campos requeridos)
const validated = this.validateFENResponse(response.data);
```

**Tipado Estricto**: Nueva interfaz `DeleteResponse` y `DeleteFENResponse` para claridad semántica.
```

**Criterio de Aceptación**:
- ✓ Documentación clara y concisa
- ✓ Explicación del problema y solución
- ✓ Referencias a directorio `.kiro/specs/fix-11-delete-validation/`
- ✓ Ubicación correcta en AGENTS.md

---

### Validación de Tarea 2

```bash
# Validar:
- ✓ Emulador: Sin error al eliminar evento
- ✓ UI: Evento removido de la lista
- ✓ Store: EventsStore actualizado
- ✓ AGENTS.md: Documentación agregada
- ✓ Logs: Mensajes claros indicando validación relajada
```

---

## 📊 Matriz de Dependencias

```
┌──────────────┐
│     T-1      │
│   Modificar  │
│  deleteEvent │
│   + Bypass   │
└──────┬───────┘
       │
    ┌──┴───┐
    │      │
┌───▼─┐ ┌──▼──┐
│ 1.1 │ │1.2  │ (Inspeccionar)  (Tipos)
└─┬──┘ └──┬──┘
  │       │
┌─▼─────┐│
│ 1.3   ││ (Modificar validateFEN)
│ 1.4   │└────────┐
└─┬─────┘         │
  │               │
┌─▼──────────┐ ┌──▼──────────┐
│   DELETE   │ │ GET/POST/PUT │
│ (Relajada) │ │  (Estricta)  │
└─┬──────────┘ └──────────────┘
  │
┌─▼─────┐
│  T-2  │
│ Test  │
│  &    │
│ Docs  │
└───────┘
```

---

## ⏱️ Estimación de Tiempo

| Subtarea | Estimado | Incluye |
|----------|----------|---------|
| 1.1 Inspeccionar | 5 min | Lectura de código |
| 1.2 Definir tipos | 10 min | Nuevas interfaces |
| 1.3 Modificar validateFEN | 25 min | Lógica + documentación |
| 1.4 Actualizar deleteEvent | 10 min | Cambios mínimos |
| 1.5 Verificar otros métodos | 5 min | Inspección |
| 2.1 Test manual | 10 min | Emulador |
| 2.2 AGENTS.md | 5 min | Documentación |
| **Total** | **70 min** | **~1.1 horas** |

---

## 🎯 Definición de "Listo para Producción"

**Requisitos previos al Merge a `main`:**

- ✅ T-1 completado (código modificado)
- ✅ T-2 completado (test exitoso)
- ✅ Sin error de validación al eliminar eventos
- ✅ Evento removido correctamente de EventsStore
- ✅ GET/POST/PUT siguen validando campos estrictos
- ✅ Logging claro de operación DELETE
- ✅ AGENTS.md actualizado con FIX-11
- ✅ Cero `any` types en nuevos código
- ✅ Code Review aprobado (1 revisor)

---

## 📝 Checklist de Ejecución

### Tarea 1: Modificar deleteEvent()
- [ ] 1.1 Inspeccionar método actual
- [ ] 1.2 Definir tipos DeleteResponse / DeleteFENResponse
- [ ] 1.3 Modificar validateFENResponse (agregar parámetro)
- [ ] 1.4 Actualizar deleteEvent (pasar parámetro true)
- [ ] 1.5 Verificar otros métodos usan default
- [ ] ✅ Validación de T-1

### Tarea 2: Test y Documentación
- [ ] 2.1 Prueba manual en emulador
- [ ] 2.2 Actualizar AGENTS.md
- [ ] ✅ Validación de T-2

---

**Versión**: 1.0.0  
**Estado**: Listo para Implementación  
**Próximo Paso**: Iniciar Tarea T-1
