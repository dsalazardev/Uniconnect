# Design: US-O01 - Observer Pattern for Study Group Events

## Context

**Current State**: Study groups use EventEmitter2 (GroupActivityListener) for lifecycle events (created, updated, deleted). However, there's no real-time notification system for user-specific events like join requests, member acceptance/rejection, or admin transfers.

**Problem**: Users don't receive immediate notifications when:
- Someone requests to join their group (owner notification)
- Their join request is accepted/rejected (requester notification)
- Group ownership is transferred to them (new owner notification)

**Existing Infrastructure**:
- `ISubject<T>` and `IObserver<T>` interfaces in `src/messages/domain/observer/interfaces/` (from US-O02)
- `ChatGateway` and `ChatSessionManager` for WebSocket management
- `PrismaService` with `notification` model
- EventEmitter2 for global events (GroupActivityListener)

**Stakeholders**: Frontend (React Native) will consume WebSocket events and display notifications in real-time.

## Goals / Non-Goals

**Goals:**
- Implement classic Observer pattern for study group events
- Real-time WebSocket notifications to specific users
- Persistent notifications in database for offline users
- Type-safe event handling with discriminated unions
- Reuse existing interfaces from messages module
- Coexist with EventEmitter2 pattern

**Non-Goals:**
- Not replacing EventEmitter2 (different purposes)
- Not implementing push notifications (separate concern)
- Not modifying existing GroupActivityListener
- Not changing notification model schema
- Not implementing notification read/unread UI logic

## Decisions

### Decision 1: Reuse ISubject/IObserver from Messages Module

**Option Chosen**: Import interfaces from `src/messages/domain/observer/interfaces/`

**Alternatives Considered**:
- Option A: Create new interfaces in groups module → ❌ Code duplication
- Option B: Move interfaces to shared `src/common/` → ❌ Premature abstraction (only 2 modules)

**Rationale**: 
- Interfaces are generic with no module-specific dependencies
- Maintains consistency with US-O02 implementation
- TypeScript allows cross-module imports without coupling
- Follows DRY principle

### Decision 2: StudyGroupEvent Type Structure

**Option Chosen**: Discriminated union with type field

```typescript
interface StudyGroupEvent {
  type: 'JOIN_REQUEST' | 'MEMBER_ACCEPTED' | 'MEMBER_REJECTED' | 
        'ADMIN_TRANSFER_REQUESTED' | 'ADMIN_TRANSFER_ACCEPTED';
  payload: GroupJoinRequestSentPayload | GroupJoinRequestAcceptedPayload | 
           GroupJoinRequestRejectedPayload | AdminTransferRequestedPayload | 
           AdminTransferAcceptedPayload;
  targetUserId: number; // Recipient of notification
  timestamp: Date;
}
```

**Alternatives Considered**:
- Option A: Separate event classes → ❌ Verbose, harder to type
- Option B: Generic payload object → ❌ Loses type safety

**Rationale**:
- Type-safe pattern matching in observers
- Compiler enforces exhaustive handling
- Easy to extend with new event types
- `targetUserId` simplifies observer logic

### Decision 3: Observer Placement (Domain vs Infrastructure)

**Option Chosen**: Observers in `infrastructure/observers/`

**Alternatives Considered**:
- Option A: All in `domain/observer/` → ❌ Mixes pure domain with technical concerns
- Option B: Separate modules → ❌ Over-engineering for 2 observers

**Rationale**:
- WebSocket and Prisma are infrastructure concerns
- Subject is domain logic (business rules)
- Follows Clean Architecture layers
- Consistent with messages module structure

### Decision 4: Subject Lifecycle (Singleton vs Scoped)

**Option Chosen**: Scoped instance (NestJS default)

**Alternatives Considered**:
- Option A: Singleton pattern → ❌ Unnecessary, NestJS handles DI
- Option B: One-time use (like ChatSubject) → ❌ Subject lives for module lifetime

**Rationale**:
- Subject needs to persist across multiple notifications
- Observers attached once at module init
- NestJS DI provides scoped singleton behavior
- Simpler than manual singleton management

### Decision 5: Integration with GroupsService

**Option Chosen**: Inject `StudyGroupSubject` and call `subject.notify()` after successful operations

**Injection Points**:
1. `requestJoinGroup()` → `JOIN_REQUEST` (notify owner)
2. `acceptJoinRequest()` → `MEMBER_ACCEPTED` (notify requester)
3. `rejectJoinRequest()` → `MEMBER_REJECTED` (notify requester)
4. `transferOwnership()` → `ADMIN_TRANSFER_REQUESTED` + `ADMIN_TRANSFER_ACCEPTED` (notify both parties)

**Alternatives Considered**:
- Option A: Use only EventEmitter2 → ❌ Doesn't provide Observer pattern benefits
- Option B: Observers listen to EventEmitter2 → ❌ Indirect, harder to test

