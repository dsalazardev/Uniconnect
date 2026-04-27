# FIX-06: Event Permissions & Edit Bug - Design Document

## 🏗️ ARQUITECTURA DE LA SOLUCIÓN

### Visión General
Implementar un sistema de control de acceso robusto para eventos siguiendo el patrón establecido por `GroupOwnershipGuard`, junto con la corrección del bug de edición que afecta la funcionalidad básica del módulo.

### Principios de Diseño
1. **Consistencia Arquitectónica**: Seguir patrones existentes y probados
2. **Seguridad por Defecto**: Denegar acceso por defecto, permitir explícitamente
3. **Separación de Responsabilidades**: Backend valida, Frontend presenta
4. **Defensa en Profundidad**: Múltiples capas de validación

## 🛡️ DISEÑO DE SEGURIDAD BACKEND

### EventOwnershipGuard - Arquitectura

```typescript
@Injectable()
export class EventOwnershipGuard implements CanActivate {
  constructor(private prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // 1. Extraer contexto de request
    const request = context.switchToHttp().getRequest();
    const userId = request.user?.sub || request.user?.id_user;
    const eventId = request.params.id; // String UUID
    
    // 2. Validaciones básicas
    if (!userId) throw new ForbiddenException('Usuario no autenticado');
    if (!eventId) throw new BadRequestException('ID de evento requerido');
    
    // 3. Buscar evento con validación de existencia
    const event = await this.prisma.event.findUnique({
      where: { id: eventId }, // UUID string
      select: { created_by: true }
    });
    
    if (!event) throw new NotFoundException('Evento no encontrado');
    
    // 4. Validar propiedad O rol de superadmin
    const isOwner = event.created_by === userId;
    const isSuperAdmin = request.user?.roleName === 'superadmin';
    
    if (!isOwner && !isSuperAdmin) {
      // Log intento no autorizado
      console.warn(`[SECURITY] Unauthorized event access: User ${userId} -> Event ${eventId}`);
      throw new ForbiddenException('No tienes permisos para modificar este evento');
    }
    
    // Log acceso autorizado
    console.log(`[SECURITY] Authorized event access: User ${userId} (${isOwner ? 'owner' : 'superadmin'}) -> Event ${eventId}`);
    
    return true;
  }
}
```

### Aplicación del Guard en Controller

```typescript
@Controller('events')
export class EventsController {
  
  @UseGuards(JwtAuthGuard, EventOwnershipGuard)
  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar evento (Solo creador o superadmin)' })
  async update(
    @Param('id') id: string, // UUID string
    @GetClaim('sub') userId: number,
    @Body() updateEventDto: UpdateEventDto,
  ) {
    return this.eventsService.update(id, userId, updateEventDto);
  }

  @UseGuards(JwtAuthGuard, EventOwnershipGuard)
  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar evento (Solo creador o superadmin)' })
  async remove(
    @Param('id') id: string, // UUID string
    @GetClaim('sub') userId: number,
  ) {
    return this.eventsService.remove(id, userId);
  }
}
```

## 🔍 ANÁLISIS DEL BUG "Evento no encontrado"

### Diagnóstico de Causas Probables

#### 1. Desajuste de Tipos de ID
**Problema**: Frontend envía `number`, Backend espera `string` UUID
```typescript
// ❌ PROBLEMA PROBABLE
// Frontend
const eventId: number = 123;
await eventsService.updateEvent(eventId, data);

// Backend
@Param('id') id: string // Espera UUID string como "550e8400-e29b-41d4-a716-446655440000"
```

**Solución**: Validar y convertir tipos apropiadamente
```typescript
// ✅ SOLUCIÓN
// Frontend - Asegurar que se envíe como string
const eventId: string = event.id; // UUID string
await eventsService.updateEvent(eventId, data);

// Backend - Validar formato UUID
@Param('id', new ParseUUIDPipe()) id: string
```

#### 2. Consulta Prisma Incorrecta
**Problema**: Campo incorrecto en la consulta
```typescript
// ❌ POSIBLE ERROR
const event = await this.prisma.event.findUnique({
  where: { id_event: id } // Campo incorrecto
});

// ✅ CORRECCIÓN
const event = await this.prisma.event.findUnique({
  where: { id: id } // Campo correcto según schema
});
```

