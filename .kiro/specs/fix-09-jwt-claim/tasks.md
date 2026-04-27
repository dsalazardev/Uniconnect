# FIX-09: JWT Claim Reversion - Tasks

## 📋 Lista de Tareas

### **Tarea 1: Actualizar Decoradores JWT en Events Controller**
- **ID**: FIX-09-T1
- **Descripción**: Buscar todos los endpoints en `events.controller.ts` que usen `@GetClaim('id_user')` y cambiarlos a `@GetClaim('sub')`
- **Prioridad**: CRÍTICA
- **Estimación**: 30 minutos
- **Dependencias**: Ninguna

#### Subtareas:
1. **T1.1**: Identificar todos los métodos con `@GetClaim('id_user')`
2. **T1.2**: Reemplazar `@GetClaim('id_user')` por `@GetClaim('sub')`
3. **T1.3**: Verificar que los nombres de parámetros siguen siendo consistentes
4. **T1.4**: Revisar que la lógica de conversión `Number()` se mantiene intacta

#### Criterios de Aceptación:
- [ ] Todos los decoradores `@GetClaim('id_user')` han sido cambiados a `@GetClaim('sub')`
- [ ] Los nombres de parámetros permanecen consistentes (`userId`)
- [ ] La lógica de validación defensiva se mantiene sin cambios
- [ ] No hay errores de compilación TypeScript

---

### **Tarea 2: Validación y Testing**
- **ID**: FIX-09-T2
- **Descripción**: Ejecutar compilación y tests del backend para asegurar que no hay regresiones
- **Prioridad**: ALTA
- **Estimación**: 20 minutos
- **Dependencias**: T1 completada

#### Subtareas:
2. **T2.1**: Ejecutar compilación TypeScript (`npm run build`)
3. **T2.2**: Ejecutar tests unitarios (`npm run test`)
4. **T2.3**: Ejecutar tests de integración específicos de eventos
5. **T2.4**: Verificar que no hay warnings o errores en consola

#### Criterios de Aceptación:
- [ ] Compilación exitosa sin errores TypeScript
- [ ] Todos los tests unitarios pasan (100% success rate)
- [ ] Tests de integración de eventos pasan correctamente
- [ ] No hay warnings relacionados con JWT claims
- [ ] Logs de aplicación no muestran errores de autenticación

---

## 🔍 Checklist de Verificación Pre-Implementación

### Análisis de Código Actual
- [ ] Identificar ubicación exacta de `events.controller.ts`
- [ ] Listar todos los métodos que usan `@GetClaim('id_user')`
- [ ] Verificar estructura actual del JWT payload en `auth.service.ts`
- [ ] Confirmar que el claim `'sub'` contiene el ID relacional

### Preparación del Entorno
- [ ] Backup del archivo `events.controller.ts`
- [ ] Verificar que el entorno de desarrollo está funcionando
- [ ] Confirmar que los tests pueden ejecutarse correctamente

---

## 🎯 Checklist de Verificación Post-Implementación

### Funcionalidad
- [ ] Endpoints de eventos responden correctamente
- [ ] IDs de usuario se extraen sin errores NaN
- [ ] Sistema de permisos funciona correctamente
- [ ] No hay regresiones en otros módulos

### Calidad de Código
- [ ] Código sigue las convenciones del proyecto
- [ ] No hay código duplicado introducido
- [ ] Comentarios y documentación actualizados si es necesario
- [ ] Tipado estricto mantenido (cero `any`)

### Testing
- [ ] Tests unitarios cubren los cambios realizados
- [ ] Tests de integración validan el flujo completo
- [ ] No hay tests fallando después de los cambios
- [ ] Coverage de tests se mantiene o mejora

---

## 📊 Métricas de Seguimiento

### Durante la Implementación
- Tiempo total invertido por tarea
- Número de archivos modificados
- Número de líneas de código cambiadas
- Número de tests ejecutados

### Post-Implementación
- Tiempo de respuesta de endpoints de eventos
- Tasa de errores en autenticación (debe ser 0%)
- Número de regresiones detectadas (objetivo: 0)
- Satisfacción del equipo de desarrollo

---

## 🚨 Puntos de Atención

### Riesgos Identificados
1. **Riesgo**: Otros controladores podrían estar usando el mismo patrón incorrecto
   - **Mitigación**: Revisar otros controladores después del fix
   
2. **Riesgo**: Tests podrían estar mockeando el claim incorrecto
   - **Mitigación**: Revisar y actualizar mocks si es necesario

3. **Riesgo**: Frontend podría estar dependiendo de algún comportamiento específico
   - **Mitigación**: Verificar que el cambio es transparente para el frontend

### Puntos de Validación Críticos
- ✅ El claim `'sub'` efectivamente contiene el ID relacional
- ✅ La conversión `Number()` funciona correctamente con el nuevo claim
- ✅ Los guards de autenticación siguen funcionando
- ✅ No hay side effects en otros módulos del sistema