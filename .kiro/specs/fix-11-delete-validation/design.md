# FIX-11: Diseño - Context-Aware FEN Validation

**Fecha**: 23 de Marzo, 2026  
**Estado**: Diseño de Arquitectura  
**Versión**: 1.0.0  
**Autor**: Arquitecto Frontend  

---

## 📐 Resumen Arquitectónico

El problema fundamental es que `validateFENResponse()` aplica la **misma validación estricta** a TODAS las respuestas HTTP, sin considerar que diferentes operaciones HTTP tienen diferentes payloads esperados:

```typescript
// ❌ INCORRECTO: Una validación para todo
GET /events → Devuelve array[] → Valida campos estrictos ✓
POST /events → Devuelve objeto {} → Valida campos estrictos ✓
PUT /events/:id → Devuelve objeto {} → Valida campos estrictos ✓
DELETE /events/:id → Devuelve null o {} → Valida campos estrictos ✗ FALLA
```

La solución es implementar **validación context-aware** que sepa qué campos esperar según el tipo de operación:

```typescript
// ✅ CORRECTO: Validación flexible según contexto
GET /events → Devuelve array[] → Valida campos estrictos ✓
POST /events → Devuelve objeto {} → Valida campos estrictos ✓
PUT /events/:id → Devuelve objeto {} → Valida campos estrictos ✓
DELETE /events/:id → Devuelve null o {} → Valida solo success/error ✓
```

---

## 🏗️ Componentes Principales

### 1. EventsService - Validación Context-Aware

**Responsabilidades**:
- Aplicar validación diferenciada según operación HTTP
- Mantener validaciones estrictas para GET/POST/PUT
- Relajar validaciones para DELETE (operaciones destructivas)

**Estructura**:

```typescript
/**
 * Enum para indicar tipo de operación HTTP
 * Permite que validador sepa qué campos esperar
 */
enum HTTPOperation {
  GET = 'GET',           // Lee entidad completa → Valida campos estrictos
  POST = 'POST',         // Crea entidad completa → Valida campos estrictos
  PUT = 'PUT',           // Actualiza entidad completa → Valida campos estrictos
  DELETE = 'DELETE',     // Borra entidad → Valida solo success/error
}

/**
 * Interfaz para configuración de validación
 */
interface ValidationConfig {
  operation: HTTPOperation;
  strictFieldValidation: boolean; // true para GET/POST/PUT, false para DELETE
  expectedDataType: 'array' | 'object' | 'null' | 'any'; // Qué tipo esperar
  requiredFields?: string[]; // null para DELETE, lista completa para GET/POST/PUT
}

/**
 * Método mejorado de validación
 */
private validateFENResponse<T>(
  response: any,
  config: ValidationConfig
): FENResponse<T> {
  // Validaciones comunes a todas las operaciones
  this.validateFENStructure(response);
  
  // Validaciones específicas por operación
  if (config.strictFieldValidation) {
    this.validateDataFields(response.data, config.requiredFields);
  } else {
    // Para DELETE: solo validar que data sea null u objeto válido
    this.validateDataIsNullOrObject(response.data);
  }
  
  return response as FENResponse<T>;
}
```

---

### 2. Métodos HTTP Específicos

#### GET Operations

```typescript
async getEvents(...): Promise<FENResponse<Event[]>> {
  const response = await api.get(...);
  return this.validateFENResponse(response.data, {
    operation: HTTPOperation.GET,
    strictFieldValidation: true,  // ← Validar campos estrictos
    expectedDataType: 'array',
    requiredFields: ['id_event', 'title', 'description', ...]
  });
}
```

**Validación**:
- ✅ Array presente
- ✅ Cada item tiene campos requeridos
- ✅ Metadata válida

---

#### POST Operations

```typescript
async createEvent(payload): Promise<FENResponse<Event>> {
  const response = await api.post(...);
  return this.validateFENResponse(response.data, {
    operation: HTTPOperation.POST,
    strictFieldValidation: true,  // ← Validar campos estrictos
    expectedDataType: 'object',
    requiredFields: ['id_event', 'title', 'description', ...]
  });
}
```

**Validación**:
- ✅ Objeto presente (no array)
- ✅ Campos requeridos presentes
- ✅ Metadata válida

---