**Rationale**:
- Direct control over notification flow
- Easy to test with mock subject
- Clear separation: EventEmitter2 for global events, Observer for user notifications
- Follows US-O02 pattern

### Decision 6: WebSocket Event Name

**Option Chosen**: `'study_group_notification'`

**Alternatives Considered**:
- Option A: Multiple event names per type → ❌ Frontend must handle 5 events
- Option B: Generic `'notification'` → ❌ Too broad, conflicts with other modules

**Rationale**:
- Single event simplifies frontend handling
- Event type discriminator in payload
- Namespaced to avoid conflicts

### Decision 7: Notification Message Format

**Option Chosen**: Human-readable Spanish messages (database storage)

**Examples**:
- `JOIN_REQUEST`: "Usuario {name} solicitó unirse al grupo '{group}'"
- `MEMBER_ACCEPTED`: "Tu solicitud para unirte a '{group}' fue aceptada"
- `MEMBER_REJECTED`: "Tu solicitud para unirte a '{group}' fue rechazada"
- `ADMIN_TRANSFER_REQUESTED`: "Te han transferido la administración del grupo '{group}'"
- `ADMIN_TRANSFER_ACCEPTED`: "Transferiste la administración del grupo '{group}' a {name}"

**Rationale**:
- Matches existing notification format in database
- Frontend can display directly without translation
- Consistent with GroupActivityListener messages

## Risks / Trade-offs

### Risk 1: Observer Notification Failures
**Risk**: If WebSocket observer fails, user doesn't get real-time notification  
**Mitigation**: 
- Persistence observer always saves to DB (fallback)
- Try/catch in `subject.notify()` prevents cascade failures
- Logging for debugging

### Risk 2: MessagesModule Dependency
**Risk**: GroupsModule now depends on MessagesModule (circular dependency potential)  
**Mitigation**:
- Only import ChatGateway and ChatSessionManager (no circular imports)
- Interfaces are in shared location
- Document dependency in module comments

### Risk 3: Event Type Mismatch
**Risk**: Payload type doesn't match event type (runtime error)  
**Mitigation**:
- TypeScript discriminated unions enforce type safety
- Factory methods in StudyGroupSubject validate payload
- Unit tests verify type correctness

### Risk 4: Missing targetUserId
**Risk**: Event payload doesn't contain recipient information  
**Mitigation**:
- `targetUserId` is required field in `StudyGroupEvent`
- Validation in subject before notify
- Clear error messages if missing

### Trade-off 1: Dual Notification Systems
**Trade-off**: EventEmitter2 and Observer pattern coexist  
**Justification**: 
- EventEmitter2 for global lifecycle events (all members)
- Observer for targeted user notifications (specific recipient)
- Different purposes, minimal overlap

### Trade-off 2: Synchronous vs Asynchronous Observers
**Trade-off**: `update()` is synchronous, but Prisma operations are async  
**Justification**:
- PersistenceObserver uses `void` return + fire-and-forget
- Errors logged but don't block notification flow
- Acceptable for non-critical notifications

## Migration Plan

### Phase 1: Domain Layer
1. Create `StudyGroupEvent` interface
2. Create `StudyGroupSubject` class
3. Unit tests for subject (attach, detach, notify)

### Phase 2: Infrastructure Layer
1. Create `WebSocketNotificationObserver`
2. Create `PersistenceNotificationObserver`
3. Unit tests for both observers

### Phase 3: Events Extension
1. Add `ADMIN_TRANSFER_REQUESTED` and `ADMIN_TRANSFER_ACCEPTED` to `MESSAGE_EVENTS`
2. Create `AdminTransferRequestedPayload` and `AdminTransferAcceptedPayload` interfaces

### Phase 4: Module Integration
1. Add 3 providers to `GroupsModule`
2. Implement `OnModuleInit` to attach observers
3. Import `MessagesModule`

### Phase 5: Service Integration
1. Inject `StudyGroupSubject` in `GroupsService`
2. Add `subject.notify()` calls in 4 methods
3. Integration tests

### Phase 6: Documentation
1. Create UML diagram in README.md
2. Document event flow and observer responsibilities

### Rollback Strategy
- If issues arise, remove `subject.notify()` calls (notifications stop, no data loss)
- EventEmitter2 continues working independently
- No database schema changes required

## Open Questions

1. **Should admin transfer emit 1 or 2 events?**  
   → **Decision**: 2 events (REQUESTED for new owner, ACCEPTED for old owner)

2. **Should all group members be notified of admin transfer?**  
   → **Decision**: No, only the 2 parties involved (old and new owner)

3. **What if user has multiple sockets (multiple devices)?**  
   → **Decision**: ChatSessionManager returns all sockets, emit to all

4. **Should notifications be marked as `push_sent: true`?**  
   → **Decision**: No, that's for actual push notifications (separate system)

5. **Error handling if Prisma fails?**  
   → **Decision**: Log error, don't throw (fire-and-forget pattern)
