# Requirements: US-O02 - Observer Pattern para Chat en Tiempo Real

## Historia de Usuario

**ID**: US-O02  
**Título**: Observer para mensajes del chat en tiempo real  
**Puntos**: 5  

**Descripción**: Como equipo, necesitamos que el servicio de chat implemente Observer para que el envío de un mensaje notifique automáticamente a todos los participantes del grupo conectados, tanto en web como en mobile.

## Estado Actual del Sistema

### ✅ Infraestructura Existente
- WebSocket Gateway funcional (`messages.gateway.ts`)
- Socket.IO 4.8.x instalado y configurado
- ChatSessionManager singleton para gestión de sesiones
- Decorador `@ContentModeration` para filtrado de contenido
- MessagesService con EventEmitter2 (NO patrón Observer formal)
- Soporte para chat grupal con rooms `group-${id_group}`

### ❌ Brechas Identificadas
- NO existe patrón Observer formal (interfaces `ISubject`/`IObserver`)
- NO hay separación de canales privados vs grupales
- NO hay arquitectura en capas (Domain/Application/Infrastructure)
- NO hay `ChatSubject` como sujeto concreto
- NO hay observadores concretos (`PrivateChatObserver`, `GroupChatObserver`)
- Evento actual es `message:new`, NO `NUEVO_MENSAJE`

## Criterios de Aceptación

### AC1: ChatSubject Implementado
**DADO** que existe `ChatSubject` que implementa `ISubject<MessageDto>`  
**Y** emite el evento `NUEVO_MENSAJE` con el DTO del mensaje decorado  
**CUANDO** se valida el requerimiento en el flujo correspondiente  
**ENTONCES** el sistema cumple la condición descrita

**Validación Técnica**:
- ✅ Interfaz `ISubject<T>` definida con métodos `attach()`, `detach()`, `notify()`
- ✅ Clase `ChatSubject` implementa `ISubject<MessageDto>`
- ✅ Lista privada de observadores gestionada correctamente
- ✅ Método `notify()` itera observadores y llama `update(messageDto)`
- ✅ Mensaje recibido por observadores ya está decorado

### AC2: Notificación en Tiempo Real Multi-Cliente
**DADO** que un cliente web y uno mobile están conectados al mismo grupo  
**CUANDO** uno envía un mensaje  
**ENTONCES** ambos lo reciben en tiempo real mediante WebSocket (Socket.io)

**Validación Técnica**:
- ✅ Gateway usa Socket.IO para emisión a rooms
- ✅ Clientes web y mobile pueden conectarse al mismo room
- ✅ Método `server.to(roomId).emit()` envía a todos los clientes del room
- ✅ Latencia < 100ms para notificación

### AC3: Decoradores Aplicados Antes de Notificación
**DADO** que el mensaje emitido ya lleva aplicados los decoradores correspondientes (archivo, mención)  
**CUANDO** se valida el requerimiento en el flujo correspondiente  
**ENTONCES** el sistema cumple la condición descrita

**Validación Técnica**:
- ✅ Decoradores se aplican en `MessagesService.sendMessage()` ANTES de `notify()`
- ✅ `@ContentModeration` valida contenido antes de procesamiento
- ✅ Decoradores de archivos y menciones (placeholder) se aplican
- ✅ Observadores reciben `MessageDto` completamente decorado
- ✅ Mensaje decorado se persiste en BD

### AC4: Separación de Canales Privado vs Grupal
**DADO** que el observer de chat privado es independiente del observer de chat grupal  
**Y** no comparten canal WebSocket  
**CUANDO** se valida el requerimiento en el flujo correspondiente  
**ENTONCES** el sistema cumple la condición descrita

**Validación Técnica**:
- ✅ `PrivateChatObserver` solo emite a rooms `private-${userId1}-${userId2}`
- ✅ `GroupChatObserver` solo emite a rooms `group-${groupId}`
- ✅ Lógica de determinación de `chat_type` en `MessagesService`
- ✅ Solo un observador se ata por mensaje (attach/detach)
- ✅ Tests validan que canales NO se cruzan

