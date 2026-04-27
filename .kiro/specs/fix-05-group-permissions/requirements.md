# FIX-05: Group Invitations & Ownership Permissions - Requirements

## 🎯 Objetivo del Bugfix

Solucionar dos vulnerabilidades críticas de seguridad en el sistema de grupos:
1. **Error HTTP 400** al aceptar invitaciones de grupo
2. **Broken Access Control** en endpoints de edición y eliminación de grupos

## 🐛 Bugs Identificados

### Bug 1: Error 400 en Aceptación de Invitaciones
**Síntoma**: Al responder (aceptar) una invitación de grupo, el endpoint devuelve HTTP 400
**Impacto**: Los usuarios no pueden unirse a grupos mediante invitaciones
**Severidad**: Alta - Funcionalidad core bloqueada

### Bug 2: Broken Access Control en Grupos
**Síntoma**: Usuarios que no son administradores ni dueños pueden editar y eliminar grupos
**Impacto**: Vulnerabilidad de seguridad crítica - usuarios sin permisos pueden modificar/eliminar grupos
**Severidad**: Crítica - Vulnerabilidad de seguridad

## 📋 Requerimientos de Corrección

### REQ-1: Investigar y Solucionar Error 400 en Invitaciones
**Descripción**: Analizar y corregir el error HTTP 400 que ocurre al aceptar invitaciones de grupo

**Criterios de Aceptación**:
- [ ] Identificar la causa raíz del error 400 en `group-invitations.service.ts`
- [ ] Verificar validación de estado de invitación (debe ser 'pending')
- [ ] Manejar correctamente errores P2002 por membresías duplicadas
- [ ] Validar estructura del DTO `RespondGroupInvitationDto` en el frontend
- [ ] Asegurar que el endpoint `PATCH /groups/:id/invitations/:invitationId/accept` funcione correctamente
- [ ] Implementar logging detallado para debugging

**Posibles Causas Hipotéticas**:
- Validación incorrecta del estado de la invitación
- Conflicto de unique constraint en memberships (P2002)
- DTO malformado desde el frontend
- Race condition en transacciones de base de datos

### REQ-2: Implementar Control de Acceso Riguroso (Backend)
**Descripción**: Proteger endpoints de `update` y `remove` de grupos con validación estricta de permisos

**Criterios de Aceptación**:
- [ ] Verificar que `GroupOwnershipGuard` esté aplicado correctamente en endpoints críticos
- [ ] Validar que solo `owner_id === userId` o `membership.is_admin === true` puedan modificar grupos
- [ ] Implementar validación adicional en servicios como fallback de seguridad
- [ ] Agregar logging de intentos de acceso no autorizado
- [ ] Verificar que superadmin tenga bypass controlado (si aplica)

**Endpoints Críticos**:
- `PATCH /groups/:id` (update group)
- `DELETE /groups/:id` (remove group)

### REQ-3: Ocultar Botones de Administración (Frontend)
**Descripción**: Implementar lógica condicional para ocultar/deshabilitar botones de administración según permisos del usuario

**Criterios de Aceptación**:
- [ ] En `GroupCard.tsx`: Ocultar botones "Editar" y "Eliminar" si `!isOwner && !isAdmin`
- [ ] En `GroupInfoModal.tsx`: Ocultar botón de invitar si `!canManage`
- [ ] Verificar que `GroupInfo.isOwner` y `GroupInfo.canManage` se calculen correctamente
- [ ] Implementar validación defensiva en el frontend antes de llamadas API
- [ ] Mostrar mensajes de error apropiados si el usuario intenta acciones no permitidas

**Componentes Afectados**:
- `GroupCard.tsx`
- `GroupInfoModal.tsx`
- `GroupInfoHeader.tsx` (si existe)

## 🔍 Análisis de Causa Raíz

### Error 400 en Invitaciones
**Hipótesis Principal**: El error puede originarse por:
1. **Validación de Estado**: La invitación no está en estado 'pending'
2. **Membresía Duplicada**: Error P2002 al crear membership si ya existe
3. **DTO Inválido**: Estructura incorrecta del `RespondGroupInvitationDto`
4. **Race Condition**: Múltiples requests simultáneos

### Broken Access Control
**Causa Confirmada**: 
- `GroupOwnershipGuard` está implementado correctamente
- Los endpoints `update` y `remove` tienen el guard aplicado
- El problema puede estar en la lógica del guard o en validaciones adicionales faltantes

## 🎯 Definición de "Terminado"

### Criterios de Éxito
1. **Invitaciones Funcionales**: Los usuarios pueden aceptar invitaciones sin errores HTTP 400
2. **Seguridad Restaurada**: Solo owners y admins pueden editar/eliminar grupos
3. **UI Consistente**: Los botones de administración solo aparecen para usuarios autorizados
4. **Tests Pasando**: Todos los tests de exploración y validación pasan
5. **Logging Implementado**: Eventos de seguridad y errores están loggeados

### Métricas de Validación
- 0 errores HTTP 400 en aceptación de invitaciones
- 0 modificaciones no autorizadas de grupos
- 100% de botones de administración ocultos para usuarios sin permisos
- Tests de property-based testing pasando para ambos flujos

## 🚨 Consideraciones de Seguridad

### Principios de Seguridad
1. **Defense in Depth**: Validación tanto en guards como en servicios
2. **Least Privilege**: Solo permisos mínimos necesarios
3. **Fail Secure**: En caso de error, denegar acceso por defecto
4. **Audit Trail**: Logging de todas las operaciones de administración

### Validaciones Requeridas
- Autenticación JWT válida
- Usuario existe y está activo
- Grupo existe y no es chat directo
- Usuario es owner o admin del grupo
- Operación es permitida según reglas de negocio

## 📝 Notas Técnicas

### Stack Tecnológico
- **Backend**: NestJS 11.x + TypeScript 5.7.x + Prisma ORM 7.4.x
- **Frontend**: React Native 0.81.x + Expo 54.x + TypeScript
- **Base de Datos**: PostgreSQL con constraints de integridad
- **Testing**: Jest + Fast-Check (Property-Based Testing)

### Patrones Arquitectónicos
- **Guards**: Validación declarativa de permisos
- **DTOs**: Validación de entrada con class-validator
- **Services**: Lógica de negocio con programación defensiva
- **Exception Handling**: Excepciones específicas de NestJS

---

**Fecha de Creación**: 19 de Marzo, 2026  
**Prioridad**: Crítica  
**Estimación**: 2-3 días de desarrollo  
**Asignado**: Sistema de Contexto Autónomo para IA