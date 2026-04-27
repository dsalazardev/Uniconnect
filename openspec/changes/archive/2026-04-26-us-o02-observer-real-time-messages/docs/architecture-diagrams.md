# Diagramas Arquitectónicos - Patrón Observer en Uniconnect

## 1. Diagrama de Relación Sujeto-Observador

```
┌─────────────────────────────────────────────────────────────────────────┐
│                  ARQUITECTURA OBSERVER PATTERN                          │
│                                                                         │
│                                                                         │
│                    ┌────────────────────────────┐                       │
│                    │    MessagesGateway         │                       │
│                    │    (SUJETO)                │                       │
│                    │                            │                       │
│                    │  Properties:               │                       │
│                    │  - server: Server          │                       │
│                    │  - sessionManager          │                       │
│                    │  - presenceThrottle        │                       │
│                    │                            │                       │
│                    │  Methods:                  │                       │
│                    │  + handleMessageRead()     │                       │
│                    │  + handleUserPresence()    │                       │
│                    │  + handleGroupActivity()   │                       │
│                    │  + handleAuthenticate()    │                       │
│                    │  + handleDisconnect()      │                       │
│                    └────────────┬───────────────┘                       │
│                                 │                                       │
│                                 │ notifica vía                          │
│                                 │ server.to(room).emit()                │
│                                 │                                       │
│                    ┌────────────┴───────────────┐                       │
│                    │                            │                       │
│         ┌──────────▼──────────┐    ┌───────────▼──────────┐            │
│         │   Socket.IO Room    │    │   Socket.IO Room     │            │
│         │   "group-100"       │    │   "group-200"        │            │
│         └──────────┬──────────┘    └───────────┬──────────┘            │
│                    │                            │                       │
│       ┌────────────┼────────────┐  ┌───────────┼──────────┐            │
│       │            │            │  │           │          │            │
│   ┌───▼───┐   ┌───▼───┐   ┌───▼──▼──┐   ┌────▼───┐  ┌───▼───┐        │
│   │Client1│   │Client2│   │ Client3 │   │Client4 │  │Client5│        │
│   │(OBS)  │   │(OBS)  │   │  (OBS)  │   │ (OBS)  │  │(OBS)  │        │
│   │       │   │       │   │         │   │        │  │       │        │
│   │User 1 │   │User 2 │   │ User 3  │   │User 4  │  │User 5 │        │
│   │Group  │   │Group  │   │ Group   │   │Group   │  │Group  │        │
│   │ 100   │   │ 100   │   │100 & 200│   │  200   │  │  200  │        │
│   └───────┘   └───────┘   └─────────┘   └────────┘  └───────┘        │
│                                                                         │
│   OBSERVADORES (Clientes WebSocket)                                    │
│   - Suscritos a eventos del sujeto                                     │
│   - Reciben notificaciones automáticas                                 │
│   - Agrupados por rooms (contexto de grupo)                            │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

**Notas**:
- Cada cliente puede estar en múltiples rooms (grupos)
- Las notificaciones solo llegan a clientes en el room específico
- El sujeto (MessagesGateway) no conoce los detalles de los observadores

## 2. Diagrama de Secuencia - Evento `message:read`

```
┌─────────────────────────────────────────────────────────────────────────┐
│              SECUENCIA: message:read                                    │
└─────────────────────────────────────────────────────────────────────────┘

Cliente 1          MessagesGateway         ChatSessionManager      Cliente 2
(Observador)          (Sujeto)                (Singleton)         (Observador)
    │                     │                         │                  │
    │  emit('message:read')                         │                  │
    │  { id_message: 1,   │                         │                  │
    │    id_user: 1,      │                         │                  │
    │    read_at: Date }  │                         │                  │
    ├────────────────────►│                         │                  │
    │                     │                         │                  │
    │                     │ Validar autenticación   │                  │
    │                     │ (client.data.id_group)  │                  │
    │                     │                         │                  │
    │                     │ Logging                 │                  │
    │                     │ "Message 1 read by      │                  │
    │                     │  user 1 in group 100"   │                  │
    │                     │                         │                  │
    │                     │ server.to('group-100')  │                  │
    │                     │   .emit('message:read', │                  │
    │                     │         data)           │                  │
    │                     ├─────────────────────────┼─────────────────►│
    │                     │                         │                  │
    │  { success: true }  │                         │                  │
    │◄────────────────────┤                         │                  │
    │                     │                         │                  │
    │  on('message:read') │                         │  on('message:read')
    │  Actualizar UI      │                         │  Actualizar UI   │
    │  (indicador lectura)│                         │  (indicador lectura)
    │                     │                         │                  │
    ▼                     ▼                         ▼                  ▼
