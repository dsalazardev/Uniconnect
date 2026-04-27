# Design: US-O02 - Observer para Mensajes del Chat en Tiempo Real

## Context

**Estado Actual**:
- El `MessagesGateway` (`src/messages/messages.gateway.ts`) ya implementa el patrón Observer usando `@nestjs/websockets` y Socket.IO 4.8.x
- Handlers existentes: `authenticate`, `message:send`, `message:edit`, `message:delete`, `user:typing`, `loadMessages`, `messages:history`, `room:leave`, `messages:search`, `session:stats`
- El `ChatSessionManager` (singleton) gestiona sesiones de usuarios conectados y rooms de grupos
- El decorador `@ContentModeration` ya intercepta mensajes para moderación de contenido

**Restricciones Arquitectónicas** (de AGENTS.md):
- **OBLIGATORIO**: Usar `@nestjs/websockets` (ya instalado y configurado)
- **OBLIGATORIO**: Integrar en `MessagesGateway` existente
- **PROHIBIDO**: Crear nuevas librerías de sockets o gateways adicionales
- **OBLIGATORIO**: Usar `@SubscribeMessage()` para nuevos handlers
- **OBLIGATORIO**: Integrar con `ChatSessionManager` singleton existente
- **OBLIGATORIO**: Tipado estricto - cero `any`
- **OBLIGATORIO**: Logging con `Logger` de NestJS
- **OBLIGATORIO**: Programación defensiva con try/catch

**Stakeholders**:
- Equipo de desarrollo backend (implementación)
- Equipo de desarrollo frontend (consumo de eventos WebSocket)
- Evaluadores académicos (validación del patrón Observer)

## Goals / Non-Goals

**Goals**:
- Extender `MessagesGateway` con 3 nuevos handlers de observación: `message:read`, `user:presence`, `group:activity`
- Documentar formalmente cómo el sistema implementa el patrón Observer
- Implementar tests unitarios que validen el comportamiento del patrón Observer
- Extender `ChatSessionManager` para rastrear estados de presencia de usuarios
- Crear diagramas arquitectónicos que visualicen el flujo Observer

**Non-Goals**:
- NO crear un nuevo gateway o sistema de WebSockets paralelo
- NO modificar handlers existentes (solo agregar nuevos)
- NO cambiar el esquema de base de datos (sin migraciones Prisma)
- NO implementar persistencia de estados de presencia en BD (solo en memoria)
- NO agregar autenticación adicional (usar la existente con `authenticate`)

## Decisions

### Decision 1: Extender MessagesGateway vs Crear Nuevo Gateway

**Decisión**: Extender el `MessagesGateway` existente con nuevos handlers `@SubscribeMessage()`

**Rationale**:
- AGENTS.md prohíbe explícitamente crear nuevos gateways
- Los nuevos eventos (`message:read`, `user:presence`, `group:activity`) están semánticamente relacionados con mensajería
- Reutiliza la infraestructura de autenticación existente (`authenticate` handler)
- Mantiene la cohesión del módulo `MessagesModule`

**Alternativas Consideradas**:
- ❌ Crear `ObserverGateway` separado: Viola reglas de AGENTS.md, duplica lógica de autenticación
- ❌ Crear `PresenceGateway` separado: Fragmenta la lógica de chat en múltiples gateways

### Decision 2: Almacenamiento de Estado de Presencia

**Decisión**: Almacenar estados de presencia en memoria usando `ChatSessionManager` (singleton)

**Rationale**:
- Los estados de presencia son efímeros y no requieren persistencia
- `ChatSessionManager` ya gestiona sesiones de usuarios conectados
- Evita overhead de escrituras frecuentes a PostgreSQL
- Simplifica la implementación sin cambios de schema

**Alternativas Consideradas**:
- ❌ Persistir en tabla `user_presence` en PostgreSQL: Overhead innecesario, requiere migraciones
- ❌ Usar Redis para estado compartido: Complejidad adicional, no requerido para MVP

### Decision 3: Estructura de DTOs para Nuevos Eventos

**Decisión**: Crear DTOs tipados estrictos en `src/messages/dto/websocket-message.dto.ts`

**Rationale**:
- Cumple con regla de tipado estricto (cero `any`)
- Reutiliza archivo existente de DTOs WebSocket
- Facilita validación con `class-validator` si se requiere en el futuro

**Estructura de DTOs**:
```typescript
// message:read
export class MessageReadDto {
  id_message: number;
  id_user: number;
  read_at: Date;
}

// user:presence
export class UserPresenceDto {
  id_user: number;
  status: 'online' | 'offline' | 'away';
  last_seen?: Date;
}

// group:activity
export class GroupActivityDto {
  id_group: number;
  activity_type: 'member_joined' | 'member_left' | 'group_updated';
  actor_id: number;
  actor_name: string;
  timestamp: Date;
}
```

### Decision 4: Estrategia de Testing del Patrón Observer