#### PUT Operations

```typescript
async updateEvent(id, payload): Promise<FENResponse<Event>> {
  const response = await api.put(...);
  return this.validateFENResponse(response.data, {
    operation: HTTPOperation.PUT,
    strictFieldValidation: true,  // ← Validar campos estrictos
    expectedDataType: 'object',
    requiredFields: ['id_event', 'title', 'description', ...]
  });
}
```

**Validación**:
- ✅ Objeto presente (no array)
- ✅ Campos requeridos presentes
- ✅ Metadata válida

---

#### DELETE Operations

```typescript
async deleteEvent(id): Promise<boolean> {
  const response = await api.delete(...);
  const validated = this.validateFENResponse(response.data, {
    operation: HTTPOperation.DELETE,
    strictFieldValidation: false,  // ← RELACIÓN: No validar campos estrictos
    expectedDataType: 'any',       // ← Aceptar null, {}, o cualquier cosa
    requiredFields: []             // ← Sin campos requeridos en data
  });
  
  if (!validated.success) {
    throw new Error(validated.error?.message || 'Error deleting event');
  }
  
  return true; // El éxito se basa SOLO en validated.success
}
```

**Validación**:
- ✅ `success: true` presente
- ✅ `error: null` cuando success es true
- ✅ `metadata` válida
- ❌ **NO requiere** campos específicos en `data`

---

## 🔄 Flujos de Validación

### Flujo 1: GET (Validación Estricta)

```
[GET /events/1 Response]
    ↓
[ValidateFEN con config.strictFieldValidation = true]
    ↓
[Validar estructura FEN básica]
    ↓
[Validar data es objeto]
    ↓
[Validar TODOS los campos requeridos presentes]
    ├─ id_event? ✓
    ├─ title? ✓
    ├─ description? ✓
    ├─ date? ✓
    ├─ time? ✓
    ├─ location? ✓
    ├─ type? ✓
    ├─ createdAt? ✓
    ├─ updatedAt? ✓
    ↓
[Validar metadata]
    ↓
✅ Respuesta válida → Retornar FENResponse
o
❌ Campo faltante → Lanzar Error
```

---

### Flujo 2: DELETE (Validación Relajada)

```
[DELETE /events/1 Response]
    ↓
[ValidateFEN con config.strictFieldValidation = false]
    ↓
[Validar estructura FEN básica]
    ├─ success? ✓
    ├─ error? ✓
    ├─ metadata? ✓
    ↓
[Validar data es null O objeto]
    ├─ Si null → ✓ Aceptar
    ├─ Si {} → ✓ Aceptar
    ├─ Si {deleted: true} → ✓ Aceptar
    ├─ Si [] → ✓ Aceptar
    ↓
[NO validar campos específicos en data]
    ↓
✅ Respuesta válida → Retornar FENResponse
o
❌ Estructura FEN inválida → Lanzar Error
```

---

## 📊 Matriz de Validación por Operación

| Operación | Estructura FEN | Campos Data | Data Type | Strict Validate | Notas |
|-----------|---|---|---|---|---|
| **GET** (Array) | ✅ Obligatorio | ✅ Estricta | array | true | Validar c/ elemento |
| **GET** (Único) | ✅ Obligatorio | ✅ Estricta | object | true | Todos los campos |
| **POST** | ✅ Obligatorio | ✅ Estricta | object | true | Todos los campos |
| **PUT** | ✅ Obligatorio | ✅ Estricta | object | true | Todos los campos |
| **DELETE** | ✅ Obligatorio | ❌ Flexible | null\|object | false | Solo success/error |
| **PATCH** | ✅ Obligatorio | ❌ Flexible | object | false | Solo campos actualizados |
| **HEAD** | ⚠️ Ninguno | ⚠️ N/A | none | false | Protocolo especial |

---

## 🎯 Decisiones de Diseño

### ¿Por qué DELETE no necesita validación estricta?

1. **Semántica HTTP**:
   - GET: "Dame el recurso completo" → Espera entidad completa
   - POST: "Crea un recurso" → Espera entidad creada
   - PUT: "Actualiza el recurso" → Espera entidad actualizada
   - DELETE: "Borra el recurso" → No espera entidad, solo confirmación

