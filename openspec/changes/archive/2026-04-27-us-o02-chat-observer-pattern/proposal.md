# Proposal: US-O02 - Observer Pattern para Chat en Tiempo Real

## Executive Summary

**Historia de Usuario**: US-O02 - Observer para mensajes del chat en tiempo real (5 pts)

**Objetivo**: Implementar el Patrón Observer formal para el sistema de chat en tiempo real, garantizando que los mensajes notifiquen automáticamente a todos los participantes conectados (web y mobile) mediante WebSockets (Socket.IO), con separación estricta de canales privados y grupales.

**Estado Actual**: El sistema tiene WebSockets funcionales pero NO implementa el patrón Observer formal ni tiene separación de canales. Cumplimiento actual: **23%**

**Propuesta**: Implementar Clean Architecture con capas Domain/Application/Infrastructure, creando interfaces `ISubject`/`IObserver`, sujeto concreto `ChatSubject`, observadores `PrivateChatObserver` y `GroupChatObserver`, y servicio coordinador `MessagesService`.

## Problem Statement

### Brechas Identificadas

1. **NO existe Patrón Observer formal**
   - Sistema actual usa `EventEmitter2` de NestJS
   - NO hay interfaces `ISubject<T>` ni `IObserver<T>`
   - NO hay `ChatSubject` como sujeto concreto

2. **NO hay separación de canales**
   - Solo existe soporte para chat grupal (`group-${id}`)
   - NO hay soporte para chat privado (`private-${id1}-${id2}`)
   - NO hay lógica para determinar `chat_type`

3. **Arquitectura plana (NO Clean Architecture)**
   - Todo en `src/messages/` sin separación de capas
   - NO hay directorios `domain/`, `application/`, `infrastructure/`

4. **Evento incorrecto**
   - Se emite `message:new`, NO `NUEVO_MENSAJE` como requiere US-O02

## Proposed Solution

### Architecture Overview

```
src/messages/
├── domain/                    # ✨ NUEVO - Lógica de negocio pura
│   └── observer/
│       ├── interfaces/
│       │   ├── subject.interface.ts      # ISubject<T>
│       │   └── observer.interface.ts     # IObserver<T>
│       └── chat-subject.ts               # ChatSubject
│
├── application/               # ✨ NUEVO - Casos de uso
│   └── messages.service.ts               # Coordinador principal
│
├── infrastructure/            # ✨ NUEVO - Implementaciones concretas
│   ├── observers/
│   │   ├── private-chat.observer.ts      # PrivateChatObserver
│   │   └── group-chat.observer.ts        # GroupChatObserver
│   └── gateways/
│       └── chat.gateway.ts               # ChatGateway (Socket.IO)
│
├── dto/
│   └── message.dto.ts                    # MessageDto con chat_type
│
├── messages.module.ts         # 🔧 MODIFICAR - Registrar nuevos providers
│
└── __tests__/                 # ✨ NUEVO - Tests unitarios
    ├── chat-subject.spec.ts
    ├── observers.spec.ts
    ├── chat.gateway.spec.ts
    └── messages.service.spec.ts
```

### Key Components

#### 1. Domain Layer (Patrón Observer Puro)

**ISubject<T>** - Interfaz del sujeto
```typescript
interface ISubject<T> {
  attach(observer: IObserver<T>): void;
  detach(observer: IObserver<T>): void;
  notify(data: T): void;
}
```

**IObserver<T>** - Interfaz del observador
```typescript
interface IObserver<T> {
  update(data: T): void;
}
```

**ChatSubject** - Sujeto concreto
- Implementa `ISubject<MessageDto>`
- Mantiene lista de observadores
- Notifica a todos los observadores
- Limpia lista después de notificación (patrón one-time)

#### 2. Infrastructure Layer (Observadores Concretos)

**PrivateChatObserver**
- Implementa `IObserver<MessageDto>`
- Solo procesa mensajes con `chat_type === 'private'`
- Emite a room `private-${userId1}-${userId2}`
- Enriquece mensaje con metadata

**GroupChatObserver**
- Implementa `IObserver<MessageDto>`
- Solo procesa mensajes con `chat_type === 'group'`
- Emite a room `group-${groupId}`
- Enriquece mensaje con metadata

