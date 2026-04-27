# FIX-05: Group Invitations & Ownership Permissions - Design

## 🏗️ Arquitectura de la Solución

### Visión General
Este bugfix implementa una solución de tres capas para corregir las vulnerabilidades identificadas:
1. **Capa de Datos**: Corrección de transacciones y manejo de constraints
2. **Capa de Lógica**: Fortalecimiento de guards y servicios
3. **Capa de Presentación**: Validación condicional de UI

## 🔍 Análisis de Causa Raíz

### Bug 1: Error 400 en Invitaciones

#### Causa Raíz Identificada
**Hipótesis Principal**: Race condition en la creación de memberships durante la aceptación de invitaciones.

**Flujo Problemático**:
```typescript
// En respondToInvitation()
1. Validar invitación (OK)
2. Actualizar status a 'accepted' (OK)
3. Crear membership → FALLA con P2002 si ya existe
```

**Escenarios de Fallo**:
- Usuario acepta invitación múltiples veces rápidamente
- Membership ya existe por otro flujo (join request)
- Transacción no atómica entre update invitation y create membership

#### Estrategia de Mitigación
```typescript
// Implementar transacción atómica con upsert defensivo
await this.prisma.$transaction(async (tx) => {
  // 1. Actualizar invitación
  const invitation = await tx.group_invitation.update({...});
  
  // 2. Upsert membership (crear o ignorar si existe)
  const membership = await tx.membership.upsert({
    where: { id_user_id_group: { id_user: userId, id_group: groupId } },
    create: { id_user: userId, id_group: groupId, is_admin: false },
    update: {} // No cambiar si ya existe
  });
});
```

### Bug 2: Broken Access Control

#### Causa Raíz Identificada
**Análisis del Código Actual**:
- `GroupOwnershipGuard` está correctamente implementado
- Endpoints `update` y `remove` tienen el guard aplicado
- **Problema**: Posible bypass o validación insuficiente en edge cases

**Posibles Vectores de Ataque**:
1. **Parameter Pollution**: Manipulación de parámetros de request
2. **JWT Manipulation**: Tokens modificados o expirados
3. **Race Conditions**: Cambios de ownership durante validación
4. **Missing Validation**: Validación faltante en servicios

#### Estrategia de Fortalecimiento
```typescript
// Implementar validación de doble capa
@UseGuards(JwtAuthGuard, GroupOwnershipGuard)
async update(id: number, userId: number, dto: UpdateGroupDto) {
  // Guard ya validó, pero agregar validación defensiva
  await this.groupsService.validateOwnershipOrAdmin(id, userId);
  return this.groupsService.update(id, userId, dto);
}
```

## 🛠️ Diseño de la Solución

### Componente 1: Corrección de Invitaciones (Backend)

#### Archivo: `group-invitations.service.ts`
```typescript
async respondToInvitation(
  invitationId: number,
  userId: number,
  respondDto: RespondGroupInvitationDto,
) {
  return await this.prisma.$transaction(async (tx) => {
    // 1. Buscar y validar invitación
    const invitation = await tx.group_invitation.findUnique({
      where: { id_invitation: invitationId },
      include: { group: true },
    });

    if (!invitation) {
      throw new NotFoundException('Invitación no encontrada');
    }

    if (invitation.invitee_id !== userId) {
      throw new ForbiddenException('No tienes permiso para responder esta invitación');
    }

    if (invitation.status !== 'pending') {
      throw new BadRequestException('Esta invitación ya fue respondida anteriormente');
    }

    // 2. Actualizar invitación
    const updatedInvitation = await tx.group_invitation.update({
      where: { id_invitation: invitationId },
      data: {
        status: respondDto.status,
        responded_at: new Date(),
      },
    });

    // 3. Si se acepta, crear membership con upsert defensivo
    if (respondDto.status === 'accepted') {
      const membership = await tx.membership.upsert({
        where: {
          id_user_id_group: {
            id_user: userId,
            id_group: invitation.id_group,
          },
        },
        create: {
          id_user: userId,
          id_group: invitation.id_group,
          is_admin: false,
          joined_at: new Date(),
        },
        update: {
          // Si ya existe, no cambiar nada (usuario ya es miembro)
        },
        include: {
          user: { select: { full_name: true } },
        },
      });

      // Emitir eventos...
      return { message: 'Invitación aceptada', invitation: updatedInvitation };
    }

    return { message: 'Invitación rechazada', invitation: updatedInvitation };
  });
}
```

#### Mejoras Adicionales:
- **Logging**: Agregar logs detallados para debugging
- **Validation**: Validar que el grupo no sea direct_message
- **Error Handling**: Manejo específico de errores P2002

### Componente 2: Fortalecimiento de Guards (Backend)

