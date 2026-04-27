# Design: US-O01 - Observer para Eventos del Grupo de Estudio

## Context

**Estado Actual** (basado en análisis técnico):
- EventEmitter2 ya configurado y funcionando en el sistema
- `MESSAGE_EVENTS` define 21 eventos, incluyendo 4 eventos de grupos NO emitidos:
  - `GROUP_CREATED`, `GROUP_UPDATED`, `GROUP_DELETED`, `USER_LEFT_GROUP`
- `NotificationEventListener` ya implementa 8 handlers con `@OnEvent()`
- `GroupsService` ya emite 3 eventos (solicitudes de unión)
- `GroupInvitationsService` ya emite 4 eventos (invitaciones)

**Restricciones Arquitectónicas** (de AGENTS.md):
- **OBLIGATORIO**: Usar `@nestjs/event-emitter` (ya instalado)
- **OBLIGATORIO**: Extender `MESSAGE_EVENTS` existentes
- **OBLIGATORIO**: Crear listeners con decorador `@OnEvent()`
- **OBLIGATORIO**: Seguir patrón de `NotificationEventListener`
- **UBICACIÓN**: `src/groups/listeners/group-activity.listener.ts`
- **OBLIGATORIO**: Tipado estricto - cero `any`
- **OBLIGATORIO**: Logging con `Logger` de NestJS
- **OBLIGATORIO**: Programación defensiva con try/catch

**Stakeholders**:
- Equipo de desarrollo backend (implementación)
- Equipo de desarrollo frontend (consumo de notificaciones)
- Evaluadores académicos (validación del patrón Observer)

## Goals / Non-Goals

**Goals**:
- Completar emisión de 4 eventos faltantes en `GroupsService`
- Crear 4 interfaces de payload tipadas en `message.events.ts`
- Crear `GroupActivityListener` con 4 handlers `@OnEvent()`
- Implementar lógica de notificación para cada evento
- Implementar tests unitarios con `jest.spyOn()`
- Documentar el patrón Observer para eventos de grupo

**Non-Goals**:
- NO modificar la estructura de `MESSAGE_EVENTS` (solo agregar payloads)
- NO cambiar el esquema de base de datos
- NO modificar la firma de métodos existentes en `GroupsService`
- NO crear nuevos módulos o servicios (usar infraestructura existente)
- NO implementar notificaciones push (solo notificaciones en BD)

## Decisions

### Decision 1: Crear Listener Separado vs Extender NotificationEventListener

**Decisión**: Crear `GroupActivityListener` separado en `src/groups/listeners/`

**Rationale**:
- **Separación de Responsabilidades**: `NotificationEventListener` ya tiene 8 handlers, agregar 4 más lo haría muy grande
- **Cohesión por Dominio**: Eventos de grupos pertenecen al dominio de grupos, no al dominio de notificaciones
- **Facilita Testing**: Tests específicos para eventos de grupo sin afectar tests de notificaciones
- **Escalabilidad**: Permite agregar más listeners específicos por dominio en el futuro

**Alternativas Consideradas**:
- ❌ Extender `NotificationEventListener`: Viola Single Responsibility Principle, listener demasiado grande
- ❌ Crear múltiples listeners (uno por evento): Overhead innecesario, 4 eventos están relacionados

### Decision 2: Ubicación de Emisiones de Eventos

**Decisión**: Emitir eventos AL FINAL de cada método, DESPUÉS de operaciones exitosas en BD

**Rationale**:
- **Consistencia**: Solo emitir si la operación fue exitosa (transacción completada)
- **Evitar Notificaciones Falsas**: Si la operación falla, no se emite evento
- **Patrón Existente**: `GroupsService` ya emite eventos al final de `requestGroupAccess()`, `acceptJoinRequest()`, etc.