#### 3. Parámetro No Parseado
**Problema**: ID llega como undefined o null
```typescript
// ❌ PROBLEMA
@Param('id') id: string // Puede ser undefined

// ✅ SOLUCIÓN
@Param('id', new ParseUUIDPipe()) id: string // Validación automática
```

### Estrategia de Corrección

1. **Validación de Entrada**: Usar `ParseUUIDPipe` para validar formato
2. **Logging Detallado**: Agregar logs para rastrear el flujo del ID
3. **Manejo de Errores**: Mensajes descriptivos para debugging
4. **Testing**: Casos específicos para diferentes formatos de ID

## 🎨 DISEÑO DE UI CONDICIONAL FRONTEND

### Patrón de Renderizado Condicional

```typescript
// EventCard.tsx
interface EventCardProps {
  event: Event;
  currentUser: User;
  onEdit: () => void;
  onDelete: () => void;
}

export const EventCard = ({ event, currentUser, onEdit, onDelete }: EventCardProps) => {
  // Lógica de permisos
  const isOwner = event.created_by === currentUser.id_user;
  const isSuperAdmin = currentUser.roleName === 'superadmin';
  const canManage = isOwner || isSuperAdmin;

  return (
    <View style={styles.card}>
      {/* Contenido del evento */}
      <Text>{event.title}</Text>
      <Text>{event.description}</Text>
      
      {/* Indicador de propiedad */}
      {isOwner && (
        <View style={styles.ownerBadge}>
          <Icon name="person" />
          <Text>Tu evento</Text>
        </View>
      )}
      
      {/* Botones condicionales */}
      {canManage && (
        <View style={styles.actions}>
          <TouchableOpacity onPress={onEdit}>
            <Icon name="edit" />
          </TouchableOpacity>
          <TouchableOpacity onPress={onDelete}>
            <Icon name="delete" />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};
```

### Componentes a Modificar

1. **EventCard.tsx**: Tarjetas en listas de eventos
2. **EventDetail.tsx**: Vista detallada (si existe)
3. **EventModal.tsx**: Modales de evento
4. **EventList.tsx**: Lista principal de eventos

### Patrón de Validación Defensiva

```typescript
// Función utilitaria para validar permisos
export const canUserManageEvent = (event: Event, user: User): boolean => {
  if (!event || !user) return false;
  
  const isOwner = event.created_by === user.id_user;
  const isSuperAdmin = user.roleName === 'superadmin';
  
  return isOwner || isSuperAdmin;
};

// Uso en componentes
const canManage = canUserManageEvent(event, currentUser);
```

## 🔧 CORRECCIÓN DEL PAYLOAD FRONTEND

### Flujo de Datos Correcto

```typescript
// 1. EventsService - Método de actualización
class EventsService {
  async updateEvent(eventId: string, data: UpdateEventDto): Promise<Event> {
    // Validar ID antes de enviar
    if (!eventId || typeof eventId !== 'string') {
      throw new Error('ID de evento inválido');
    }
    
    console.log(`[DEBUG] Updating event: ${eventId}`, data);
    
    const response = await axios.patch(
      `${API_BASE_URL}/events/${eventId}`,
      data,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    
    return response.data;
  }
}

// 2. Hook de eventos
export const useEvents = () => {
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateEventDto }) => {
      return eventsService.updateEvent(id, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['events']);
      showToast.success('Evento actualizado correctamente');
    },
    onError: (error: any) => {
      console.error('[ERROR] Update event failed:', error);
      const message = error.response?.data?.message || 'Error al actualizar evento';
      showToast.error('Error', message);
    }
  });
  
  return { updateEvent: updateMutation.mutate };
};

// 3. Componente - Manejo del modal
const EventCard = ({ event }) => {
  const { updateEvent } = useEvents();
  
  const handleEdit = () => {
    // Asegurar que el ID se pase correctamente
    console.log(`[DEBUG] Opening edit modal for event: ${event.id}`);
    setEditingEvent(event);
    setEditModalVisible(true);
  };
  
  const handleSaveEdit = (formData: UpdateEventDto) => {
    if (!editingEvent?.id) {
      showToast.error('Error', 'ID de evento no válido');
      return;
    }
    
    console.log(`[DEBUG] Saving event: ${editingEvent.id}`, formData);
    updateEvent({ id: editingEvent.id, data: formData });
  };
};
```

