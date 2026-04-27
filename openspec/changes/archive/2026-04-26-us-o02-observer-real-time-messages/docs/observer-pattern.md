# Patrón Observer en el Sistema de Chat de Uniconnect

## Definición del Patrón Observer

El **Patrón Observer** es un patrón de diseño de comportamiento que define una dependencia uno-a-muchos entre objetos, de manera que cuando un objeto (Sujeto) cambia de estado, todos sus dependientes (Observadores) son notificados y actualizados automáticamente.

### Componentes del Patrón

```
┌─────────────────────────────────────────────────────────┐
│                   PATRÓN OBSERVER                       │
├─────────────────────────────────────────────────────────┤
│                                                         │
│   ┌──────────────┐                                      │
│   │   SUJETO     │                                      │
│   │ (Subject)    │                                      │
│   │              │                                      │
│   │ - estado     │                                      │
│   │ + attach()   │                                      │
│   │ + detach()   │                                      │
│   │ + notify()   │                                      │
│   └──────┬───────┘                                      │
│          │                                              │
│          │ notifica                                     │
│          ▼                                              │
│   ┌──────────────┐    ┌──────────────┐    ┌──────────┐ │
│   │ OBSERVADOR 1 │    │ OBSERVADOR 2 │    │ OBSERV 3 │ │
│   │ (Observer)   │    │ (Observer)   │    │(Observer)│ │
│   │              │    │              │    │          │ │
│   │ + update()   │    │ + update()   │    │+ update()│ │
│   └──────────────┘    └──────────────┘    └──────────┘ │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

**Roles**:
- **Sujeto (Subject)**: Mantiene una lista de observadores y los notifica cuando su estado cambia
- **Observador (Observer)**: Define una interfaz de actualización para recibir notificaciones del sujeto
- **Observador Concreto**: Implementa la interfaz de actualización para mantener su estado consistente con el sujeto

## Implementación en Uniconnect

### MessagesGateway como Sujeto

En el sistema de chat de Uniconnect, el **`MessagesGateway`** actúa como el **Sujeto** del patrón Observer. Este gateway gestiona el estado de los mensajes, presencia de usuarios y actividades de grupo, y notifica a todos los clientes WebSocket conectados (Observadores) cuando ocurren cambios.

```typescript
@WebSocketGateway({
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
})
export class MessagesGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  server: Server; // Socket.IO Server - mecanismo de notificación
  
  // El gateway mantiene referencia al servidor para notificar a observadores
}
```

### Clientes WebSocket como Observadores

Los **clientes WebSocket** (aplicaciones frontend React Native) actúan como **Observadores**. Cada cliente se suscribe a eventos específicos y recibe notificaciones automáticas cuando el estado del sujeto cambia.

```
┌─────────────────────────────────────────────────────────────┐
│          IMPLEMENTACIÓN EN UNICONNECT                       │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   ┌──────────────────────────────────┐                      │
│   │      MessagesGateway             │                      │
│   │      (SUJETO)                    │                      │
│   │                                  │                      │
│   │  - server: Server                │                      │
│   │  - sessionManager: Singleton     │                      │
│   │  + handleMessageRead()           │                      │
│   │  + handleUserPresence()          │                      │
│   │  + handleGroupActivity()         │                      │
│   │  + server.to(room).emit(event)   │ ◄─── Notificación   │
│   └──────────────┬───────────────────┘                      │
│                  │                                          │
│                  │ notifica vía WebSocket                   │
│                  ▼                                          │
│   ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│   │  Cliente 1   │  │  Cliente 2   │  │  Cliente 3   │     │
│   │ (OBSERVADOR) │  │ (OBSERVADOR) │  │ (OBSERVADOR) │     │
│   │              │  │              │  │              │     │
│   │ React Native │  │ React Native │  │ React Native │     │
│   │ WebSocket    │  │ WebSocket    │  │ WebSocket    │     │
│   │              │  │              │  │              │     │
│   │ socket.on()  │  │ socket.on()  │  │ socket.on()  │     │
│   └──────────────┘  └──────────────┘  └──────────────┘     │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## Mecanismo de Suscripción

### Backend: `@SubscribeMessage()` Decorator

El decorador `@SubscribeMessage()` de NestJS implementa el mecanismo de suscripción del patrón Observer. Cada handler decorado con `@SubscribeMessage()` define un evento al que los clientes pueden suscribirse.

```typescript
/**
 * Handler para notificar lectura de mensaje
 * Los clientes se suscriben al evento 'message:read'
 */
@SubscribeMessage('message:read')
async handleMessageRead(
  @ConnectedSocket() client: Socket,
  @MessageBody() data: MessageReadDto,
) {
  // Validar autenticación
  const id_group = client.data.id_group as number;
  
  if (!id_group) {
    return { error: 'Usuario no autenticado' };
  }
  
  // Notificar a todos los observadores en el room del grupo
  const roomName = `group-${id_group}`;
  this.server.to(roomName).emit('message:read', {
    id_message: data.id_message,
    id_user: data.id_user,
    read_at: data.read_at,
  });
  
  return { success: true };
}
```

