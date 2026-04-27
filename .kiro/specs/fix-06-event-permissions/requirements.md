# FIX-06: Event Permissions & Edit Bug - Requirements

## 📋 RESUMEN EJECUTIVO

**Problema Crítico**: El módulo de Eventos presenta dos vulnerabilidades de seguridad y funcionalidad que comprometen la integridad del sistema:

1. **BROKEN ACCESS CONTROL**: Control de acceso roto que permite a cualquier usuario ver botones de edición/eliminación en eventos ajenos
2. **BUG DE EDICIÓN**: Error "Evento no encontrado" al intentar editar eventos propios, indicando problemas en el manejo de IDs o consultas Prisma

**Impacto**: Vulnerabilidad de seguridad crítica + funcionalidad rota para creadores de eventos.

## 🎯 OBJETIVOS DEL FIX

### Objetivo Principal
Implementar un sistema de control de acceso robusto para eventos que garantice que solo los creadores y superadmins puedan modificar eventos, junto con la corrección del bug de edición.

### Objetivos Específicos
1. **Seguridad Backend**: Implementar validación de propiedad impenetrable
2. **Seguridad Frontend**: UI condicional basada en permisos reales
3. **Funcionalidad**: Corrección del bug de edición de eventos
4. **Consistencia**: Alineación con patrones existentes (GroupOwnershipGuard)

## 📝 REQUISITOS FUNCIONALES

### REQ-1: Backend Security - EventOwnershipGuard
**Prioridad**: CRÍTICA  
**Tipo**: Seguridad

**Descripción**: Implementar un Guard de seguridad que valide la propiedad de eventos antes de permitir operaciones de modificación.

**Criterios de Aceptación**:
- ✅ Crear `EventOwnershipGuard` siguiendo el patrón de `GroupOwnershipGuard`
- ✅ Aplicar el Guard a endpoints `PATCH /events/:id` y `DELETE /events/:id`
- ✅ Validar que `event.created_by === user.id_user` O `user.role === 'superadmin'`
- ✅ Lanzar `ForbiddenException` para accesos no autorizados
- ✅ Incluir logs de auditoría para intentos de acceso no autorizado
- ✅ Manejar casos edge: evento no encontrado, usuario no autenticado

**Reglas de Negocio**:
- Solo el creador del evento (`created_by`) puede editarlo/eliminarlo
- Los `superadmin` pueden editar/eliminar cualquier evento
- Los `admin` NO pueden editar eventos de otros usuarios (solo superadmin)
- Validación de doble capa: existencia del evento + propiedad

### REQ-2: Backend Bug Fix - "Evento no encontrado"
**Prioridad**: ALTA  
**Tipo**: Bug Fix

**Descripción**: Diagnosticar y corregir el error "Evento no encontrado" que ocurre al intentar editar eventos propios.

**Criterios de Aceptación**:
- ✅ Identificar la causa raíz del error (ID parsing, consulta Prisma, etc.)
- ✅ Corregir el manejo de parámetros en el endpoint `PATCH /events/:id`
- ✅ Validar que el tipo de dato del ID sea correcto (String UUID vs Int)
- ✅ Asegurar que la consulta Prisma use el campo correcto (`id` no `id_event`)
- ✅ Implementar manejo de errores robusto con mensajes descriptivos
- ✅ Verificar que el DTO de actualización sea compatible con el modelo

**Posibles Causas a Investigar**:
- Desajuste entre tipo de ID en frontend (number) vs backend (string UUID)
- Consulta Prisma incorrecta o campo mal referenciado
- Parámetro `id` no parseado correctamente en el controlador
- DTO de actualización con campos incompatibles

### REQ-3: Frontend Security - UI Condicional
**Prioridad**: CRÍTICA  
**Tipo**: Seguridad + UX

**Descripción**: Implementar renderizado condicional en la interfaz para mostrar botones de edición/eliminación solo a usuarios autorizados.

**Criterios de Aceptación**:
- ✅ Identificar componente(s) que renderizan botones de edición (EventCard, EventDetail, etc.)
- ✅ Implementar lógica condicional: `currentUser.id_user === event.created_by || currentUser.role === 'superadmin'`
- ✅ Ocultar botones de editar/eliminar para usuarios no autorizados
- ✅ Mostrar indicador visual de "Creador" para eventos propios
- ✅ Mantener consistencia con el patrón usado en GroupCard
- ✅ Asegurar que la lógica sea defensiva (manejar casos undefined/null)

