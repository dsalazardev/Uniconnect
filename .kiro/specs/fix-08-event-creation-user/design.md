# Fix Event Creation User ID Type Conversion Bugfix Design

## Overview

Este documento describe la estrategia de corrección para el error "Usuario no encontrado" que ocurre durante la creación de eventos. El problema surge por un desajuste de tipos: el ID del usuario extraído del token JWT llega como `string`, pero Prisma espera un `Int` para las consultas de base de datos. La solución implementará conversión explícita de tipos con validación para garantizar la integridad de los datos.

## Glossary

- **Bug_Condition (C)**: La condición que desencadena el error - cuando el ID del usuario del JWT es un string y se usa directamente en consultas Prisma
- **Property (P)**: El comportamiento deseado - conversión exitosa del ID a número entero antes de las consultas de base de datos
- **Preservation**: El comportamiento existente de autenticación JWT y otras operaciones que deben permanecer sin cambios
- **JWT Payload**: El contenido decodificado del token JWT que contiene el ID del usuario como string
- **Prisma Schema**: El esquema de base de datos que define `id_user` como tipo `Int`
- **Type Coercion**: La conversión explícita de string a número entero con validación

## Bug Details

### Fault Condition

El error se manifiesta cuando se intenta crear un evento con un token JWT válido, pero el ID del usuario extraído del token permanece como `string` y se pasa directamente a las consultas de Prisma que esperan un `Int`.

**Formal Specification:**
```
FUNCTION isBugCondition(input)
  INPUT: input of type EventCreationRequest
  OUTPUT: boolean
  
  RETURN input.hasValidJWT = true
         AND typeof(input.userIdFromJWT) = "string"
         AND input.isEventCreationRequest = true
         AND NOT isConvertedToNumber(input.userIdFromJWT)
END FUNCTION
```

### Examples

- **Ejemplo 1**: POST /events con JWT válido → Error 404 "Usuario no encontrado" porque `prisma.user.findUnique({ where: { id: "123" } })` falla
- **Ejemplo 2**: Token JWT contiene `{ userId: "456" }` → Consulta Prisma recibe string "456" en lugar de número 456
- **Ejemplo 3**: Usuario válido con ID 789 → `findUnique` con string "789" no encuentra el registro que existe con ID numérico 789
- **Edge case**: Token JWT con ID no numérico "abc" → Debe fallar con error de validación apropiado

## Expected Behavior

### Preservation Requirements

**Unchanged Behaviors:**
- La autenticación JWT en otros endpoints debe continuar funcionando exactamente como antes
- Las operaciones que no involucran creación de eventos deben permanecer inalteradas
- La estructura del token JWT y su decodificación deben mantenerse sin cambios

**Scope:**
Todas las entradas que NO involucran la creación de eventos con extracción de ID de usuario del JWT deben ser completamente no afectadas por esta corrección. Esto incluye:
- Operaciones de autenticación en otros endpoints
- Consultas de base de datos que no dependen del ID del usuario del JWT
- Validaciones de token JWT existentes

## Hypothesized Root Cause

Basado en la descripción del error, las causas más probables son:

1. **Falta de Conversión de Tipos**: El controlador extrae el ID del JWT como string pero no lo convierte a número antes de pasarlo al servicio
   - El middleware de autenticación JWT decodifica el payload manteniendo los tipos originales
   - El controlador de eventos no realiza conversión explícita del ID

2. **Inconsistencia de Esquema**: Desajuste entre el tipo de dato en el JWT (string) y el esperado por Prisma (Int)
   - El esquema de Prisma define `id_user` como `Int`
   - El payload del JWT contiene el ID como string por defecto

3. **Falta de Validación**: No hay validación para verificar que el ID convertido sea un número válido
   - No se verifica si la conversión resulta en `NaN`
   - No hay manejo de errores para IDs no numéricos

4. **Propagación del Tipo Incorrecto**: El tipo string se propaga desde el controlador hasta el servicio sin conversión
   - El servicio recibe el ID como string y lo pasa directamente a Prisma
   - Prisma falla silenciosamente o retorna resultados vacíos

## Correctness Properties

Property 1: Fault Condition - JWT User ID Type Conversion

_For any_ event creation request where a valid JWT contains a user ID as string, the fixed system SHALL convert the user ID to a valid integer before executing database queries, ensuring successful user lookup and event creation.

**Validates: Requirements 2.1, 2.2, 2.3**

Property 2: Preservation - Non-Event Creation Operations

_For any_ operation that does NOT involve event creation with JWT user ID extraction, the fixed system SHALL produce exactly the same behavior as the original system, preserving all existing authentication and database query functionality.

**Validates: Requirements 3.1, 3.2, 3.3**

## Fix Implementation

### Changes Required

Asumiendo que nuestro análisis de causa raíz es correcto:

**File**: `src/controllers/eventController.js` (o archivo equivalente del controlador)

