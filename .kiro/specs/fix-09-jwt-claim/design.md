# FIX-09: JWT Claim Reversion - Design Document

## 🔍 Análisis de Causa Raíz

### Problema Identificado
- **Síntoma**: Error "ID de usuario inválido" (NaN) en endpoints de eventos
- **Causa Raíz**: Mismatch entre la llave buscada (`id_user`) y la estructura real del payload custom del JWT (`sub`)
- **Impacto**: Todos los endpoints autenticados de eventos fallan al extraer el ID del usuario

### Estructura Real del JWT Payload
```typescript
// Payload actual generado en auth.service.ts
{
  "sub": 1,                    // ✅ ID relacional local del usuario
  "permissions": ["claim1"],   // Array de permisos
  "roleName": "student",       // Nombre del rol
  "auth0_sub": "auth0|123"     // ID del proveedor Auth0 (solo en auth0Callback)
}
```

### Decorador Problemático
```typescript
// ❌ INCORRECTO - Busca 'id_user' que no existe
@GetClaim('id_user') userId: string
```

## 🎯 Solución Propuesta

### Arquitectura de la Solución
```typescript
// ✅ CORRECTO - Extrae 'sub' que contiene el ID relacional
@GetClaim('sub') userId: string
```

### Flujo de Datos Corregido
```
1. JWT Token → Decorador @GetClaim('sub') → userId: string
2. Controller → Number(userId) → numericUserId: number  
3. Service → Validación anti-NaN → Consulta Prisma
```

## 🏗️ Componentes Afectados

### 1. Events Controller (`events.controller.ts`)
- **Cambio**: Actualizar decoradores `@GetClaim('id_user')` → `@GetClaim('sub')`
- **Métodos Afectados**: Todos los endpoints que requieren autenticación
- **Validación**: Mantener conversión `Number()` y validación anti-NaN

### 2. Preservación de Lógica Defensiva
```typescript
// ✅ MANTENER - Buenas prácticas defensivas
const numericUserId = Number(userId);
if (isNaN(numericUserId) || numericUserId <= 0) {
  throw new BadRequestException('Invalid user ID');
}
```

## 🔄 Patrón de Implementación

### Template para Endpoints Autenticados
```typescript
// Patrón estándar para todos los endpoints
async methodName(
  @GetClaim('sub') userId: string,  // ✅ Usar 'sub'
  // otros parámetros...
) {
  const numericUserId = Number(userId);
  if (isNaN(numericUserId) || numericUserId <= 0) {
    throw new BadRequestException('Invalid user ID from JWT token');
  }
  
  return await this.eventsService.methodName(numericUserId, ...);
}
```

## 🧪 Estrategia de Testing

### 1. Tests Unitarios
- Verificar que `@GetClaim('sub')` extrae correctamente el ID
- Validar conversión de string a number
- Confirmar manejo de casos edge (NaN, valores negativos)

### 2. Tests de Integración
- Probar endpoints con JWT tokens reales
- Verificar que los IDs se extraen y procesan correctamente
- Confirmar que no hay regresiones en otros módulos

## 🔒 Consideraciones de Seguridad

### Validaciones Preservadas
- Conversión explícita de tipo string → number
- Validación anti-NaN para prevenir inyecciones
- Validación de valores positivos (ID > 0)
- Mantenimiento de guards de autenticación existentes

### Principios de Seguridad
- **Programación Defensiva**: Mantener todas las validaciones
- **Fail-Safe**: Lanzar excepciones claras en caso de error
- **Least Privilege**: No modificar permisos o claims existentes

## 📊 Métricas de Éxito

### Indicadores Técnicos
- ✅ Compilación exitosa sin errores TypeScript
- ✅ 100% de tests unitarios pasando
- ✅ 100% de tests de integración pasando
- ✅ Endpoints de eventos respondiendo correctamente

### Indicadores de Negocio
- ✅ Usuarios pueden crear eventos sin errores
- ✅ Usuarios pueden editar sus eventos
- ✅ Usuarios pueden eliminar sus eventos
- ✅ Sistema de permisos funciona correctamente

## 🚀 Plan de Rollback

En caso de problemas:
1. Revertir cambios en `events.controller.ts`
2. Restaurar decoradores `@GetClaim('id_user')`
3. Ejecutar tests de regresión
4. Investigar estructura alternativa del JWT payload