2. **Payload Reality**:
   - Backend DELETE típicamente retorna:
     - `data: null` (sin datos)
     - `data: { deleted: true }` (confirmación)
     - `data: {}` (objeto vacío)
   - **Nunca** retorna la entidad completa (sería redundante)

3. **Frontend Concern**:
   - Lo único que importa para DELETE es: ¿Se borró?
   - Se determina por: `success: true` + `error: null`
   - No por los campos en `data`

4. **Defense in Depth**:
   - Validación estricta en GET/POST/PUT protege contra datos malformados
   - Validación flexible en DELETE permite confirmaciones minimalistas
   - Ambas validan estructura FEN base (success, error, metadata)

---

## 🔐 Invariantes del Sistema

```typescript
// INVARIANTE 1: FEN Estructura siempre presente
invariant(
  response.success !== undefined &&
  response.error !== undefined &&
  response.metadata !== undefined,
  'Estructura FEN incompleta - siempre need success, error, metadata'
);

// INVARIANTE 2: Success/Error Coherencia
invariant(
  (response.success === true && response.error === null) ||
  (response.success === false && response.error !== null),
  'Incoherencia: si success=true, error debe ser null'
);

// INVARIANTE 3: Metadata siempre válida
invariant(
  response.metadata.total >= 0 &&
  response.metadata.page >= 1,
  'Metadata inválida'
);

// INVARIANTE 4: DELETE nunca tiene array data
invariant(
  !Array.isArray(response.data),
  'DELETE no debe devolver array en data'
);
```

---

## 🛡️ Ejemplos de Payloads

### GET /events - Respuesta Válida (Estricta)

```json
{
  "success": true,
  "data": [
    {
      "id_event": 1,
      "title": "Conferencia de AI",
      "description": "...",
      "date": "2026-04-01",
      "time": "10:00",
      "location": "Aula 101",
      "type": "CONFERENCIA",
      "createdAt": "2026-03-23T22:23:00Z",
      "updatedAt": "2026-03-23T22:23:00Z"
    }
  ],
  "error": null,
  "metadata": { "total": 1, "page": 1, "pageSize": 20, ... }
}
```

---

### POST /events - Respuesta Válida (Estricta)

```json
{
  "success": true,
  "data": {
    "id_event": 2,
    "title": "Nuevo evento",
    "description": "...",
    "date": "2026-04-02",
    "time": "14:00",
    "location": "Aula 102",
    "type": "TALLER",
    "createdAt": "2026-03-23T22:24:00Z",
    "updatedAt": "2026-03-23T22:24:00Z"
  },
  "error": null,
  "metadata": { "total": 2, "page": 1, "pageSize": 20, ... }
}
```

---

### DELETE /events/1 - Respuesta Válida (Flexible)

```json
{
  "success": true,
  "data": null,
  "error": null,
  "metadata": { "total": 1, "page": 1, "pageSize": 20, ... }
}
```

O alternativamente:

```json
{
  "success": true,
  "data": { "deleted": true },
  "error": null,
  "metadata": { "total": 1, "page": 1, "pageSize": 20, ... }
}
```

Ambas son válidas para DELETE.

---

### DELETE /events/999 - Respuesta Error (Coherente)

```json
{
  "success": false,
  "data": null,
  "error": {
    "code": "NOT_FOUND",
    "message": "Evento no encontrado"
  },
  "metadata": { "total": 1, "page": 1, "pageSize": 20, ... }
}
```

---

## 📝 Patterns & Best Practices

### Pattern: Operation-Aware Service Methods

Cada método HTTP documentado con su validación esperada:

```typescript
/**
 * Delete an event (only owner or superadmin)
 * ⭐ FIX-11: Uses relaxed FEN validation for DELETE operations
 *
 * @param id_event - Event ID
 * @returns Promise<boolean> - true if deleted successfully
 * 
 * VALIDATION CONTEXT:
 * - Expects: { success: true, error: null, metadata: {...}, data: null | {...} }
 * - Does NOT expect: Event fields in data (unlike GET/POST/PUT)
 * - Reason: DELETE confirms deletion, doesn't return entity
 */
async deleteEvent(id_event: number): Promise<boolean> {
  // ...
}
```

---

**Versión**: 1.0.0  
**Próximo Documento**: `tasks.md`