**Eventos Observables Implementados**:
1. **`message:read`** - Notifica cuando un mensaje es leído
2. **`user:presence`** - Notifica cambios de presencia (online/offline/away)
3. **`group:activity`** - Notifica actividades del grupo (miembro se une, sale, grupo actualizado)

### Frontend: `socket.on()` Subscription

Los clientes se suscriben a eventos usando el método `socket.on()` de Socket.IO:

```typescript
// Cliente React Native - Observador
import io from 'socket.io-client';

const socket = io('https://api.uniconnect.com');

// Autenticarse y unirse al grupo
socket.emit('authenticate', {
  id_user: 1,
  id_group: 100,
});

// Suscribirse a eventos observables
socket.on('message:read', (data) => {
  console.log(`Mensaje ${data.id_message} leído por usuario ${data.id_user}`);
  // Actualizar UI para mostrar indicador de lectura
});

socket.on('user:presence', (data) => {
  console.log(`Usuario ${data.id_user} ahora está ${data.status}`);
  // Actualizar UI para mostrar estado de presencia
});

socket.on('group:activity', (data) => {
  console.log(`Actividad en grupo: ${data.activity_type} por ${data.actor_name}`);
  // Mostrar notificación de actividad
});
```

## Mecanismo de Notificación

### `server.to(room).emit(event, data)`

El método `server.to(room).emit()` de Socket.IO implementa el mecanismo de notificación del patrón Observer. Este método envía un evento a todos los clientes conectados en un "room" específico.

```typescript
// Notificar a todos los observadores en el room del grupo
const roomName = `group-${id_group}`;
this.server.to(roomName).emit('user:presence', {
  id_user: 1,
  status: 'online',
  last_seen: new Date(),
});
```

**Flujo de Notificación**:

```
┌─────────────────────────────────────────────────────────────┐
│              FLUJO DE NOTIFICACIÓN                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  1. Evento Trigger                                          │
│     ┌──────────────────┐                                    │
│     │ Cliente emite    │                                    │
│     │ 'user:presence'  │                                    │
│     └────────┬─────────┘                                    │
│              │                                              │
│              ▼                                              │
│  2. Gateway Procesa                                         │
│     ┌──────────────────┐                                    │
│     │ handleUserPresence()                                 │
│     │ - Valida auth    │                                    │
│     │ - Actualiza estado│                                   │
│     └────────┬─────────┘                                    │
│              │                                              │
│              ▼                                              │
│  3. Notificación Broadcast                                  │
│     ┌──────────────────┐                                    │
│     │ server.to(room)  │                                    │
│     │   .emit(event)   │                                    │
│     └────────┬─────────┘                                    │
│              │                                              │
│              ├──────────┬──────────┬──────────┐             │
│              ▼          ▼          ▼          ▼             │
│  4. Observadores Reciben                                    │
│     ┌────────┐  ┌────────┐  ┌────────┐  ┌────────┐         │
│     │Client 1│  │Client 2│  │Client 3│  │Client 4│         │
│     │socket  │  │socket  │  │socket  │  │socket  │         │
│     │.on()   │  │.on()   │  │.on()   │  │.on()   │         │
│     └────────┘  └────────┘  └────────┘  └────────┘         │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Rooms de Socket.IO

Los **rooms** de Socket.IO permiten agrupar observadores por contexto (en este caso, por grupo de chat). Solo los observadores en el mismo room reciben las notificaciones.

```typescript
// Cliente se une a un room al autenticarse
const roomName = `group-${data.id_group}`;
client.join(roomName);

