# FIX-11: Requisitos - FEN Validation on Delete

**Fecha**: 23 de Marzo, 2026  
**Estado**: Especificación de Requisitos  
**Versión**: 1.0.0  
**Clasificación**: Crítico - Validación de Respuestas HTTP  
**Triggered By**: Falso positivo al eliminar eventos  

---

## 📋 Resumen Ejecutivo

Cuando el usuario intenta eliminar un evento, el backend procesa correctamente la solicitud DELETE, devuelve HTTP 200 OK con estatus `success: true`, pero el frontend rechaza la respuesta con el error:

```
Respuesta del servidor en formato inválido: falta campo id_event
```

**Causa Raíz**: El validador FEN (`validateFENResponse`) en `events.service.ts` asume que TODAS las respuestas exitosas deben contener los campos completos del modelo Event:
```typescript
const requiredFields = ['id_event', 'title', 'description', 'date', 'time', 'location', 'type', 'createdAt', 'updatedAt'];
```

Esta validación es correcta para GET y POST, pero **incorrecta para DELETE**, que típicamente devuelve solo un mensaje de confirmación o metadatos mínimos, no la entidad completa.

---

## 🎯 Requisitos Funcionales

### REQ-1: Flexibilidad en Validación FEN para Operaciones DELETE

**Objetivo**: Permitir respuestas DELETE con contenido mínimo sin fallar validación

**Especificación**:

- El método `deleteEvent` en `events.service.ts` debe aceptar respuestas DELETE con estructura **relajada**
- No exigir que `response.data` contenga los campos completos de Event (id_event, title, description, etc.)
- Solo validar que:
  - `success: true` esté presente
  - `response.metadata` sea válido
  - `response.error: null` (sin errores)
- Permitir que `response.data` sea:
  - `{ deleted: true }` (confirmación de borrado)
  - `null` (sin datos)
  - `{}` (objeto vacío)
  - Cualquier otra estructura que represente éxito del DELETE

**Validación**:
- ✓ DELETE retorna sin campos de Event completos → Aceptada
- ✓ DELETE retorna solo `{ deleted: true }` → Aceptada
- ✓ DELETE falla con `success: false` → Rechazada correctamente
- ✓ DELETE retorna datos malformados (ej: datos no son objeto) → Rechazada correctamente

---

### REQ-2: Preservar Validaciones Estrictas para GET/POST/PUT

**Objetivo**: No degradar validaciones para otras operaciones HTTP

**Especificación**:

- GET `/events` debe seguir validando que cada evento en el array tenga los campos requeridos
- GET `/events/:id` debe seguir validando que el objeto devuelto tenga los campos requeridos
- POST `/events` debe seguir validando que el evento creado tenga los campos requeridos
- PUT `/events/:id` debe seguir validando que el evento actualizado tenga los campos requeridos
- **SOLO** DELETE debe tener validación relajada

**Justificación**:
- GET/POST/PUT devuelven entidades completas que deben estar bien formadas
- DELETE devuelve confirmación, no entidades
- Diferentes operaciones, diferentes validaciones

---

### REQ-3: EventsStore debe Remover Evento Localmente tras DELETE Exitoso

**Objetivo**: Mantener consistencia entre estado local y servidor

**Especificación**:

- Cuando `deleteEvent()` retorna `true`, el `EventsStore` debe:
  1. Remover el evento del array `events` por `id_event`
  2. Decrementar el contador `totalCount` si existe
  3. Actualizar paginación si es necesario
  4. **Sin importar** los datos en `response.data`
  
- El éxito/fracaso solo se determina por:
  - `validatedResponse.success === true`
  - Sin errores en respuesta

---

## 🛡️ Requisitos No-Funcionales

### RNF-1: Tipado Estricto (CERO `any`)

- Definir interfaz `DeleteResponse` para respuestas de DELETE:
  ```typescript
  interface DeleteResponse {
    deleted: boolean;
  }
  
  interface DeleteFENResponse extends FENResponse<DeleteResponse | null> {
    // Las respuestas DELETE pueden tener data: null o { deleted: true }
  }
  ```