```

**Flujo**:
1. Cliente 1 emite evento `message:read` con datos del mensaje leído
2. Gateway valida autenticación del cliente
3. Gateway registra el evento en logs
4. Gateway notifica a todos los clientes en el room `group-100` (incluyendo Cliente 1 y Cliente 2)
5. Ambos clientes reciben el evento y actualizan su UI

## 3. Diagrama de Secuencia - Evento `user:presence`

```
┌─────────────────────────────────────────────────────────────────────────┐
│              SECUENCIA: user:presence                                   │
└─────────────────────────────────────────────────────────────────────────┘

Cliente 1          MessagesGateway         ChatSessionManager      Cliente 2
(Observador)          (Sujeto)                (Singleton)         (Observador)
    │                     │                         │                  │
    │  emit('user:presence')                        │                  │
    │  { status: 'away' } │                         │                  │
    ├────────────────────►│                         │                  │
    │                     │                         │                  │
    │                     │ Validar autenticación   │                  │
    │                     │                         │                  │
    │                     │ Verificar throttling    │                  │
    │                     │ (5 segundos)            │                  │
    │                     │                         │                  │
    │                     │ setUserPresence(1, 'away')                 │
    │                     ├────────────────────────►│                  │
    │                     │                         │                  │
    │                     │ Actualizar timestamp    │                  │
    │                     │ presenceThrottle[1]     │                  │
    │                     │                         │                  │
    │                     │ server.to('group-100')  │                  │
    │                     │   .emit('user:presence',│                  │
    │                     │         { id_user: 1,   │                  │
    │                     │           status: 'away',                  │
    │                     │           last_seen })  │                  │
    │                     ├─────────────────────────┼─────────────────►│
    │                     │                         │                  │
    │  { success: true }  │                         │                  │
    │◄────────────────────┤                         │                  │
    │                     │                         │                  │
    │  on('user:presence')│                         │  on('user:presence')
    │  Actualizar UI      │                         │  Actualizar UI   │
    │  (estado: away)     │                         │  (User 1: away)  │
    │                     │                         │                  │
    ▼                     ▼                         ▼                  ▼
```

**Flujo**:
1. Cliente 1 emite evento `user:presence` con nuevo estado
2. Gateway valida autenticación
3. Gateway verifica throttling (máximo 1 emisión cada 5 segundos)
4. Gateway actualiza presencia en `ChatSessionManager`
5. Gateway actualiza timestamp de throttling
6. Gateway notifica a todos los clientes en el room
7. Clientes actualizan UI con nuevo estado de presencia

## 4. Diagrama de Secuencia - Evento `group:activity`

```
┌─────────────────────────────────────────────────────────────────────────┐
│              SECUENCIA: group:activity                                  │
└─────────────────────────────────────────────────────────────────────────┘