// Notificación solo llega a clientes en ese room
this.server.to(roomName).emit('message:read', data);
```

## Ejemplos de Código

### Ejemplo 1: Notificación de Lectura de Mensaje

**Backend (Sujeto)**:
```typescript
@SubscribeMessage('message:read')
async handleMessageRead(
  @ConnectedSocket() client: Socket,
  @MessageBody() data: MessageReadDto,
) {
  const id_group = client.data.id_group as number;
  const roomName = `group-${id_group}`;
  
  // Notificar a todos los observadores
  this.server.to(roomName).emit('message:read', {
    id_message: data.id_message,
    id_user: data.id_user,
    read_at: data.read_at,
  });
  
  this.logger.log(`Message ${data.id_message} read by user ${data.id_user}`);
  return { success: true };
}
```

**Frontend (Observador)**:
```typescript
// Suscribirse al evento
socket.on('message:read', (data: MessageReadDto) => {
  // Actualizar UI para mostrar indicador de lectura
  updateMessageReadStatus(data.id_message, data.id_user, data.read_at);
  
  // Mostrar notificación
  showToast(`Mensaje leído por ${data.id_user}`);
});
```

### Ejemplo 2: Broadcast de Presencia de Usuario

**Backend (Sujeto)**:
```typescript
@SubscribeMessage('user:presence')
async handleUserPresence(
  @ConnectedSocket() client: Socket,
  @MessageBody() data: { status: 'online' | 'offline' | 'away' },
) {
  const id_user = client.data.id_user as number;
  const id_group = client.data.id_group as number;
  
  // Actualizar presencia en ChatSessionManager
  this.sessionManager.setUserPresence(id_user, data.status);
  
  // Notificar a todos los observadores
  const roomName = `group-${id_group}`;
  this.server.to(roomName).emit('user:presence', {
    id_user,
    status: data.status,
    last_seen: new Date(),
  });
  
  return { success: true };
}
```

**Frontend (Observador)**:
```typescript
// Suscribirse al evento
socket.on('user:presence', (data: UserPresenceDto) => {
  // Actualizar UI para mostrar estado de presencia
  updateUserPresenceIndicator(data.id_user, data.status);
  
  // Actualizar lista de usuarios online
  if (data.status === 'online') {
    addToOnlineUsers(data.id_user);
  } else {
    removeFromOnlineUsers(data.id_user);
  }
});
```

### Ejemplo 3: Notificación de Actividad de Grupo

**Backend (Sujeto)**:
```typescript
@SubscribeMessage('group:activity')
async handleGroupActivity(
  @ConnectedSocket() client: Socket,
  @MessageBody() data: GroupActivityDto,
) {
  const id_group = client.data.id_group as number;
  const roomName = `group-${id_group}`;
  
  // Notificar a todos los observadores
  this.server.to(roomName).emit('group:activity', {
    id_group: data.id_group,
    activity_type: data.activity_type,
    actor_id: data.actor_id,
    actor_name: data.actor_name,
    timestamp: data.timestamp,
  });
  
  this.logger.log(`Group activity: ${data.activity_type} by ${data.actor_name}`);
  return { success: true };
}
```

**Frontend (Observador)**:
```typescript
// Suscribirse al evento
socket.on('group:activity', (data: GroupActivityDto) => {
  // Mostrar notificación de actividad
  const message = getActivityMessage(data.activity_type, data.actor_name);
  showNotification(message);
  
  // Actualizar lista de miembros si es necesario
  if (data.activity_type === 'member_joined') {
    refreshMemberList();
  }
});
```

## Limitaciones

### 1. Estado en Memoria (No Persistente)

**Limitación**: Los estados de presencia se almacenan en memoria usando el singleton `ChatSessionManager`. Si el servidor se reinicia, se pierden todos los estados de presencia.

**Impacto**: Los clientes deben reconectarse y reestablecer su estado de presencia después de un reinicio del servidor.

**Mitigación**: 
- Los clientes se reconectan automáticamente y envían su estado de presencia al autenticarse
- Para persistencia futura, migrar a Redis o PostgreSQL

### 2. Escalabilidad Horizontal

**Limitación**: `ChatSessionManager` es un singleton en memoria que solo funciona en una única instancia del servidor. No funciona con múltiples instancias del backend (escalabilidad horizontal).

**Impacto**: Si se despliegan múltiples instancias del backend detrás de un load balancer, los clientes conectados a diferentes instancias no recibirán notificaciones entre sí.

**Mitigación**:
- Para escalabilidad horizontal, migrar a **Redis Pub/Sub** o **Socket.IO Redis Adapter**
- Documentar esta limitación para futuros desarrollos

### 3. Throttling de Presencia

**Limitación**: Los eventos de presencia están throttled a 1 emisión cada 5 segundos por usuario para evitar sobrecarga del servidor.

**Impacto**: Cambios rápidos de presencia (ej. usuario cambia de online → away → online en 3 segundos) solo emitirán el último estado después de 5 segundos.

**Mitigación**:
- El throttling es configurable (`PRESENCE_THROTTLE_MS = 5000`)
- Ajustar según necesidades de la aplicación

### 4. Desconexión Temporal

**Limitación**: Si un cliente pierde conexión temporalmente (ej. red móvil inestable), el servidor lo marca como offline inmediatamente.

**Impacto**: Falsos positivos de usuarios "offline" cuando en realidad solo tienen conexión inestable.

**Mitigación**:
- Implementar "grace period" de 30 segundos antes de marcar como offline
- Socket.IO maneja reconexiones automáticas

## Ventajas del Patrón Observer en Uniconnect

1. **Desacoplamiento**: El `MessagesGateway` no necesita conocer los detalles de los clientes. Solo emite eventos.
2. **Escalabilidad de Observadores**: Se pueden agregar nuevos clientes sin modificar el gateway.
3. **Notificaciones en Tiempo Real**: Los clientes reciben actualizaciones instantáneas sin polling.
4. **Eficiencia**: Solo los clientes en el room del grupo reciben notificaciones relevantes.
5. **Extensibilidad**: Fácil agregar nuevos eventos observables sin romper funcionalidad existente.

## Referencias

- **Patrón Observer**: Gang of Four - Design Patterns (1994)
- **Socket.IO Documentation**: https://socket.io/docs/v4/
- **NestJS WebSockets**: https://docs.nestjs.com/websockets/gateways
- **AGENTS.md**: Sección "REGLAS PARA HISTORIAS DE USUARIO (OBSERVER Y DECORATOR)"