#### Archivo: `groups.service.ts`
```typescript
// Agregar método de validación defensiva
async validateOwnershipOrAdmin(groupId: number, userId: number): Promise<void> {
  const group = await this.prisma.group.findUnique({
    where: { id_group: groupId },
    include: {
      memberships: {
        where: { id_user: userId },
        select: { is_admin: true },
      },
    },
  });

  if (!group) {
    throw new NotFoundException('Grupo no encontrado');
  }

  const isOwner = group.owner_id === userId;
  const isAdmin = group.memberships.some(m => m.is_admin);

  if (!isOwner && !isAdmin) {
    throw new ForbiddenException(
      'No tienes permisos para realizar esta acción. Solo el propietario o administradores pueden hacerlo.'
    );
  }
}

// Modificar métodos update y remove
async update(id: number, userId: number, updateGroupDto: UpdateGroupDto) {
  // Validación defensiva adicional
  await this.validateOwnershipOrAdmin(id, userId);
  
  // Resto de la lógica...
}

async remove(id_group: number, userId: number) {
  // Validación defensiva adicional
  await this.validateOwnershipOrAdmin(id_group, userId);
  
  // Resto de la lógica...
}
```

#### Archivo: `group-ownership.guard.ts` (Mejoras)
```typescript
async canActivate(context: ExecutionContext): Promise<boolean> {
  const request = context.switchToHttp().getRequest();
  const userId = request.user?.sub || request.user?.id_user;
  const groupId = parseInt(request.params.id || request.params.groupId);

  // Validaciones básicas
  if (!userId) {
    throw new ForbiddenException('Usuario no autenticado.');
  }

  if (!groupId || isNaN(groupId)) {
    throw new BadRequestException('ID de grupo inválido.');
  }

  // Buscar grupo con información de memberships
  const group = await this.prisma.group.findUnique({
    where: { id_group: groupId },
    select: {
      owner_id: true,
      memberships: {
        where: { id_user: userId },
        select: { is_admin: true },
      },
    },
  });

  if (!group) {
    throw new BadRequestException('Grupo no encontrado.');
  }

  // Validar ownership o admin
  const isOwner = group.owner_id === userId;
  const isAdmin = group.memberships.some(m => m.is_admin);

  if (!isOwner && !isAdmin) {
    // Log intento de acceso no autorizado
    console.warn(`Unauthorized access attempt: User ${userId} tried to access group ${groupId}`);
    
    throw new ForbiddenException(
      'No tienes permiso para realizar esta acción. Solo el propietario o administradores pueden hacerlo.',
    );
  }

  return true;
}
```

### Componente 3: Validación Condicional de UI (Frontend)

#### Archivo: `GroupCard.tsx`
```typescript
interface GroupCardProps {
  group: Group;
  onPress: () => void;
  onEdit: () => void;
  onDelete: () => void;
  isDeleting?: boolean;
  currentUserId: number; // Agregar prop
}

export const GroupCard = ({ 
  group, 
  onPress, 
  onEdit, 
  onDelete, 
  isDeleting = false,
  currentUserId 
}: GroupCardProps) => {
  const membersCount = group._count?.memberships || 0;
  
  // Calcular permisos
  const isOwner = group.owner_id === currentUserId;
  const userMembership = group.memberships?.find(m => m.id_user === currentUserId);
  const isAdmin = userMembership?.is_admin || false;
  const canManage = isOwner || isAdmin;

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          {/* ... contenido existente ... */}
        </View>

        {/* Solo mostrar acciones si el usuario puede gestionar */}
        {canManage && (
          <View style={styles.actions}>
            <TouchableOpacity
              onPress={(e) => {
                e.stopPropagation();
                onEdit();
              }}
              style={styles.actionButton}
              disabled={isDeleting}
            >
              <Ionicons name="create-outline" size={22} color="#D9B97E" />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              style={styles.actionButton}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <ActivityIndicator size="small" color="#ff4d4d" />
              ) : (
                <Ionicons name="trash-outline" size={22} color="#ff4d4d" />
              )}
            </TouchableOpacity>
          </View>
        )}
      </View>
      {/* ... resto del componente ... */}
    </TouchableOpacity>
  );
};
```

#### Archivo: `GroupInfoModal.tsx`
```typescript
// El componente ya tiene la lógica correcta:
{groupInfo?.canManage && (
  <TouchableOpacity
    onPress={() => setShowInviteModal(true)}
    style={styles.inviteButton}
    activeOpacity={0.7}
  >
    <Ionicons name="person-add" size={24} color="#D9B97E" />
  </TouchableOpacity>
)}

// Verificar que groupInfo.canManage se calcule correctamente en el backend
```