Cliente 1          MessagesGateway         ChatSessionManager      Cliente 2
(Observador)          (Sujeto)                (Singleton)         (Observador)
    │                     │                         │                  │
    │  emit('group:activity')                       │                  │
    │  { id_group: 100,   │                         │                  │
    │    activity_type:   │                         │                  │
    │    'member_joined', │                         │                  │
    │    actor_id: 3,     │                         │                  │
    │    actor_name: 'John',                        │                  │
    │    timestamp: Date }│                         │                  │
    ├────────────────────►│                         │                  │
    │                     │                         │                  │
    │                     │ Validar autenticación   │                  │
    │                     │                         │                  │
    │                     │ Validar activity_type   │                  │
    │                     │ (member_joined/left/    │                  │
    │                     │  group_updated)         │                  │
    │                     │                         │                  │
    │                     │ Logging                 │                  │
    │                     │ "Group activity         │                  │
    │                     │  member_joined by       │                  │
    │                     │  user 3 in group 100"   │                  │
    │                     │                         │                  │
    │                     │ server.to('group-100')  │                  │
    │                     │   .emit('group:activity',                  │
    │                     │         data)           │                  │
    │                     ├─────────────────────────┼─────────────────►│
    │                     │                         │                  │
    │  { success: true }  │                         │                  │
    │◄────────────────────┤                         │                  │
    │                     │                         │                  │
    │  on('group:activity')                         │  on('group:activity')
    │  Mostrar notificación                         │  Mostrar notificación
    │  "John se unió"     │                         │  "John se unió"  │
    │  Actualizar lista   │                         │  Actualizar lista│
    │  de miembros        │                         │  de miembros     │
    │                     │                         │                  │
    ▼                     ▼                         ▼                  ▼
```

**Flujo**:
1. Cliente 1 emite evento `group:activity` con detalles de la actividad
2. Gateway valida autenticación
3. Gateway valida que `activity_type` sea válido
4. Gateway registra el evento en logs
5. Gateway notifica a todos los clientes en el room
6. Clientes muestran notificación y actualizan UI

## 5. Diagrama de Secuencia - Autenticación y Presencia Inicial

```
┌─────────────────────────────────────────────────────────────────────────┐
│              SECUENCIA: authenticate (con presencia)                    │
└─────────────────────────────────────────────────────────────────────────┘

Cliente 1          MessagesGateway         ChatSessionManager      Cliente 2
(Observador)          (Sujeto)                (Singleton)         (Observador)
    │                     │                         │                  │
    │  emit('authenticate')                         │                  │
    │  { id_user: 1,      │                         │                  │
    │    id_group: 100 }  │                         │                  │
    ├────────────────────►│                         │                  │
    │                     │                         │                  │
    │                     │ Buscar membership       │                  │
    │                     │ en Prisma               │                  │
    │                     │                         │                  │
    │                     │ Guardar en client.data  │                  │
    │                     │                         │                  │
    │                     │ addUserSession()        │                  │
    │                     ├────────────────────────►│                  │
    │                     │                         │                  │
    │                     │ client.join('group-100')│                  │
    │                     │                         │                  │
    │                     │ joinGroupRoom(100, socketId)               │
    │                     ├────────────────────────►│                  │
    │                     │                         │                  │
    │                     │ setUserPresence(1, 'online')               │
    │                     ├────────────────────────►│                  │
    │                     │                         │                  │
    │                     │ server.to('group-100')  │                  │
    │                     │   .emit('user:connected')                  │
    │                     ├─────────────────────────┼─────────────────►│
    │                     │                         │                  │
    │                     │ server.to('group-100')  │                  │
    │                     │   .emit('user:presence',│                  │
    │                     │         { id_user: 1,   │                  │
    │                     │           status: 'online',                │
    │                     │           last_seen })  │                  │
    │                     ├─────────────────────────┼─────────────────►│
    │                     │                         │                  │
    │  { success: true,   │                         │                  │
    │    id_membership }  │                         │                  │
    │◄────────────────────┤                         │                  │
    │                     │                         │                  │
    │                     │                         │  on('user:presence')
    │                     │                         │  Actualizar UI   │
    │                     │                         │  (User 1: online)│
    │                     │                         │                  │
    ▼                     ▼                         ▼                  ▼