## 📊 DIAGRAMA DE FLUJO DE SEGURIDAD

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Frontend UI   │    │   Backend API    │    │   Database      │
│                 │    │                  │    │                 │
├─────────────────┤    ├──────────────────┤    ├─────────────────┤
│ 1. Check perms  │───▶│ 2. JwtAuthGuard  │    │                 │
│    canManage    │    │    validates     │    │                 │
│                 │    │    user token    │    │                 │
├─────────────────┤    ├──────────────────┤    ├─────────────────┤
│ 3. Show/Hide    │    │ 4. EventOwnership│───▶│ 5. Query event  │
│    buttons      │    │    Guard checks  │    │    by ID        │
│                 │    │    ownership     │    │                 │
├─────────────────┤    ├──────────────────┤    ├─────────────────┤
│ 6. Send PATCH   │───▶│ 7. Validate ID   │    │ 8. Update if    │
│    request      │    │    and execute   │    │    authorized   │
│                 │    │    update        │    │                 │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

## 🧪 ESTRATEGIA DE TESTING

### Testing del Guard

```typescript
describe('EventOwnershipGuard', () => {
  it('should allow owner to access their event', async () => {
    // Setup: User owns event
    const mockEvent = { id: 'uuid', created_by: 123 };
    const mockUser = { sub: 123, roleName: 'student' };
    
    // Test: Guard should return true
    const result = await guard.canActivate(mockContext);
    expect(result).toBe(true);
  });
  
  it('should allow superadmin to access any event', async () => {
    // Setup: Superadmin accessing other's event
    const mockEvent = { id: 'uuid', created_by: 456 };
    const mockUser = { sub: 123, roleName: 'superadmin' };
    
    // Test: Guard should return true
    const result = await guard.canActivate(mockContext);
    expect(result).toBe(true);
  });
  
  it('should deny access to non-owner non-superadmin', async () => {
    // Setup: Regular user accessing other's event
    const mockEvent = { id: 'uuid', created_by: 456 };
    const mockUser = { sub: 123, roleName: 'student' };
    
    // Test: Guard should throw ForbiddenException
    await expect(guard.canActivate(mockContext))
      .rejects.toThrow(ForbiddenException);
  });
});
```

### Testing de UI Condicional

```typescript
describe('EventCard', () => {
  it('should show edit buttons for event owner', () => {
    const event = { id: 'uuid', created_by: 123 };
    const user = { id_user: 123, roleName: 'student' };
    
    render(<EventCard event={event} currentUser={user} />);
    
    expect(screen.getByTestId('edit-button')).toBeVisible();
    expect(screen.getByTestId('delete-button')).toBeVisible();
  });
  
  it('should hide edit buttons for non-owner', () => {
    const event = { id: 'uuid', created_by: 456 };
    const user = { id_user: 123, roleName: 'student' };
    
    render(<EventCard event={event} currentUser={user} />);
    
    expect(screen.queryByTestId('edit-button')).toBeNull();
    expect(screen.queryByTestId('delete-button')).toBeNull();
  });
});
```

## 🔄 PLAN DE MIGRACIÓN

### Fase 1: Preparación
1. Crear `EventOwnershipGuard`
2. Agregar tests unitarios
3. Validar en entorno de desarrollo

### Fase 2: Backend Security
1. Aplicar Guard a endpoints
2. Corregir bug de "Evento no encontrado"
3. Tests de integración

### Fase 3: Frontend Security
1. Implementar UI condicional
2. Corregir payload de edición
3. Tests de componentes

### Fase 4: Validación
1. Tests end-to-end
2. Pruebas de penetración
3. Actualización de documentación

## 📋 CONSIDERACIONES TÉCNICAS

### Performance
- **Guard Eficiente**: Una sola consulta Prisma por validación
- **Caching**: Considerar cache de permisos para eventos frecuentemente accedidos
- **Índices DB**: Asegurar índice en `created_by` para consultas rápidas

### Escalabilidad
- **Patrón Reutilizable**: Guard puede extenderse para otros recursos
- **Configuración**: Roles autorizados configurables
- **Logging**: Sistema de logs escalable para auditoría

### Mantenibilidad
- **Código Limpio**: Funciones pequeñas y bien documentadas
- **Separación**: Lógica de negocio separada de validación
- **Testing**: Cobertura completa para facilitar refactoring

---

**Fecha de Creación**: 20 de Marzo, 2026  
**Última Actualización**: 20 de Marzo, 2026  
**Estado**: Draft - Pendiente de Implementación  
**Arquitecto**: AI-First System