**Decisión**: Tests unitarios con `jest.spyOn()` para rastrear emisiones de eventos

**Rationale**:
- AGENTS.md especifica usar `jest.spyOn(server, 'to')` y `jest.spyOn(server, 'emit')`
- Valida que el gateway (Sujeto) notifique correctamente a los observadores (clientes)
- No requiere levantar servidor WebSocket real (tests más rápidos)

**Estructura de Tests**:
```typescript
describe('MessagesGateway - Observer Pattern', () => {
  let gateway: MessagesGateway;
  let server: Server;

  beforeEach(() => {
    server = { to: jest.fn().mockReturnThis(), emit: jest.fn() } as any;
    gateway.server = server;
  });

  it('should notify observers when message is read', () => {
    // Arrange
    const readDto = { id_message: 1, id_user: 2, read_at: new Date() };
    
    // Act
    gateway.handleMessageRead(client, readDto);
    
    // Assert
    expect(server.to).toHaveBeenCalledWith('group-123');
    expect(server.emit).toHaveBeenCalledWith('message:read', expect.objectContaining(readDto));
  });
});
```

### Decision 5: Integración con ChatSessionManager

**Decisión**: Extender `ChatSessionManager` con métodos de rastreo de presencia

**Rationale**:
- Ya es un singleton que gestiona sesiones de usuarios
- Evita crear otro singleton para presencia
- Mantiene la cohesión de gestión de estado de sesiones

**Nuevos Métodos**:
```typescript
class ChatSessionManager {
  // Existentes: addUserSession, removeUserSession, getGroupSockets, isUserOnline, getStats
  
  // Nuevos:
  setUserPresence(userId: number, status: 'online' | 'offline' | 'away'): void
  getUserPresence(userId: number): 'online' | 'offline' | 'away' | null
  getGroupPresences(groupId: number): Map<number, 'online' | 'offline' | 'away'>
}
```

## Risks / Trade-offs

### Risk 1: Estado de Presencia No Persistente
**Riesgo**: Si el servidor se reinicia, se pierden todos los estados de presencia.

**Mitigación**: 
- Aceptable para MVP - los clientes se reconectan y envían su estado nuevamente
- Si se requiere persistencia en el futuro, migrar a Redis o PostgreSQL

### Risk 2: Escalabilidad con Múltiples Instancias
**Riesgo**: `ChatSessionManager` es singleton en memoria - no funciona con múltiples instancias del backend.

**Mitigación**:
- Documentar limitación en `observer-pattern.md`
- Para escalabilidad horizontal futura, migrar a Redis Pub/Sub o Socket.IO Redis Adapter

### Risk 3: Overhead de Eventos de Presencia
**Riesgo**: Broadcast frecuente de `user:presence` puede generar tráfico excesivo.

**Mitigación**:
- Implementar throttling: solo emitir cambios de presencia cada 5 segundos
- Usar debounce en el cliente para evitar actualizaciones excesivas

### Risk 4: Compatibilidad con Clientes Existentes
**Riesgo**: Clientes antiguos podrían no manejar los nuevos eventos.

**Mitigación**:
- Todos los cambios son aditivos - clientes existentes ignoran eventos desconocidos
- No hay breaking changes en handlers existentes

## Migration Plan

**Fase 1: Implementación Backend** (Sin Downtime)
1. Agregar nuevos handlers a `MessagesGateway` (no afecta handlers existentes)
2. Extender `ChatSessionManager` con métodos de presencia
3. Crear DTOs en `websocket-message.dto.ts`
4. Implementar tests unitarios

**Fase 2: Documentación**
1. Crear `docs/observer-pattern.md` con explicación del patrón
2. Crear `docs/architecture-diagrams.md` con diagramas de flujo
3. Actualizar AGENTS.md con referencias a la nueva funcionalidad

**Fase 3: Integración Frontend** (Opcional - fuera de scope de US-O02)
1. Frontend puede empezar a escuchar nuevos eventos cuando esté listo
2. No requiere cambios en backend

**Rollback Strategy**:
- Si hay problemas, simplemente no usar los nuevos handlers
- Los handlers existentes no se modifican, por lo que no hay riesgo de regresión
- No hay cambios de schema, por lo que no hay migraciones que revertir

## Open Questions

1. **¿Throttling de eventos de presencia?**: ¿Implementar throttling de 5 segundos o dejar que el cliente controle la frecuencia?
   - **Decisión Propuesta**: Implementar throttling básico en el backend (5 segundos) para proteger el servidor

2. **¿Persistir historial de lecturas de mensajes?**: ¿Agregar campo `read_at` a la tabla `message` o mantener solo en memoria?
   - **Decisión Propuesta**: Solo en memoria para MVP - agregar persistencia en historia de usuario futura si se requiere

3. **¿Notificar presencia a todos los grupos o solo al grupo actual?**: ¿Broadcast de presencia global o por grupo?
   - **Decisión Propuesta**: Por grupo - solo notificar a usuarios en el mismo grupo para reducir tráfico