**Ubicaciones Exactas**:
```typescript
// create() - Después de transacción exitosa
const group = await this.prisma.$transaction(...);
this.eventEmitter.emit(MESSAGE_EVENTS.GROUP_CREATED, payload);
return group;

// update() - Después de update exitoso
const updated = await this.prisma.group.update(...);
this.eventEmitter.emit(MESSAGE_EVENTS.GROUP_UPDATED, payload);
return updated;

// remove() - Después de delete exitoso
await this.prisma.group.delete(...);
this.eventEmitter.emit(MESSAGE_EVENTS.GROUP_DELETED, payload);

// leaveGroup() - Después de delete membership exitoso
await this.prisma.membership.delete(...);
this.eventEmitter.emit(MESSAGE_EVENTS.USER_LEFT_GROUP, payload);
```

### Decision 3: Estructura de Payloads

**Decisión**: Payloads tipados con información mínima necesaria para notificaciones

**Rationale**:
- **Type Safety**: Interfaces TypeScript previenen errores en tiempo de compilación
- **Documentación Implícita**: Los tipos documentan qué datos están disponibles
- **Consistencia**: Seguir patrón de payloads existentes en `message.events.ts`

**Estructura de Payloads**:
```typescript
export interface GroupCreatedPayload {
  id_group: number;
  group_name: string;
  owner_id: number;
  owner_name: string;
  id_course: number;
  course_name: string;
  created_at: Date;
}

export interface GroupUpdatedPayload {
  id_group: number;
  group_name: string;
  owner_id: number;
  updated_fields: string[]; // ['name', 'description']
  updated_at: Date;
}

export interface GroupDeletedPayload {
  id_group: number;
  group_name: string;
  owner_id: number;
  deleted_at: Date;
}

export interface UserLeftGroupPayload {
  id_user: number;
  user_name: string;
  id_group: number;
  group_name: string;
  left_at: Date;
}
```

### Decision 4: Lógica de Notificación por Evento

**Decisión**: Notificaciones específicas según el tipo de evento

**Rationale**:
- **GROUP_CREATED**: Notificar solo al owner (confirmación de creación)
- **GROUP_UPDATED**: Notificar a todos los miembros (cambios en el grupo)
- **GROUP_DELETED**: Notificar a todos los miembros (grupo eliminado)
- **USER_LEFT_GROUP**: Notificar a todos los miembros restantes (alguien salió)

**Tabla de Notificaciones**:

| Evento | Destinatarios | Mensaje |
|--------|---------------|---------|
| `GROUP_CREATED` | Owner | "Grupo '{name}' creado exitosamente" |
| `GROUP_UPDATED` | Todos los miembros | "El grupo '{name}' fue actualizado" |
| `GROUP_DELETED` | Todos los miembros | "El grupo '{name}' fue eliminado" |
| `USER_LEFT_GROUP` | Miembros restantes | "{user} salió del grupo '{name}'" |

### Decision 5: Estrategia de Testing

**Decisión**: Tests unitarios con `jest.spyOn()` para rastrear emisiones

**Rationale**:
- AGENTS.md especifica usar `jest.spyOn(eventEmitter, 'emit')`
- Valida que el sujeto (GroupsService) emita eventos correctamente
- Valida que el observador (GroupActivityListener) reaccione correctamente
- No requiere levantar infraestructura completa

**Estructura de Tests**:
```typescript
// Test de Sujeto (GroupsService)
describe('GroupsService - Observer Pattern', () => {
  it('should emit GROUP_CREATED event on create', async () => {
    const spy = jest.spyOn(eventEmitter, 'emit');
    await service.create(dto);
    expect(spy).toHaveBeenCalledWith(MESSAGE_EVENTS.GROUP_CREATED, expect.any(Object));
  });
});

// Test de Observador (GroupActivityListener)
describe('GroupActivityListener', () => {
  it('should create notification on GROUP_CREATED', async () => {
    await listener.handleGroupCreated(payload);
    expect(prisma.notification.create).toHaveBeenCalled();
  });
});
```

## Risks / Trade-offs

