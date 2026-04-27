# FIX-06: Event Permissions & Edit Bug - Implementation Tasks

## 📋 TASK OVERVIEW

**Spec**: FIX-06 Event Permissions & Edit Bug  
**Type**: Security Fix + Bug Fix  
**Priority**: CRITICAL  
**Estimated Effort**: 8-12 hours  

## 🎯 IMPLEMENTATION PHASES

### FASE 1: TESTING DE EXPLORACIÓN
> **Objetivo**: Evidenciar los fallos actuales y establecer casos de prueba

- [ ] **1.1** Crear tests de exploración para evidenciar broken access control
  - [ ] Test: Usuario no-owner puede acceder a endpoints de edición/eliminación
  - [ ] Test: Frontend muestra botones de edición a usuarios no autorizados
  - [ ] Test: Verificar respuesta del backend ante accesos no autorizados

- [ ] **1.2** Crear tests de exploración para el bug de edición
  - [ ] Test: Reproducir error "Evento no encontrado" con evento válido
  - [ ] Test: Verificar tipos de ID enviados desde frontend
  - [ ] Test: Validar consultas Prisma en el servicio de eventos

- [ ] **1.3** Documentar hallazgos de exploración
  - [ ] Crear reporte de vulnerabilidades encontradas
  - [ ] Identificar causa raíz del bug de edición
  - [ ] Establecer casos de prueba para validar fixes

### FASE 2: FIX BACKEND - SECURITY & BUG
> **Objetivo**: Implementar seguridad robusta y corregir bug de edición

- [ ] **2.1** Implementar EventOwnershipGuard
  - [ ] Crear `src/events/guards/event-ownership.guard.ts`
  - [ ] Implementar lógica de validación de propiedad
  - [ ] Agregar validación para superadmin
  - [ ] Incluir logs de auditoría para accesos autorizados/no autorizados
  - [ ] Manejar casos edge (evento no encontrado, usuario no autenticado)

- [ ] **2.2** Aplicar Guard a endpoints de eventos
  - [ ] Modificar `events.controller.ts` para usar `@UseGuards(JwtAuthGuard, EventOwnershipGuard)`
  - [ ] Aplicar a endpoint `PATCH /events/:id`
  - [ ] Aplicar a endpoint `DELETE /events/:id`
  - [ ] Actualizar documentación Swagger de los endpoints

- [ ] **2.3** Corregir bug "Evento no encontrado"
  - [ ] Investigar y corregir manejo de parámetros en `events.controller.ts`
  - [ ] Validar que consultas Prisma usen el campo correcto (`id` vs `id_event`)
  - [ ] Implementar `ParseUUIDPipe` si es necesario para validar formato de ID
  - [ ] Agregar logging detallado para debugging del flujo de ID
  - [ ] Mejorar manejo de errores con mensajes descriptivos

- [ ] **2.4** Validar y corregir EventsService
  - [ ] Revisar método `update()` en `events.service.ts`
  - [ ] Asegurar que consultas Prisma sean correctas
  - [ ] Validar que DTO de actualización sea compatible
  - [ ] Implementar validación de entrada robusta

### FASE 3: FIX FRONTEND - UI CONDICIONAL & PAYLOAD
> **Objetivo**: Implementar UI condicional y corregir envío de datos

- [ ] **3.1** Implementar UI condicional en componentes de eventos
  - [ ] Identificar componentes que muestran botones de edición/eliminación
  - [ ] Modificar `EventCard.tsx` (si existe) para renderizado condicional
  - [ ] Implementar lógica: `canManage = isOwner || isSuperAdmin`
  - [ ] Ocultar botones para usuarios no autorizados
  - [ ] Agregar indicador visual de "Tu evento" para eventos propios

- [ ] **3.2** Crear función utilitaria de permisos
  - [ ] Crear `src/features/events/utils/permissions.ts`
  - [ ] Implementar `canUserManageEvent(event: Event, user: User): boolean`
  - [ ] Usar función en todos los componentes relevantes
  - [ ] Agregar validación defensiva para casos undefined/null

- [ ] **3.3** Corregir payload de edición de eventos
  - [ ] Revisar `EventsService` en frontend para método `updateEvent`
  - [ ] Validar que ID se envíe en formato correcto (string UUID)
  - [ ] Agregar validación de ID antes de enviar requests
  - [ ] Implementar logging para rastrear flujo de ID
  - [ ] Mejorar manejo de errores en responses del backend

- [ ] **3.4** Actualizar hooks de eventos
  - [ ] Modificar `useEvents` hook para manejar actualizaciones correctamente
  - [ ] Implementar validación de datos antes de envío
  - [ ] Agregar manejo de errores específicos
  - [ ] Actualizar invalidación de queries después de operaciones

### FASE 4: CHECKPOINT & DOCUMENTATION
> **Objetivo**: Validar implementación y actualizar documentación