**ChatGateway**
- WebSocket Gateway con Socket.IO
- Método público `emitToRoom(roomId, event, data)`
- Handlers: `authenticate`, `join_room`
- Gestión de clientes conectados

#### 3. Application Layer (Coordinador)

**MessagesService**
- Orquesta el flujo completo:
  1. Aplicar decoradores (moderación, archivos, menciones)
  2. Determinar `chat_type` y `room_id`
  3. Atar observador correspondiente
  4. Persistir mensaje en BD
  5. Llamar `chatSubject.notify()`

### Message Flow

```
Client (Web/Mobile)
  │
  ▼
ChatGateway.handleMessage()
  │
  ▼
MessagesService.sendMessage()
  │
  ├─▶ applyDecorators()           # Moderación, archivos, menciones
  ├─▶ enrichMessageWithRoomInfo() # Determinar chat_type y room_id
  ├─▶ attachObserverForChatType() # Atar PrivateChatObserver o GroupChatObserver
  ├─▶ persistMessage()            # Guardar en BD con Prisma
  └─▶ chatSubject.notify()        # Notificar observadores
      │
      ▼
Observer.update()                 # PrivateChatObserver o GroupChatObserver
  │
  ▼
ChatGateway.emitToRoom()
  │
  ▼
server.to(roomId).emit('NUEVO_MENSAJE', data)
  │
  ▼
All Clients in Room Receive Message
```

## Acceptance Criteria Mapping

### AC1: ChatSubject Implementado ✅
- ✅ Interfaz `ISubject<MessageDto>` definida
- ✅ Clase `ChatSubject` implementa interfaz
- ✅ Emite evento `NUEVO_MENSAJE` con DTO decorado
- ✅ Observadores reciben mensaje decorado

### AC2: Notificación Multi-Cliente ✅
- ✅ ChatGateway usa Socket.IO
- ✅ Clientes web y mobile pueden conectarse
- ✅ Método `server.to(roomId).emit()` envía a todos
- ✅ Latencia < 100ms

### AC3: Decoradores Aplicados ✅
- ✅ Decoradores aplicados en `MessagesService.sendMessage()`
- ✅ Aplicación ANTES de `chatSubject.notify()`
- ✅ Observadores reciben mensaje decorado
- ✅ Mensaje decorado persiste en BD

### AC4: Separación de Canales ✅
- ✅ `PrivateChatObserver` solo emite a rooms privados
- ✅ `GroupChatObserver` solo emite a rooms grupales
- ✅ Lógica de determinación de `chat_type`
- ✅ Solo un observador se ata por mensaje
- ✅ Tests validan NO cruce de canales

## Technical Specifications

### Technology Stack
- **Framework**: NestJS 11.x
- **WebSockets**: Socket.IO 4.8.x ✅ (ya instalado)
- **ORM**: Prisma 7.4.x ✅ (ya instalado)
- **Testing**: Jest 30.x ✅ (ya instalado)
- **Language**: TypeScript 5.7.x (strict mode)

### Dependencies
- `@nestjs/websockets@^11.1.19` ✅
- `@nestjs/platform-socket.io@^11.1.19` ✅
- `socket.io@^4.8.3` ✅
- `class-validator` ✅
- `class-transformer` ✅

### Non-Functional Requirements
- **Performance**: Latencia < 100ms para notificaciones
- **Scalability**: Soporte para 100+ conexiones concurrentes
- **Reliability**: Manejo de errores sin romper flujo
- **Security**: Validación JWT, aislamiento de canales
- **Maintainability**: Tipado estricto (CERO `any`), Clean Architecture

## Implementation Plan

### Phase 1: Domain Layer (1.5 hours)
- Task 1.1: Create Observer Interfaces (30 min)
- Task 1.2: Implement ChatSubject (1 hour)

### Phase 2: Infrastructure Layer (3 hours)
- Task 2.1: Create ChatGateway (1.5 hours)
- Task 2.2: Implement PrivateChatObserver (45 min)
- Task 2.3: Implement GroupChatObserver (45 min)

### Phase 3: Application Layer (2.5 hours)
- Task 3.1: Create MessageDto (30 min)
- Task 3.2: Implement MessagesService (2 hours)