---

### RNF-2: Logging Consistente

- Loguear el tipo de validación aplicado:
  - `[EventsService] Validating DELETE response with relaxed validation`
  - `[EventsService] Validating GET response with strict validation`

---

### RNF-3: Arquitectura

Mantener la separación de concerns:
- **events.service.ts**: Validación HTTP + comunicación con backend
- **events.store.ts**: Lógica de estado local (no debe validar FEN)
- **EventsComponent**: Presentación

---

## 📊 Matriz de Trazabilidad

| Req ID | Componente | Método | Prioridad | Cambio |
|--------|-----------|--------|-----------|--------|
| REQ-1 | EventsService | `deleteEvent()` | 🔴 CRÍTICA | Relajar validación |
| REQ-1 | EventsService | `validateFENResponse()` | 🔴 CRÍTICA | Agregar parámetro de bypass |
| REQ-2 | EventsService | `getEvents()` | 🟠 ALTA | Mantener validación estricta |
| REQ-2 | EventsService | `getEventById()` | 🟠 ALTA | Mantener validación estricta |
| REQ-2 | EventsService | `createEvent()` | 🟠 ALTA | Mantener validación estricta |
| REQ-2 | EventsService | `updateEvent()` | 🟠 ALTA | Mantener validación estricta |
| REQ-3 | EventsStore | `deleteEvent()` | 🔴 CRÍTICA | Remover evento local |

---

## 🔍 Payload Analysis

### Respuesta Actual (Backend - Correcta)

```json
{
  "success": true,
  "data": null,
  "error": null,
  "metadata": {
    "total": 2,
    "page": 1,
    "pageSize": 20,
    "hasNextPage": false,
    "hasPreviousPage": false,
    "timestamp": "2026-03-23T22:23:31.009Z"
  }
}
```

**Análisis**:
- ✅ `success: true` (operación exitosa)
- ✅ `data: null` (DELETE no devuelve entidad)
- ✅ `error: null` (sin errores)
- ✅ `metadata` completa (auditoría)

### Validación Actual (Frontend - Incorrecta)

```typescript
// PROBLEMA: Valida que data tenga TODOS estos campos
const requiredFields = ['id_event', 'title', 'description', 'date', 'time', 'location', 'type', 'createdAt', 'updatedAt'];

for (const field of requiredFields) {
  if (!(field in response.data)) { // ← FALLA aquí porque data: null
    throw new Error(`Respuesta del servidor en formato inválido: falta campo ${field}`);
  }
}
```

**Problema**: 
- Asume que DELETE devuelve objeto con campos de Event
- No considera que DELETE puede devolver `null` o valores diferentes

---

## ✅ Criterios de Aceptación

✓ **DELETE Success**: Devuelve sin campos de Event → Aceptada sin error  
✓ **DELETE Confirmation**: `data: null` o `{ deleted: true }` → Aceptada  
✓ **EventsStore Sync**: Evento removido del estado local tras DELETE exitoso  
✓ **GET Still Works**: GET valida campos estrictos como antes  
✓ **POST Still Works**: POST valida campos estrictos como antes  
✓ **PUT Still Works**: PUT valida campos estrictos como antes  
✓ **Logging Clear**: Logs indican tipo de validación aplicado  
✓ **Zero `any`**: Tipado 100% en interfaces y métodos  

---

## 📝 Notas de Diseño

1. **Pattern: Context-Aware Validation**
   - La validación debe ser flexible según la operación HTTP
   - DELETE ≠ GET en términos de payload esperado

2. **Backward Compatibility**
   - Cambios solo en `events.service.ts`
   - No breaking changes en `EventsStore`
   - Código existente de GET/POST/PUT sigue funcionando

3. **Defense in Depth**
   - Validación FEN sigue siendo estricta para operaciones que devuelven entidades
   - Pero flexible para operaciones que no

4. **Testing Strategy**
   - Unit tests para cada operación HTTP con payloads parciales
   - Integration test: DELETE → Verify event removed from store

---

**Versión**: 1.0.0  
**Próximo Documento**: `design.md`