- [ ] **4.1** Ejecutar tests de Jest en backend
  - [ ] Ejecutar tests unitarios del EventOwnershipGuard
  - [ ] Ejecutar tests de integración de endpoints
  - [ ] Validar que tests de exploración ahora pasen
  - [ ] Corregir cualquier test que falle

- [ ] **4.2** Ejecutar tests de frontend
  - [ ] Tests de componentes con renderizado condicional
  - [ ] Tests de servicios con payload correcto
  - [ ] Tests de hooks con manejo de errores
  - [ ] Validar que no hay regresiones

- [ ] **4.3** Tests de integración end-to-end
  - [ ] Test: Usuario owner puede editar su evento
  - [ ] Test: Usuario no-owner no puede editar eventos ajenos
  - [ ] Test: Superadmin puede editar cualquier evento
  - [ ] Test: UI muestra botones solo a usuarios autorizados
  - [ ] Test: Edición de evento funciona sin errores

- [ ] **4.4** Actualizar AGENTS.md
  - [ ] Agregar `EventOwnershipGuard` a la sección de Guards y Decoradores
  - [ ] Actualizar reglas de negocio de eventos
  - [ ] Documentar nuevos patrones de seguridad implementados
  - [ ] Actualizar arquitectura de frontend si es necesario

## 🧪 TESTING STRATEGY

### Property-Based Testing
- [ ] **PBT-1** Generar eventos aleatorios y validar que solo owners/superadmins puedan editarlos
- [ ] **PBT-2** Generar usuarios con diferentes roles y validar permisos correctos
- [ ] **PBT-3** Generar IDs en diferentes formatos y validar manejo robusto

### Security Testing
- [ ] **SEC-1** Intentos de bypass del Guard con tokens manipulados
- [ ] **SEC-2** Acceso directo a endpoints sin autenticación
- [ ] **SEC-3** Escalación de privilegios (student → admin → superadmin)

### Regression Testing
- [ ] **REG-1** Funcionalidad existente de eventos no afectada
- [ ] **REG-2** Otros módulos (grupos, mensajes) funcionan correctamente
- [ ] **REG-3** Performance no degradada por nuevas validaciones

## 🔍 ACCEPTANCE CRITERIA

### Backend Security
- [ ] ✅ `EventOwnershipGuard` implementado y funcionando
- [ ] ✅ Endpoints `PATCH /events/:id` y `DELETE /events/:id` protegidos
- [ ] ✅ Solo owners y superadmins pueden modificar eventos
- [ ] ✅ Logs de auditoría para intentos de acceso
- [ ] ✅ Bug "Evento no encontrado" corregido

### Frontend Security
- [ ] ✅ Botones de edición/eliminación solo visibles para usuarios autorizados
- [ ] ✅ Indicador visual de "Tu evento" para eventos propios
- [ ] ✅ Payload de edición envía ID correctamente
- [ ] ✅ Manejo de errores mejorado

### Quality Assurance
- [ ] ✅ Cero vulnerabilidades de seguridad
- [ ] ✅ Cero errores de TypeScript (prohibido `any`)
- [ ] ✅ Tests unitarios y de integración pasando
- [ ] ✅ Documentación actualizada

## 🚨 CRITICAL SUCCESS FACTORS

### Security
- **Principio de Menor Privilegio**: Solo permisos mínimos necesarios
- **Defensa en Profundidad**: Validación en frontend Y backend
- **Auditoría Completa**: Logs de todos los accesos a eventos

### Functionality
- **Bug-Free**: Edición de eventos funciona perfectamente
- **User Experience**: UI intuitiva que refleja permisos reales
- **Performance**: Sin degradación por nuevas validaciones

### Maintainability
- **Código Limpio**: Siguiendo patrones establecidos
- **Testing Completo**: Cobertura de casos edge
- **Documentación**: Actualizada y precisa

## 📊 PROGRESS TRACKING

### Phase 1: Exploration Testing
- [ ] 0/3 tasks completed
- [ ] Estimated: 2 hours
- [ ] Status: Not Started

### Phase 2: Backend Fixes
- [ ] 0/4 tasks completed  
- [ ] Estimated: 4 hours
- [ ] Status: Not Started

### Phase 3: Frontend Fixes
- [ ] 0/4 tasks completed
- [ ] Estimated: 3 hours  
- [ ] Status: Not Started

### Phase 4: Validation & Documentation
- [ ] 0/4 tasks completed
- [ ] Estimated: 2 hours
- [ ] Status: Not Started

**Total Progress**: 0/15 tasks completed (0%)

---

**Fecha de Creación**: 20 de Marzo, 2026  
**Última Actualización**: 20 de Marzo, 2026  
**Estado**: Ready for Implementation  
**Prioridad**: CRITICAL - Security Vulnerability