### Phase 4: Module Configuration (0.5 hours)
- Task 4.1: Update MessagesModule (30 min)

### Phase 5: Testing (5 hours)
- Task 5.1: Unit Tests for ChatSubject (1 hour)
- Task 5.2: Unit Tests for Observers (1.5 hours)
- Task 5.3: Unit Tests for ChatGateway (1 hour)
- Task 5.4: Unit Tests for MessagesService (1.5 hours)

### Phase 6: Integration & Validation (4 hours)
- Task 6.1: Integration Testing (2 hours)
- Task 6.2: Manual Testing & Validation (1 hour)
- Task 6.3: Documentation (1 hour)

**Total Duration**: 16.5 hours (~4 days)

## Risk Assessment

| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|--------------|---------|------------|
| Conflicto con código legacy | Alta | Medio | Mantener ambos sistemas en paralelo |
| Complejidad del patrón | Media | Bajo | Seguir diseño simple con interfaces claras |
| Performance de notificaciones | Baja | Alto | Limpiar observadores después de uso |
| Memory leaks | Media | Alto | Tests de memoria + monitoreo |
| Testing de WebSockets | Media | Medio | Usar mocks de Socket.IO |

## Success Metrics

### Functional Metrics
- ✅ 4/4 Criterios de Aceptación cumplidos
- ✅ Tests unitarios > 80% cobertura
- ✅ Tests de integración pasando
- ✅ Separación de canales validada

### Technical Metrics
- ✅ Latencia < 100ms para notificaciones
- ✅ Cero `any` en código TypeScript
- ✅ Clean Architecture implementada
- ✅ Logging completo con NestJS Logger

### Quality Metrics
- ✅ Cero regresiones en funcionalidad existente
- ✅ Código revisado y aprobado
- ✅ Documentación actualizada
- ✅ Manual testing exitoso

## Migration Strategy

### Backward Compatibility
- **NO eliminar** código legacy existente
- **Mantener** `messages.gateway.ts` funcional
- **Coexistencia** de ambos sistemas durante transición
- **Feature flag** para habilitar nuevo sistema (opcional)

### Rollout Plan
1. **Fase 1**: Implementar nuevo sistema en paralelo
2. **Fase 2**: Testing exhaustivo (unit + integration)
3. **Fase 3**: Validación manual con clientes web y mobile
4. **Fase 4**: Monitoreo de métricas y errores
5. **Fase 5**: Deprecación gradual del sistema legacy (futuro)

## Deliverables

### Code Artifacts
- ✅ 11 archivos nuevos (interfaces, clases, tests)
- ✅ 1 archivo modificado (messages.module.ts)
- ✅ 100% tipado estricto TypeScript
- ✅ JSDoc completo en todas las clases públicas

### Documentation
- ✅ requirements.md (especificación funcional)
- ✅ design.md (arquitectura y diseño técnico)
- ✅ tasks.md (plan de implementación detallado)
- ✅ AGENTS.md actualizado con estado de US-O02

### Testing
- ✅ 4 archivos de tests unitarios
- ✅ 1 archivo de tests de integración
- ✅ Cobertura > 80%
- ✅ Property-based testing con fast-check (opcional)

## Approval & Next Steps

### Approval Checklist
- [ ] Requirements revisados y aprobados
- [ ] Design revisado y aprobado
- [ ] Tasks revisados y aprobados
- [ ] Estimación de tiempo aceptada
- [ ] Riesgos identificados y mitigados

### Next Steps
1. **Aprobación**: Revisar y aprobar esta propuesta
2. **Kickoff**: Reunión de inicio con equipo
3. **Implementación**: Seguir tasks.md fase por fase
4. **Code Review**: Revisión continua durante desarrollo
5. **Testing**: Validación exhaustiva antes de merge
6. **Deployment**: Merge a rama dev y deploy a staging
7. **Monitoring**: Monitoreo de métricas post-deployment

---

**Propuesta creada**: 27 de Abril, 2026  
**Autor**: Kiro AI Agent  
**Estado**: Pendiente de Aprobación  
**Estimación**: 16.5 horas (~4 días)