### Risk 1: Eventos Emitidos Pero No Escuchados
**Riesgo**: Si el listener falla, los eventos se pierden (EventEmitter2 no persiste eventos).

**Mitigación**:
- Logging defensivo en cada handler con try/catch
- Si un handler falla, no afecta la operación principal (grupo se crea/actualiza/elimina correctamente)
- Monitoreo de logs para detectar fallos en listeners

### Risk 2: Notificaciones Duplicadas
**Riesgo**: Si un método llama a otro que también emite eventos, podrían duplicarse notificaciones.

**Mitigación**:
- Revisar flujos de llamadas en `GroupsService` para evitar emisiones duplicadas
- Documentar qué métodos emiten eventos
- Tests que validen que cada operación emite exactamente 1 evento

### Risk 3: Performance con Muchos Miembros
**Riesgo**: `GROUP_UPDATED` y `GROUP_DELETED` notifican a TODOS los miembros. En grupos grandes (50+ miembros), podría ser lento.

**Mitigación**:
- Usar `createMany()` de Prisma para inserción batch de notificaciones
- Considerar límite de miembros por grupo (ya existe validación de 3 grupos por materia)
- Si se vuelve problema, implementar queue asíncrona (fuera de scope de US-O01)

### Risk 4: Cambios en Firma de Métodos
**Riesgo**: Agregar emisiones podría requerir datos adicionales no disponibles en el método.

**Mitigación**:
- Análisis previo confirmó que todos los datos necesarios están disponibles en cada método
- `create()` tiene acceso a `group`, `user`, `course`
- `update()` tiene acceso a `group`, `updateGroupDto`
- `remove()` tiene acceso a `group`
- `leaveGroup()` tiene acceso a `membership`, `user`, `group`

## Migration Plan

**Fase 1: Preparación** (Sin Downtime)
1. Agregar interfaces de payload a `message.events.ts`
2. Crear `GroupActivityListener` con handlers vacíos (solo logging)
3. Registrar listener en `GroupsModule`
4. Deploy - listeners no hacen nada aún, sin impacto

**Fase 2: Emisión de Eventos** (Sin Downtime)
1. Agregar emisiones en `GroupsService` (al final de cada método)
2. Deploy - eventos se emiten pero listeners solo loggean
3. Monitorear logs para confirmar emisiones

**Fase 3: Implementación de Notificaciones** (Sin Downtime)
1. Implementar lógica de notificación en cada handler
2. Deploy - notificaciones empiezan a crearse
3. Monitorear tabla `notification` para confirmar creación

**Fase 4: Testing y Validación**
1. Ejecutar tests unitarios
2. Pruebas manuales de cada flujo
3. Verificar notificaciones en frontend

**Rollback Strategy**:
- Si hay problemas, comentar emisiones de eventos en `GroupsService`
- Los listeners no causan problemas si no reciben eventos
- No hay cambios de schema, por lo que no hay migraciones que revertir

## Open Questions

1. **¿Notificar al owner en GROUP_UPDATED?**: ¿El owner debe recibir notificación de sus propios cambios?
   - **Decisión Propuesta**: NO - El owner ya sabe que actualizó el grupo, solo notificar a otros miembros

2. **¿Incluir datos del update en GROUP_UPDATED?**: ¿Mostrar qué campos cambiaron en la notificación?
   - **Decisión Propuesta**: SÍ - Incluir `updated_fields: string[]` en payload para mensajes más descriptivos

3. **¿Notificar al usuario que sale en USER_LEFT_GROUP?**: ¿El usuario que sale debe recibir confirmación?
   - **Decisión Propuesta**: NO - El usuario ya sabe que salió, solo notificar a miembros restantes

4. **¿Agregar evento GROUP_MEMBER_REMOVED?**: ¿Diferenciar entre salida voluntaria y expulsión?
   - **Decisión Propuesta**: Fuera de scope de US-O01 - Usar `USER_LEFT_GROUP` para ambos casos por ahora