#### Archivo: `groups.service.ts` (Backend - Cálculo de Permisos)
```typescript
async getGroupInfo(groupId: number, userId: number) {
  const group = await this.prisma.group.findUnique({
    where: { id_group: groupId },
    include: {
      course: { select: { name: true } },
      owner: { select: { id_user: true, full_name: true, picture: true } },
      memberships: {
        include: {
          user: {
            select: { id_user: true, full_name: true, picture: true, email: true },
          },
        },
      },
    },
  });

  if (!group) {
    throw new NotFoundException('Grupo no encontrado');
  }

  // Calcular permisos del usuario
  const isOwner = group.owner_id === userId;
  const userMembership = group.memberships.find(m => m.id_user === userId);
  const isAdmin = userMembership?.is_admin || false;
  const isMember = !!userMembership;

  return {
    ...group,
    userRole: isOwner ? 'owner' : isAdmin ? 'admin' : isMember ? 'member' : 'none',
    canManage: isOwner || isAdmin,
    canManageMembers: isOwner || isAdmin,
    isMember,
    isOwner,
  };
}
```

## 🧪 Estrategia de Testing

### Property-Based Testing con Fast-Check

#### Test 1: Invitaciones - No Duplicación de Memberships
```typescript
// Propiedad: Aceptar una invitación múltiples veces no debe crear memberships duplicadas
fc.assert(fc.property(
  fc.integer({ min: 1, max: 1000 }), // userId
  fc.integer({ min: 1, max: 100 }),  // groupId
  fc.integer({ min: 1, max: 50 }),   // invitationId
  async (userId, groupId, invitationId) => {
    // Crear invitación pendiente
    await setupPendingInvitation(invitationId, userId, groupId);
    
    // Aceptar múltiples veces concurrentemente
    const promises = Array(5).fill(null).map(() => 
      groupInvitationsService.respondToInvitation(invitationId, userId, { status: 'accepted' })
    );
    
    await Promise.allSettled(promises);
    
    // Verificar que solo existe una membership
    const memberships = await prisma.membership.findMany({
      where: { id_user: userId, id_group: groupId }
    });
    
    expect(memberships).toHaveLength(1);
  }
));
```

#### Test 2: Access Control - Solo Owners/Admins Pueden Modificar
```typescript
// Propiedad: Solo usuarios con permisos pueden modificar grupos
fc.assert(fc.property(
  fc.integer({ min: 1, max: 1000 }), // userId
  fc.integer({ min: 1, max: 100 }),  // groupId
  fc.boolean(),                      // isOwner
  fc.boolean(),                      // isAdmin
  async (userId, groupId, isOwner, isAdmin) => {
    // Setup: Crear grupo y membership según flags
    await setupGroupWithPermissions(groupId, userId, isOwner, isAdmin);
    
    const shouldSucceed = isOwner || isAdmin;
    
    if (shouldSucceed) {
      // Debe permitir modificación
      await expect(
        groupsService.update(groupId, userId, { name: 'Updated Name' })
      ).resolves.not.toThrow();
    } else {
      // Debe denegar modificación
      await expect(
        groupsService.update(groupId, userId, { name: 'Updated Name' })
      ).rejects.toThrow(ForbiddenException);
    }
  }
));
```

## 📊 Métricas de Éxito

### Métricas Técnicas
- **Error Rate**: 0% errores HTTP 400 en aceptación de invitaciones
- **Security Violations**: 0 modificaciones no autorizadas detectadas
- **UI Consistency**: 100% de botones ocultos correctamente según permisos
- **Test Coverage**: >95% cobertura en componentes modificados

### Métricas de Negocio
- **User Experience**: Flujo de invitaciones funciona sin interrupciones
- **Security Posture**: Eliminación completa de vulnerabilidades de acceso
- **System Reliability**: Reducción de errores de transacción en 100%

## 🔒 Consideraciones de Seguridad

### Principios Aplicados
1. **Defense in Depth**: Validación en guards, servicios y UI
2. **Fail Secure**: Denegar por defecto en caso de error
3. **Least Privilege**: Permisos mínimos necesarios
4. **Audit Trail**: Logging de operaciones críticas

### Validaciones Implementadas
- Autenticación JWT en todos los endpoints
- Validación de ownership/admin en múltiples capas
- Transacciones atómicas para prevenir race conditions
- Validación de entrada con DTOs tipados

## 📝 Plan de Implementación

### Fase 1: Backend Fixes
1. Corregir `respondToInvitation` con transacción atómica
2. Fortalecer `GroupOwnershipGuard` con validación de admin
3. Agregar validación defensiva en servicios
4. Implementar logging de seguridad

### Fase 2: Frontend Validation
1. Modificar `GroupCard` para ocultar botones según permisos
2. Verificar cálculo correcto de `canManage` en `GroupInfo`
3. Agregar validación defensiva antes de llamadas API
4. Implementar mensajes de error apropiados

### Fase 3: Testing & Validation
1. Implementar tests de property-based testing
2. Ejecutar tests de exploración para confirmar bugs
3. Validar corrección con tests de regresión
4. Verificar métricas de seguridad

---

**Fecha de Creación**: 19 de Marzo, 2026  
**Arquitecto**: Sistema de Contexto Autónomo para IA  
**Revisión**: Pendiente  
**Estado**: Diseño Completo