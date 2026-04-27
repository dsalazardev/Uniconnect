# FIX-05: Group Invitations & Ownership Permissions - Tasks

## 📋 Plan de Implementación Estricto con Property-Based Testing

### Fase 1: Tests de Exploración (Demostrar Bugs)

#### Task 1.1: Crear Test de Exploración - Error 400 en Invitaciones
- [ ] **1.1.1** Crear archivo `group-invitations.exploration.spec.ts`
- [ ] **1.1.2** Implementar test que demuestre el error HTTP 400 al aceptar invitaciones
- [ ] **1.1.3** Usar Fast-Check para generar casos de prueba con race conditions
- [ ] **1.1.4** Documentar el comportamiento actual (debe fallar)
- [ ] **1.1.5** Ejecutar test y confirmar que reproduce el bug

**Criterio de Éxito**: Test falla consistentemente, demostrando el bug

#### Task 1.2: Crear Test de Exploración - Broken Access Control
- [ ] **1.2.1** Crear archivo `groups.access-control.exploration.spec.ts`
- [ ] **1.2.2** Implementar test que demuestre bypass de permisos en update/remove
- [ ] **1.2.3** Usar Property-Based Testing para probar diferentes combinaciones de permisos
- [ ] **1.2.4** Documentar vectores de ataque identificados
- [ ] **1.2.5** Ejecutar test y confirmar vulnerabilidades

**Criterio de Éxito**: Test demuestra que usuarios sin permisos pueden modificar grupos

### Fase 2: Implementación Backend

#### Task 2.1: Corregir Servicio de Invitaciones
- [ ] **2.1.1** Modificar `respondToInvitation` en `group-invitations.service.ts`
- [ ] **2.1.2** Implementar transacción atómica con `$transaction`
- [ ] **2.1.3** Usar `upsert` defensivo para memberships
- [ ] **2.1.4** Agregar manejo específico de errores P2002
- [ ] **2.1.5** Implementar logging detallado para debugging
- [ ] **2.1.6** Agregar validación de grupo no direct_message

**Criterio de Éxito**: Invitaciones se aceptan sin errores HTTP 400
#### Task 2.2: Fortalecer Guards de Ownership
- [ ] **2.2.1** Modificar `GroupOwnershipGuard` para incluir validación de admin
- [ ] **2.2.2** Agregar consulta de memberships en el guard
- [ ] **2.2.3** Implementar logging de intentos de acceso no autorizado
- [ ] **2.2.4** Verificar aplicación correcta del guard en endpoints críticos
- [ ] **2.2.5** Agregar validación de parámetros de entrada

**Criterio de Éxito**: Guard bloquea correctamente usuarios sin permisos

#### Task 2.3: Implementar Validación Defensiva en Servicios
- [ ] **2.3.1** Agregar método `validateOwnershipOrAdmin` en `groups.service.ts`
- [ ] **2.3.2** Modificar método `update` con validación defensiva
- [ ] **2.3.3** Modificar método `remove` con validación defensiva
- [ ] **2.3.4** Implementar logging de operaciones de administración
- [ ] **2.3.5** Agregar manejo de errores específicos

**Criterio de Éxito**: Servicios rechazan operaciones no autorizadas como fallback

#### Task 2.4: Mejorar Cálculo de Permisos en GroupInfo
- [ ] **2.4.1** Modificar `getGroupInfo` para incluir validación de admin
- [ ] **2.4.2** Calcular correctamente `canManage` y `canManageMembers`
- [ ] **2.4.3** Agregar campo `userRole` con valores precisos
- [ ] **2.4.4** Verificar que `isOwner` e `isAdmin` se calculen correctamente
- [ ] **2.4.5** Actualizar tipos TypeScript si es necesario

**Criterio de Éxito**: Frontend recibe información precisa de permisos

### Fase 3: Implementación Frontend

#### Task 3.1: Modificar GroupCard para Ocultar Botones
- [ ] **3.1.1** Agregar prop `currentUserId` a `GroupCard`
- [ ] **3.1.2** Calcular `isOwner` y `isAdmin` localmente
- [ ] **3.1.3** Implementar lógica condicional para mostrar/ocultar botones
- [ ] **3.1.4** Agregar validación defensiva antes de llamadas API
- [ ] **3.1.5** Actualizar componentes padre que usan `GroupCard`

**Criterio de Éxito**: Botones de editar/eliminar solo aparecen para usuarios autorizados

#### Task 3.2: Verificar GroupInfoModal
- [ ] **3.2.1** Confirmar que `groupInfo.canManage` se usa correctamente
- [ ] **3.2.2** Verificar que botón de invitar se oculta apropiadamente
- [ ] **3.2.3** Agregar validación defensiva en handlers de eventos
- [ ] **3.2.4** Implementar mensajes de error para acciones no permitidas
- [ ] **3.2.5** Actualizar tipos TypeScript según cambios en backend

**Criterio de Éxito**: Modal solo muestra opciones de administración a usuarios autorizados