**Function**: `createEvent` (o función equivalente de creación de eventos)

**Specific Changes**:
1. **Type Conversion**: Implementar conversión explícita del ID del usuario de string a número
   - Usar `Number(userId)` o `parseInt(userId, 10)` para la conversión
   - Agregar validación para verificar que el resultado no sea `NaN`

2. **Error Handling**: Agregar manejo de errores para IDs no válidos
   - Retornar error 400 si el ID no puede convertirse a número válido
   - Incluir mensaje de error descriptivo

3. **Input Validation**: Validar el ID convertido antes de pasarlo al servicio
   - Verificar que sea un entero positivo
   - Verificar que esté dentro del rango válido para IDs de base de datos

4. **Service Layer Update**: Asegurar que el servicio reciba el ID como número
   - Actualizar la interfaz del servicio si es necesario
   - Agregar validación de tipos en el servicio como medida defensiva

5. **Documentation**: Actualizar comentarios y documentación
   - Documentar la conversión de tipos requerida
   - Agregar ejemplos de uso correcto

## Testing Strategy

### Validation Approach

La estrategia de testing sigue un enfoque de dos fases: primero, generar contraejemplos que demuestren el error en el código sin corregir, luego verificar que la corrección funciona correctamente y preserva el comportamiento existente.

### Exploratory Fault Condition Checking

**Goal**: Generar contraejemplos que demuestren el error ANTES de implementar la corrección. Confirmar o refutar el análisis de causa raíz. Si refutamos, necesitaremos re-hipotetizar.

**Test Plan**: Escribir tests que simulen peticiones de creación de eventos con tokens JWT válidos que contengan IDs de usuario como strings. Ejecutar estos tests en el código SIN CORREGIR para observar las fallas y entender la causa raíz.

**Test Cases**:
1. **JWT String ID Test**: Simular POST /events con JWT conteniendo `{ userId: "123" }` (fallará en código sin corregir)
2. **Valid User Lookup Test**: Verificar que el usuario con ID 123 existe en la base de datos pero la consulta con string "123" falla (fallará en código sin corregir)
3. **Type Mismatch Test**: Verificar que `prisma.user.findUnique({ where: { id: "123" } })` retorna null mientras que `{ where: { id: 123 } }` retorna el usuario (fallará en código sin corregir)
4. **Non-Numeric ID Test**: Simular JWT con ID no numérico "abc" (puede fallar en código sin corregir)

**Expected Counterexamples**:
- Las consultas de usuario fallan cuando se pasa string en lugar de número
- Posibles causas: falta de conversión de tipos, inconsistencia de esquema, propagación de tipo incorrecto

### Fix Checking

**Goal**: Verificar que para todas las entradas donde se cumple la condición del error, la función corregida produce el comportamiento esperado.

**Pseudocode:**
```
FOR ALL input WHERE isBugCondition(input) DO
  result := createEvent_fixed(input)
  ASSERT expectedBehavior(result)
END FOR
```

### Preservation Checking

**Goal**: Verificar que para todas las entradas donde NO se cumple la condición del error, la función corregida produce el mismo resultado que la función original.

**Pseudocode:**
```
FOR ALL input WHERE NOT isBugCondition(input) DO
  ASSERT createEvent_original(input) = createEvent_fixed(input)
END FOR
```

**Testing Approach**: Se recomienda testing basado en propiedades para la verificación de preservación porque:
- Genera muchos casos de prueba automáticamente a través del dominio de entrada
- Detecta casos extremos que los tests unitarios manuales podrían pasar por alto
- Proporciona garantías sólidas de que el comportamiento no cambia para todas las entradas no problemáticas

**Test Plan**: Observar comportamiento en código SIN CORREGIR primero para operaciones de autenticación y otras interacciones, luego escribir tests basados en propiedades capturando ese comportamiento.

**Test Cases**:
1. **JWT Authentication Preservation**: Verificar que la autenticación JWT continúa funcionando en otros endpoints
2. **Non-Event Operations Preservation**: Verificar que otras operaciones de base de datos continúan funcionando correctamente
3. **Token Validation Preservation**: Verificar que la validación de tokens JWT continúa funcionando después de la corrección

### Unit Tests

- Test de conversión de tipos para IDs de usuario válidos
- Test de manejo de errores para IDs no válidos o no numéricos
- Test de validación de entrada para diferentes formatos de ID
- Test de integración con Prisma usando IDs convertidos

### Property-Based Tests

- Generar IDs de usuario aleatorios como strings y verificar conversión exitosa a números
- Generar tokens JWT aleatorios y verificar que la autenticación se preserve
- Generar diferentes tipos de peticiones y verificar que solo las de creación de eventos se vean afectadas

### Integration Tests

- Test de flujo completo de creación de eventos con JWT válido
- Test de manejo de errores para tokens JWT con IDs inválidos
- Test de preservación de funcionalidad existente en otros endpoints
- Test de integridad referencial en la base de datos después de la corrección