## Requisitos Funcionales

### FR1: Interfaces del Patrón Observer (Dominio)
**Prioridad**: CRÍTICA

- **FR1.1**: Crear interfaz `ISubject<T>` en `src/messages/domain/observer/interfaces/subject.interface.ts`
  - Método `attach(observer: IObserver<T>): void`
  - Método `detach(observer: IObserver<T>): void`
  - Método `notify(data: T): void`

- **FR1.2**: Crear interfaz `IObserver<T>` en `src/messages/domain/observer/interfaces/observer.interface.ts`
  - Método `update(data: T): void`

- **FR1.3**: Usar tipado genérico para flexibilidad y reutilización

### FR2: ChatSubject (Sujeto Concreto)
**Prioridad**: CRÍTICA

- **FR2.1**: Implementar `ChatSubject` en `src/messages/domain/observer/chat-subject.ts`
- **FR2.2**: Decorador `@Injectable()` para inyección de dependencias
- **FR2.3**: Lista privada `observers: IObserver<MessageDto>[]`
- **FR2.4**: Método `attach()` agrega observador a la lista
- **FR2.5**: Método `detach()` remueve observador de la lista
- **FR2.6**: Método `notify()` itera observadores y llama `update(messageDto)`
- **FR2.7**: Limpiar lista de observadores después de notificación (patrón one-time)
- **FR2.8**: Logging con `Logger` de NestJS en cada operación
- **FR2.9**: Try/catch en `notify()` para manejar errores de observadores

### FR3: Observadores Concretos (Infraestructura)
**Prioridad**: CRÍTICA

#### FR3.1: PrivateChatObserver
- Ubicación: `src/messages/infrastructure/observers/private-chat.observer.ts`
- Implementa `IObserver<MessageDto>`
- Decorador `@Injectable()`
- Inyecta `ChatGateway` en constructor
- Método `update(message: MessageDto)`:
  - Valida `message.chat_type === 'private'`
  - Extrae `room_id` (formato: `private-${userId1}-${userId2}`)
  - Llama `chatGateway.emitToRoom(roomId, 'NUEVO_MENSAJE', enrichedMessage)`
  - Enriquece mensaje con `timestamp` y `channel: 'private'`
  - Logging de emisión exitosa

#### FR3.2: GroupChatObserver
- Ubicación: `src/messages/infrastructure/observers/group-chat.observer.ts`
- Implementa `IObserver<MessageDto>`
- Decorador `@Injectable()`
- Inyecta `ChatGateway` en constructor
- Método `update(message: MessageDto)`:
  - Valida `message.chat_type === 'group'`
  - Extrae `room_id` (formato: `group-${groupId}`)
  - Llama `chatGateway.emitToRoom(roomId, 'NUEVO_MENSAJE', enrichedMessage)`
  - Enriquece mensaje con `timestamp` y `channel: 'group'`
  - Logging de emisión exitosa

### FR4: ChatGateway (Infraestructura WebSocket)
**Prioridad**: CRÍTICA

- **FR4.1**: Crear `ChatGateway` en `src/messages/infrastructure/gateways/chat.gateway.ts`
- **FR4.2**: Decorador `@WebSocketGateway({ cors: { origin: '*' } })`
- **FR4.3**: Decorador `@Injectable()`
- **FR4.4**: Implementar `OnGatewayConnection` y `OnGatewayDisconnect`
- **FR4.5**: Decorador `@WebSocketServer()` para `server: Server`
- **FR4.6**: Handler `@SubscribeMessage('authenticate')` para validación JWT
- **FR4.7**: Handler `@SubscribeMessage('join_room')` para unir cliente a room
- **FR4.8**: Método público `emitToRoom(roomId: string, event: string, data: unknown): void`
  - Usa `this.server.to(roomId).emit(event, data)`
  - Logging de emisión