**Componentes a Modificar**:
- `EventCard.tsx` - Tarjetas de eventos en listas
- `EventDetail.tsx` - Vista detallada de evento (si existe)
- Cualquier modal o componente que muestre acciones de evento

### REQ-4: Frontend Bug Fix - Payload Correcto
**Prioridad**: ALTA  
**Tipo**: Bug Fix

**Descripción**: Asegurar que el ID del evento se pase correctamente desde el frontend al backend en operaciones de edición.

**Criterios de Aceptación**:
- ✅ Verificar que el modal de edición reciba el ID correcto del evento
- ✅ Validar que el servicio de eventos envíe el ID en el formato esperado
- ✅ Confirmar que el tipo de dato del ID coincida entre frontend y backend
- ✅ Implementar validación en el frontend antes de enviar requests
- ✅ Agregar logs de debugging para rastrear el flujo del ID
- ✅ Manejar errores de red y respuestas del backend apropiadamente

**Flujo a Validar**:
1. Usuario hace clic en "Editar" → ID se pasa al modal
2. Modal se abre con datos del evento → ID se mantiene
3. Usuario envía formulario → ID se incluye en el request
4. Servicio hace PATCH request → ID llega al backend correctamente

## 🔒 REQUISITOS NO FUNCIONALES

### Seguridad
- **Principio de Menor Privilegio**: Solo permisos mínimos necesarios
- **Defensa en Profundidad**: Validación en frontend Y backend
- **Auditoría**: Logs de todos los intentos de acceso a eventos
- **Consistencia**: Alineación con patrones de seguridad existentes

### Performance
- **Validaciones Eficientes**: Guards con consultas optimizadas
- **UI Responsiva**: Renderizado condicional sin impacto en performance
- **Caching**: Mantener cache de permisos cuando sea posible

### Mantenibilidad
- **Código Reutilizable**: Guard reutilizable para otros recursos
- **Documentación**: Comentarios claros en código crítico
- **Testing**: Cobertura completa de casos edge

## 🧪 CRITERIOS DE TESTING

### Testing de Seguridad
- **Pruebas de Penetración**: Intentos de bypass del Guard
- **Casos Edge**: Usuario no autenticado, evento inexistente, etc.
- **Validación de Roles**: Comportamiento correcto para cada rol

### Testing Funcional
- **Happy Path**: Edición exitosa de eventos propios
- **Error Handling**: Manejo correcto de errores de ID
- **UI Testing**: Visibilidad correcta de botones según permisos

### Testing de Regresión
- **Funcionalidad Existente**: No romper features actuales
- **Otros Módulos**: Verificar que no se afecten grupos, mensajes, etc.

## 📋 DEFINICIÓN DE TERMINADO

### Backend
- [ ] `EventOwnershipGuard` implementado y funcionando
- [ ] Endpoints protegidos con el Guard
- [ ] Bug de "Evento no encontrado" corregido
- [ ] Tests unitarios pasando
- [ ] Logs de auditoría implementados

### Frontend
- [ ] UI condicional implementada en todos los componentes relevantes
- [ ] Payload de edición enviando ID correctamente
- [ ] Manejo de errores mejorado
- [ ] Consistencia visual con otros módulos

### Calidad
- [ ] Cero vulnerabilidades de seguridad
- [ ] Cero errores de TypeScript (`any` prohibido)
- [ ] Tests de integración pasando
- [ ] Documentación actualizada en `AGENTS.md`

## 🔄 DEPENDENCIAS Y RIESGOS

### Dependencias
- **Patrón Existente**: Basado en `GroupOwnershipGuard` exitoso
- **Modelo de Datos**: Campo `created_by` en tabla `event`
- **Sistema de Roles**: Roles `student`, `admin`, `superadmin`

### Riesgos Identificados
- **Tipo de ID**: Desajuste entre UUID (backend) y number (frontend)
- **Consultas Prisma**: Posibles errores en queries existentes
- **Regresión**: Afectar funcionalidad existente de eventos

### Mitigaciones
- **Testing Exhaustivo**: Casos edge y regresión
- **Rollback Plan**: Capacidad de revertir cambios rápidamente
- **Monitoreo**: Logs detallados para debugging post-deploy

---

**Fecha de Creación**: 20 de Marzo, 2026  
**Última Actualización**: 20 de Marzo, 2026  
**Estado**: Draft - Pendiente de Aprobación  
**Prioridad**: CRÍTICA - Vulnerabilidad de Seguridad