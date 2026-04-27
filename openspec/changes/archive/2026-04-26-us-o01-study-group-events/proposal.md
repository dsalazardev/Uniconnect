# Proposal: US-O01 - Observer para Eventos del Grupo de Estudio

## Why

El sistema actualmente tiene infraestructura completa del patrón Observer con EventEmitter2, pero solo 7 de 11 eventos de grupos están siendo emitidos. Los eventos críticos del ciclo de vida de grupos (`GROUP_CREATED`, `GROUP_UPDATED`, `GROUP_DELETED`, `USER_LEFT_GROUP`) están definidos en `MESSAGE_EVENTS` pero nunca se disparan, lo que impide notificaciones automáticas y trazabilidad de actividades importantes. Esta historia de usuario completa la implementación del patrón Observer para eventos de grupo, cumpliendo con los requisitos académicos del proyecto y mejorando la experiencia de usuario con notificaciones en tiempo real.

## What Changes

- **Emisión de Eventos Faltantes**: Agregar emisiones de 4 eventos en `GroupsService`:
  - `GROUP_CREATED` en método `create()`
  - `GROUP_UPDATED` en método `update()`
  - `GROUP_DELETED` en método `remove()`
  - `USER_LEFT_GROUP` en método `leaveGroup()`
- **Extensión de Payloads Tipados**: Agregar 4 interfaces TypeScript en `message.events.ts`:
  - `GroupCreatedPayload`
  - `GroupUpdatedPayload`
  - `GroupDeletedPayload`
  - `UserLeftGroupPayload`
- **Nuevo Listener**: Crear `GroupActivityListener` en `src/groups/listeners/` con 4 handlers `@OnEvent()`
- **Notificaciones Automáticas**: Implementar lógica de notificación para cada evento (notificar a miembros, owner, etc.)
- **Tests Unitarios**: Implementar tests con `jest.spyOn(eventEmitter, 'emit')` para validar emisiones y reacciones
- **Documentación**: Documentar el patrón Observer para eventos de grupo con diagramas de flujo

## Capabilities

### New Capabilities
- `study-group-lifecycle-events`: Emisión y manejo de eventos del ciclo de vida de grupos de estudio (creación, actualización, eliminación, salida de miembros)

### Modified Capabilities
<!-- No hay cambios en requisitos existentes, solo completar implementación de eventos ya definidos -->

## Impact

**Código Afectado**:
- `Uniconnect-Backend-Core/src/groups/groups.service.ts` - Agregar 4 emisiones de eventos
- `Uniconnect-Backend-Core/src/messages/events/message.events.ts` - Agregar 4 interfaces de payload
- `Uniconnect-Backend-Core/src/groups/listeners/group-activity.listener.ts` - **NUEVO** - 4 handlers
- `Uniconnect-Backend-Core/src/groups/groups.module.ts` - Registrar nuevo listener

**Tests Nuevos**:
- `Uniconnect-Backend-Core/src/groups/__tests__/groups.service.observer.spec.ts` - Tests de emisiones
- `Uniconnect-Backend-Core/src/groups/listeners/__tests__/group-activity.listener.spec.ts` - Tests de handlers

**Sin Cambios de Schema**: No se requieren cambios en Prisma schema ni migraciones de base de datos

**Sin Breaking Changes**: Todos los cambios son aditivos. Los métodos existentes de `GroupsService` mantienen su firma y comportamiento, solo agregan emisiones de eventos al final.

**Compatibilidad**: Los eventos ya están definidos en `MESSAGE_EVENTS`, solo se completa su implementación. No afecta código existente que no escuche estos eventos.
