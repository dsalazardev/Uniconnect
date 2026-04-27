# FIX-09: JWT Claim Reversion - Requirements

## 📋 Contexto del Problema

El Director ha identificado que el payload del JWT contiene el ID relacional local del usuario bajo el claim `sub` (ej. `"sub": 1`), mientras que el ID del proveedor Auth0 viaja bajo `auth0_sub`. El cambio previo a `@GetClaim('id_user')` causó que el ID se evaluara como `undefined`, resultando en el error "ID de usuario inválido" (NaN).

## 🎯 Objetivos del FIX-09

Revertir la extracción del claim JWT para usar la estructura correcta del payload y restaurar la funcionalidad de los endpoints de eventos.

## 📝 Requerimientos Funcionales

### **Req 1: Revertir Decorador JWT Claim**
- **Descripción**: Cambiar el decorador en `events.controller.ts` para extraer el ID del usuario utilizando el claim `'sub'` en lugar de `'id_user'`
- **Alcance**: Todos los endpoints del controlador de eventos que requieren autenticación
- **Criterio de Aceptación**: Los endpoints deben recibir correctamente el ID numérico del usuario desde el JWT payload
- **Prioridad**: CRÍTICA

### **Req 2: Preservar Validaciones Defensivas**
- **Descripción**: Mantener intacta la lógica de parseo a número (`Number()`) y la validación anti-NaN en el servicio
- **Justificación**: Son buenas prácticas defensivas que previenen errores de tipo
- **Criterio de Aceptación**: La validación de tipo numérico debe continuar funcionando correctamente
- **Prioridad**: ALTA

## 🔍 Requerimientos No Funcionales

### **NFR 1: Compatibilidad**
- No debe afectar otros controladores o servicios del sistema
- Debe mantener compatibilidad con el sistema de autenticación existente

### **NFR 2: Rendimiento**
- No debe introducir overhead adicional en el procesamiento de requests
- Debe mantener los tiempos de respuesta actuales

### **NFR 3: Seguridad**
- Debe preservar todas las validaciones de seguridad existentes
- No debe comprometer la integridad del sistema de autenticación

## ✅ Criterios de Finalización

1. Todos los endpoints de `events.controller.ts` usan `@GetClaim('sub')`
2. La compilación del backend es exitosa sin errores
3. Los tests unitarios y de integración pasan correctamente
4. Los endpoints de eventos responden correctamente con IDs de usuario válidos
5. No hay regresiones en otros módulos del sistema

## 🚫 Fuera del Alcance

- Modificación de la estructura del JWT payload
- Cambios en el sistema de autenticación Auth0
- Modificación de otros controladores fuera de `events.controller.ts`
- Cambios en el frontend relacionados con autenticación