- **FR4.9**: Gestión de clientes conectados con `Map<string, ClientData>`

### FR5: MessagesService Coordinador (Aplicación)
**Prioridad**: CRÍTICA

- **FR5.1**: Crear `MessagesService` en `src/messages/application/messages.service.ts`
- **FR5.2**: Inyectar dependencias:
  - `ChatSubject`
  - `PrivateChatObserver`
  - `GroupChatObserver`
  - `PrismaService`
- **FR5.3**: Método `sendMessage(messageDto: MessageDto): Promise<MessageDto>`
  - **Paso 1**: Aplicar decoradores (moderación, archivos, menciones)
  - **Paso 2**: Determinar `chat_type` y `room_id`
  - **Paso 3**: Atar observador correspondiente: `chatSubject.attach(observer)`
  - **Paso 4**: Persistir mensaje en BD con Prisma
  - **Paso 5**: Llamar `chatSubject.notify(decoratedMessage)`
  - **Paso 6**: Retornar mensaje guardado
- **FR5.4**: Método privado `applyDecorators(message: MessageDto): MessageDto`
- **FR5.5**: Método privado `enrichMessageWithRoomInfo(message: MessageDto): MessageDto`
- **FR5.6**: Método privado `attachObserverForChatType(chatType: 'private' | 'group'): void`
- **FR5.7**: Método privado `persistMessage(message: MessageDto): Promise<MessageDto>`

### FR6: MessageDto (Data Transfer Object)
**Prioridad**: CRÍTICA

- **FR6.1**: Crear `MessageDto` en `src/messages/dto/message.dto.ts`
- **FR6.2**: Campos requeridos:
  ```typescript
  id_message?: number;
  id_membership?: number;
  sender_id?: number;
  recipient_id?: number;
  text_content: string;
  send_at: Date;
  attachments?: string;
  is_edited: boolean;
  // Campos calculados
  chat_type: 'private' | 'group';
  room_id: string;
  // Campos de decoradores
  decorators_applied?: string[];
  processed_at?: Date;
  ```
- **FR6.3**: Validación con `class-validator`
- **FR6.4**: Transformación con `class-transformer`

## Requisitos No Funcionales

### NFR1: Performance
- **NFR1.1**: Latencia de notificación < 100ms
- **NFR1.2**: Soporte para 100+ conexiones concurrentes
- **NFR1.3**: Gestión eficiente de memoria (limpiar observadores después de uso)

### NFR2: Reliability
- **NFR2.1**: Manejo de errores en observadores sin romper flujo
- **NFR2.2**: Logging completo con `Logger` de NestJS
- **NFR2.3**: Programación defensiva con try/catch

### NFR3: Security
- **NFR3.1**: Validación JWT en gateway antes de unir a rooms
- **NFR3.2**: Usuarios solo pueden unirse a rooms autorizados
- **NFR3.3**: Aislamiento estricto entre rooms privados y grupales

### NFR4: Maintainability
- **NFR4.1**: Tipado estricto TypeScript (CERO `any`)
- **NFR4.2**: Clean Architecture (Domain/Application/Infrastructure)
- **NFR4.3**: Interfaces claramente definidas
- **NFR4.4**: Tests unitarios con cobertura > 80%

## Requisitos Técnicos

### TR1: Estructura de Directorios
```
src/messages/
├── domain/
│   └── observer/
│       ├── interfaces/
│       │   ├── subject.interface.ts
│       │   └── observer.interface.ts
│       └── chat-subject.ts
├── infrastructure/
│   ├── observers/
│   │   ├── private-chat.observer.ts
│   │   └── group-chat.observer.ts
│   └── gateways/
│       └── chat.gateway.ts
├── application/
│   └── messages.service.ts
├── dto/
│   └── message.dto.ts
├── messages.module.ts
└── __tests__/
    ├── chat-subject.spec.ts
    ├── observers.spec.ts
    └── chat.gateway.spec.ts
```