```

**Flujo**:
1. Cliente 1 se conecta y emite `authenticate`
2. Gateway busca membership en base de datos
3. Gateway agrega sesión a `ChatSessionManager`
4. Cliente se une al room del grupo
5. Gateway establece presencia inicial a 'online'
6. Gateway notifica a otros clientes en el room
7. Cliente 2 actualiza UI mostrando que User 1 está online

## 6. Arquitectura de Rooms de Socket.IO

```
┌─────────────────────────────────────────────────────────────────────────┐
│                  ARQUITECTURA DE ROOMS                                  │
└─────────────────────────────────────────────────────────────────────────┘

                        Socket.IO Server
                        (MessagesGateway)
                               │
                               │
                ┌──────────────┴──────────────┐
                │                             │
                ▼                             ▼
        ┌───────────────┐             ┌───────────────┐
        │  Room: group-100           │  Room: group-200
        │                             │
        │  Sockets:                   │  Sockets:
        │  - socket-1 (User 1)        │  - socket-3 (User 3)
        │  - socket-2 (User 2)        │  - socket-4 (User 4)
        │  - socket-5 (User 3)        │  - socket-5 (User 3)
        │                             │  - socket-6 (User 5)
        └───────────────┘             └───────────────┘
                │                             │
                │                             │
        Eventos emitidos:             Eventos emitidos:
        - message:read                - message:read
        - user:presence               - user:presence
        - group:activity              - group:activity
        - user:connected              - user:connected
        - message:new                 - message:new
        - message:edited              - message:edited
        - message:deleted             - message:deleted
```

**Características**:
- Cada grupo tiene su propio room (`group-{id_group}`)
- Un socket puede estar en múltiples rooms (User 3 está en group-100 y group-200)
- Las notificaciones solo llegan a sockets en el room específico
- Rooms se crean dinámicamente cuando el primer cliente se une
- Rooms se eliminan automáticamente cuando el último cliente sale

## 7. Diagrama de Desconexión con Presencia Offline

```
┌─────────────────────────────────────────────────────────────────────────┐
│              SECUENCIA: handleDisconnect                                │
└─────────────────────────────────────────────────────────────────────────┘

Cliente 1          MessagesGateway         ChatSessionManager      Cliente 2
(Observador)          (Sujeto)                (Singleton)         (Observador)
    │                     │                         │                  │
    │  disconnect()       │                         │                  │
    ├────────────────────►│                         │                  │
    │                     │                         │                  │
    │                     │ Logging                 │                  │
    │                     │ "Client disconnected"   │                  │
    │                     │                         │                  │
    │                     │ server.to('group-100')  │                  │
    │                     │   .emit('user:presence',│                  │
    │                     │         { id_user: 1,   │                  │
    │                     │           status: 'offline',               │
    │                     │           last_seen })  │                  │
    │                     ├─────────────────────────┼─────────────────►│
    │                     │                         │                  │
    │                     │ removeUserSession(socketId)                │
    │                     ├────────────────────────►│                  │
    │                     │                         │                  │
    │                     │                         │ setUserPresence(1, 'offline')
    │                     │                         │                  │
    │                     │                         │ Remover de       │
    │                     │                         │ userSessions     │
    │                     │                         │                  │
    │                     │                         │ Remover de       │
    │                     │                         │ groupRooms       │
    │                     │                         │                  │
    │                     │                         │                  │
    │                     │                         │  on('user:presence')
    │                     │                         │  Actualizar UI   │
    │                     │                         │  (User 1: offline)
    │                     │                         │                  │
    ▼                     ▼                         ▼                  ▼
```

**Flujo**:
1. Cliente 1 se desconecta (cierra app, pierde conexión, etc.)
2. Gateway detecta desconexión
3. Gateway emite evento `user:presence` con status 'offline' ANTES de remover sesión
4. Gateway llama a `removeUserSession()` en `ChatSessionManager`
5. `ChatSessionManager` establece presencia a 'offline' y limpia sesiones
6. Cliente 2 recibe notificación y actualiza UI mostrando User 1 offline

## Resumen de Flujos

| Evento             | Trigger                  | Notificación                | Observadores Afectados |
|--------------------|--------------------------|----------------------------|------------------------|
| `message:read`     | Usuario lee mensaje      | Todos en el grupo          | Clientes en room       |
| `user:presence`    | Usuario cambia estado    | Todos en el grupo          | Clientes en room       |
| `group:activity`   | Actividad en grupo       | Todos en el grupo          | Clientes en room       |
| `authenticate`     | Usuario se conecta       | Todos en el grupo          | Clientes en room       |
| `disconnect`       | Usuario se desconecta    | Todos en el grupo          | Clientes en room       |

**Nota**: Todos los eventos respetan el principio del patrón Observer: el sujeto (MessagesGateway) notifica a todos los observadores (clientes) sin conocer sus detalles de implementación.