#### Task 3.3: Implementar Validación Defensiva en Hooks
- [ ] **3.3.1** Modificar hooks de grupos para validar permisos antes de API calls
- [ ] **3.3.2** Agregar manejo de errores 403 Forbidden
- [ ] **3.3.3** Implementar mensajes de error user-friendly
- [ ] **3.3.4** Agregar logging de errores de permisos
- [ ] **3.3.5** Actualizar invalidación de queries según cambios

**Criterio de Éxito**: Hooks manejan correctamente errores de permisos

### Fase 4: Property-Based Testing

#### Task 4.1: Implementar Tests de Invitaciones
- [ ] **4.1.1** Crear `group-invitations.pbt.spec.ts`
- [ ] **4.1.2** Test: Aceptar invitación múltiples veces no crea memberships duplicadas
- [ ] **4.1.3** Test: Solo invitaciones 'pending' pueden ser aceptadas
- [ ] **4.1.4** Test: Solo el invitee puede responder su invitación
- [ ] **4.1.5** Test: Memberships se crean correctamente al aceptar
- [ ] **4.1.6** Ejecutar tests y verificar que pasan

**Criterio de Éxito**: Todos los tests de invitaciones pasan consistentemente

#### Task 4.2: Implementar Tests de Access Control
- [ ] **4.2.1** Crear `groups.access-control.pbt.spec.ts`
- [ ] **4.2.2** Test: Solo owners/admins pueden actualizar grupos
- [ ] **4.2.3** Test: Solo owners/admins pueden eliminar grupos
- [ ] **4.2.4** Test: Usuarios sin permisos reciben 403 Forbidden
- [ ] **4.2.5** Test: Guards y servicios son consistentes en validación
- [ ] **4.2.6** Ejecutar tests y verificar que pasan

**Criterio de Éxito**: Todos los tests de control de acceso pasan

#### Task 4.3: Tests de Integración Frontend-Backend
- [ ] **4.3.1** Crear tests E2E para flujo completo de invitaciones
- [ ] **4.3.2** Test: UI oculta botones según permisos del usuario
- [ ] **4.3.3** Test: Llamadas API fallan apropiadamente para usuarios sin permisos
- [ ] **4.3.4** Test: Mensajes de error se muestran correctamente
- [ ] **4.3.5** Ejecutar tests y verificar integración completa

**Criterio de Éxito**: Integración frontend-backend funciona correctamente

### Fase 5: Checkpoint y Validación

#### Task 5.1: Ejecutar Tests de Exploración Originales
- [ ] **5.1.1** Re-ejecutar tests de exploración de Fase 1
- [ ] **5.1.2** Verificar que tests de error 400 ahora pasan
- [ ] **5.1.3** Verificar que tests de access control ahora pasan
- [ ] **5.1.4** Documentar mejoras en comportamiento
- [ ] **5.1.5** Confirmar que bugs originales están corregidos

**Criterio de Éxito**: Tests de exploración originales ahora pasan

#### Task 5.2: Validación de Seguridad
- [ ] **5.2.1** Ejecutar audit de seguridad en endpoints modificados
- [ ] **5.2.2** Verificar que logs de seguridad funcionan correctamente
- [ ] **5.2.3** Confirmar que no hay regresiones en funcionalidad existente
- [ ] **5.2.4** Validar que UI es consistente con permisos de backend
- [ ] **5.2.5** Documentar mejoras de seguridad implementadas

**Criterio de Éxito**: Sistema pasa audit de seguridad completo

#### Task 5.3: Testing de Regresión
- [ ] **5.3.1** Ejecutar suite completa de tests existentes
- [ ] **5.3.2** Verificar que funcionalidad no relacionada sigue funcionando
- [ ] **5.3.3** Confirmar que performance no se degradó
- [ ] **5.3.4** Validar que todos los endpoints de grupos funcionan
- [ ] **5.3.5** Documentar cualquier cambio en comportamiento

**Criterio de Éxito**: No hay regresiones en funcionalidad existente

## 🎯 Definición de "Terminado"

### Criterios de Aceptación Global
- [ ] **Error 400**: 0 errores HTTP 400 en aceptación de invitaciones
- [ ] **Access Control**: 0 modificaciones no autorizadas de grupos
- [ ] **UI Consistency**: 100% de botones ocultos según permisos
- [ ] **Tests**: Todos los tests de PBT pasan consistentemente
- [ ] **Security**: Audit de seguridad completo aprobado
- [ ] **Regression**: No regresiones en funcionalidad existente

### Métricas de Validación
- **Functional**: Invitaciones funcionan sin errores
- **Security**: Solo usuarios autorizados pueden modificar grupos
- **UX**: UI refleja correctamente permisos del usuario
- **Quality**: >95% cobertura de tests en código modificado

---

**Estimación Total**: 2-3 días de desarrollo  
**Prioridad**: Crítica  
**Dependencias**: Ninguna  
**Riesgos**: Posibles regresiones en funcionalidad de grupos existente