### TR2: Dependencias
- `@nestjs/websockets@^11.1.19` ✅ (ya instalado)
- `@nestjs/platform-socket.io@^11.1.19` ✅ (ya instalado)
- `socket.io@^4.8.3` ✅ (ya instalado)

### TR3: Módulo NestJS
- Registrar todos los providers en `messages.module.ts`:
  - `ChatSubject`
  - `PrivateChatObserver`
  - `GroupChatObserver`
  - `ChatGateway`
  - `MessagesService` (nuevo, desde `application/`)
  - `MessagesService` (legacy, renombrar a `MessagesLegacyService`)
  - `MessageRepository`

### TR4: Integración con Sistema Existente
- **NO eliminar** `messages.gateway.ts` existente
- **Renombrar** a `messages-legacy.gateway.ts` si es necesario
- **Mantener** funcionalidad legacy mientras se implementa US-O02
- **Exportar** ambos servicios para compatibilidad

## Testing Requirements

### UT1: ChatSubject Tests
- Test: `attach()` agrega observador a lista
- Test: `detach()` remueve observador de lista
- Test: `notify()` llama `update()` en todos los observadores
- Test: `notify()` limpia lista después de notificación
- Test: `notify()` maneja errores de observadores sin romper

### UT2: Observers Tests
- Test: `PrivateChatObserver` solo procesa mensajes privados
- Test: `GroupChatObserver` solo procesa mensajes grupales
- Test: Observadores llaman `gateway.emitToRoom()` con parámetros correctos
- Test: Observadores enriquecen mensaje con metadata
- Test: Observadores manejan errores de gateway

### UT3: ChatGateway Tests
- Test: `emitToRoom()` llama `server.to().emit()` correctamente
- Test: Clientes pueden unirse a rooms
- Test: Autenticación valida JWT
- Test: Desconexión limpia sesiones

### UT4: MessagesService Tests
- Test: `sendMessage()` aplica decoradores antes de notificar
- Test: `sendMessage()` determina `chat_type` correctamente
- Test: `sendMessage()` ata observador correcto
- Test: `sendMessage()` persiste mensaje en BD
- Test: `sendMessage()` llama `chatSubject.notify()`

### IT1: Integration Tests
- Test: Mensaje grupal llega a todos los clientes del grupo
- Test: Mensaje privado solo llega a los dos participantes
- Test: Canales privados y grupales NO se cruzan
- Test: Mensaje decorado se persiste correctamente

## Out of Scope

- Implementación de decoradores específicos (archivos, menciones) - usar placeholders
- Frontend (React Native/Expo)
- Notificaciones push
- Persistencia de estado de conexiones
- Escalabilidad horizontal (múltiples instancias)
- Autenticación avanzada (usar JWT existente)

## Dependencies

- `AuthModule` existente (validación JWT)
- `PrismaModule` existente (persistencia)
- Esquema `message` y `membership` en Prisma
- `Logger` de NestJS

## Risks & Mitigations

| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|--------------|---------|------------|
| Complejidad del patrón Observer | Media | Bajo | Seguir diseño simple con interfaces claras |
| Conflicto con código legacy | Alta | Medio | Mantener ambos sistemas en paralelo |
| Performance de notificaciones | Baja | Alto | Limpiar observadores después de uso |
| Memory leaks | Media | Alto | Tests de memoria + monitoreo |

## Success Metrics

- ✅ 4/4 Criterios de Aceptación cumplidos
- ✅ Tests unitarios > 80% cobertura
- ✅ Latencia < 100ms para notificaciones
- ✅ Cero `any` en código TypeScript
- ✅ Clean Architecture implementada
- ✅ Separación estricta de canales validada
